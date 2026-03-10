import { callParseJournal } from "@/lib/groq";

const VALID_PARSED = {
  activities: [
    {
      name: "Study ML",
      category: "study_ml",
      duration_minutes: 120,
      confidence: 0.9
    }
  ],
  alignment_score: 7,
  summary: "Productive study session focused on ML fundamentals."
};

function makeMockResponse(body: object, status = 200) {
  return Promise.resolve({
    ok: status < 400,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body)
  } as unknown as Response);
}

beforeEach(() => {
  process.env.GROQ_API_KEY = "test-key";
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("callParseJournal", () => {
  it("successfully parses a valid Groq response (tool_calls path)", async () => {
    jest.spyOn(global, "fetch").mockReturnValueOnce(
      makeMockResponse({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  function: {
                    name: "parse_journal",
                    arguments: JSON.stringify(VALID_PARSED)
                  }
                }
              ]
            }
          }
        ]
      })
    );

    const result = await callParseJournal("Studied ML today for 2 hours.", {
      categories: ["study_ml", "exercise"]
    });
    expect(result.alignment_score).toBe(7);
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].name).toBe("Study ML");
  });

  it("successfully parses a valid Groq response (function_call legacy path)", async () => {
    jest.spyOn(global, "fetch").mockReturnValueOnce(
      makeMockResponse({
        choices: [
          {
            message: {
              function_call: {
                name: "parse_journal",
                arguments: JSON.stringify(VALID_PARSED)
              }
            }
          }
        ]
      })
    );

    const result = await callParseJournal("Legacy path test", {
      categories: ["study_ml"]
    });
    expect(result.summary).toContain("ML");
  });

  it("throws when Groq API returns non-200", async () => {
    jest.spyOn(global, "fetch").mockReturnValueOnce(
      makeMockResponse({ error: "Unauthorized" }, 401)
    );

    await expect(
      callParseJournal("Some text", { categories: [] })
    ).rejects.toThrow(/Groq API error: 401/);
  });

  it("throws when function call arguments are missing", async () => {
    jest.spyOn(global, "fetch").mockReturnValueOnce(
      makeMockResponse({
        choices: [{ message: {} }]
      })
    );

    await expect(
      callParseJournal("Some text", { categories: [] })
    ).rejects.toThrow(/missing function call arguments/);
  });

  it("throws when returned JSON fails AJV schema validation", async () => {
    const badArgs = { activities: "not-an-array", alignment_score: "nan" };
    jest.spyOn(global, "fetch").mockReturnValueOnce(
      makeMockResponse({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  function: {
                    arguments: JSON.stringify(badArgs)
                  }
                }
              ]
            }
          }
        ]
      })
    );

    await expect(
      callParseJournal("Some text", { categories: [] })
    ).rejects.toThrow(/schema validation/);
  });

  it("throws when GROQ_API_KEY is not set", async () => {
    delete process.env.GROQ_API_KEY;
    await expect(
      callParseJournal("Some text", { categories: [] })
    ).rejects.toThrow(/GROQ_API_KEY/);
  });
});
