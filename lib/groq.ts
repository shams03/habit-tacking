import Ajv from "ajv";
import {
  ParsedJournal,
  parseJournalFunctionSchema,
  SYSTEM_PROMPT,
  FOLLOWUP_SYSTEM_PROMPT,
  HELP_SYSTEM_PROMPT
} from "./llmSchema";

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(parseJournalFunctionSchema.parameters as object);

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ─── Journal parsing ─────────────────────────────────────────────────────────

export async function callParseJournal(
  rawText: string,
  userGoalContext: { categories: string[]; recentContext?: string }
): Promise<ParsedJournal> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  // SECURITY: Limit raw journal text size to prevent prompt injection via oversized payloads.
  const sanitizedText = rawText.slice(0, 4000);

  const userContent = [
    `User goal categories: ${userGoalContext.categories.join(", ")}`,
    userGoalContext.recentContext
      ? `Recent activity history (last 5 entries):\n${userGoalContext.recentContext}`
      : "",
    `\nJournal entry:\n${sanitizedText}`
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}` // SECURITY: Key from env only.
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.0, // SECURITY: Deterministic output reduces prompt injection surface.
      max_tokens: 1600,
      tools: [
        {
          type: "function",
          function: parseJournalFunctionSchema
        }
      ],
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ],
      tool_choice: {
        type: "function",
        function: { name: "parse_journal" }
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    choices: Array<{
      message: {
        tool_calls?: Array<{ function: { arguments: string } }>;
        function_call?: { arguments: string };
      };
    }>;
  };

  const rawArgs =
    data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ??
    data.choices?.[0]?.message?.function_call?.arguments;

  if (!rawArgs) {
    throw new Error(
      "Groq response missing function call arguments. Full response: " +
        JSON.stringify(data).slice(0, 500)
    );
  }

  const args = JSON.parse(rawArgs) as unknown;

  // SECURITY: Validate every field before persisting — rejects malformed LLM output.
  const valid = validate(args);
  if (!valid) {
    throw new Error(
      "Groq parse_journal arguments failed schema validation: " +
        JSON.stringify(validate.errors)
    );
  }

  return args as ParsedJournal;
}

// ─── Follow-up assessment ─────────────────────────────────────────────────────

export async function callFollowUp(
  followUpQuestion: string,
  userAnswer: string,
  goalTitle: string,
  recentSummaries: string
): Promise<{ assessment: string }> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const userContent = [
    `User's goal: ${goalTitle}`,
    recentSummaries ? `Recent activity context:\n${recentSummaries}` : "",
    `\nAI asked: ${followUpQuestion}`,
    `User replied: ${userAnswer.slice(0, 1000)}`
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        { role: "system", content: FOLLOWUP_SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const assessment = data.choices?.[0]?.message?.content ?? "";
  return { assessment };
}

// ─── Help chat ────────────────────────────────────────────────────────────────

export type ChatMsg = { role: "user" | "assistant"; content: string };

export async function callChat(
  recentMessages: ChatMsg[],
  conversationSummary: string | null,
  userContext: string
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const systemContent = [
    HELP_SYSTEM_PROMPT,
    "\n--- USER CONTEXT ---",
    userContext,
    conversationSummary
      ? `\n--- CONVERSATION SUMMARY (earlier messages) ---\n${conversationSummary}`
      : ""
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemContent },
        ...recentMessages
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Context summarisation ────────────────────────────────────────────────────

export async function callSummarize(
  messages: ChatMsg[],
  existingSummary: string | null
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const prior = existingSummary
    ? `Existing summary:\n${existingSummary}\n\nNew messages to incorporate:\n`
    : "Summarise the following conversation:\n";

  const transcript = messages
    .map(m => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
    .join("\n");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.0,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content:
            "You are a conversation summariser. Produce a dense, factual summary preserving all key insights about the user's strengths, weaknesses, goals, advice given, and commitments made. Keep it under 300 words."
        },
        { role: "user", content: prior + transcript }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices?.[0]?.message?.content ?? "";
}
