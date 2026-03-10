# Learning Guide — Goal Alignment Tracker

This file explains every technology and concept used in this project, written for someone who is new to web development. No jargon without explanation. Real code from this project throughout.

---

## Table of Contents

1. [The Big Picture — How a Web App Works](#1-the-big-picture)
2. [Next.js — The Framework](#2-nextjs)
3. [TypeScript — JavaScript with Safety Nets](#3-typescript)
4. [Tailwind CSS — Styling Without Writing CSS Files](#4-tailwind-css)
5. [Framer Motion — Animations](#5-framer-motion)
6. [Recharts — Line Charts and Pie Charts](#6-recharts)
7. [React Three Fiber — 3D Visualisation](#7-react-three-fiber)
8. [Prisma — Talking to the Database](#8-prisma)
9. [API Routes — Your Backend Lives Here](#9-api-routes)
10. [Authentication — Sessions and Cookies](#10-authentication)
11. [Groq / LLM — AI Integration](#11-groq--llm)
12. [Rate Limiting — Protecting Your API](#12-rate-limiting)
13. [AJV — Validating AI Output](#13-ajv)
14. [How All the Pieces Connect](#14-how-all-the-pieces-connect)

---

## 1. The Big Picture

Think of a web app like a restaurant:

| Restaurant | Web App |
|---|---|
| The dining room customers see | The **frontend** (React/Next.js pages) |
| The kitchen that actually cooks | The **backend** (API routes) |
| The pantry that stores ingredients | The **database** (PostgreSQL via Supabase) |
| The menu telling you what to order | The **API** (the list of URLs your frontend can call) |

When you open `localhost:3000/dashboard`:
1. Your browser asks Next.js for the dashboard page.
2. Next.js sends back the HTML/JavaScript.
3. The page runs in your browser and calls `/api/dashboard`.
4. The API route goes to the database, fetches your journal entries, and sends them back as JSON.
5. The page uses that JSON to draw the charts and the 3D path.

---

## 2. Next.js

**What it is:** A framework built on top of React that handles routing (URLs), server-side code, and page rendering all in one place.

**Why not just React?** Plain React only runs in the browser. Next.js lets you also run code on the server (where your database password is safe), and it automatically turns file names into URLs.

### File = URL

```
app/dashboard/page.tsx     →  localhost:3000/dashboard
app/journal/page.tsx       →  localhost:3000/journal
app/help/page.tsx          →  localhost:3000/help
app/api/chat/route.ts      →  localhost:3000/api/chat   ← backend endpoint
```

No router configuration needed. Just create the file.

### "use client" vs Server Components

```tsx
// app/dashboard/page.tsx — top of file
"use client";
```

Next.js 14 has two kinds of components:

| Type | Runs where | Can use useState/useEffect? | Can talk to database? |
|---|---|---|---|
| Server Component (default) | Server only | ❌ | ✅ |
| Client Component (`"use client"`) | Browser | ✅ | ❌ |

The dashboard page has `"use client"` because it uses `useEffect` to fetch data after the page loads and `useState` to store that data.

### Dynamic Imports

```tsx
// app/dashboard/page.tsx
const Path3D = dynamic(
  () => import("@/components/Path/Path3D"),
  { ssr: false }
);
```

`dynamic()` means "don't load this component until the browser needs it." The `ssr: false` part means "never try to run this on the server." This is required for Three.js (the 3D library) because it uses browser-only APIs like `WebGL` that don't exist on a server.

Without this, you'd get an error like: `ReferenceError: window is not defined`.

---

## 3. TypeScript

**What it is:** JavaScript, but you declare what *type* each variable is. The editor then tells you when you're using it wrong — before you even run the code.

### Without TypeScript (JavaScript):

```js
function greet(user) {
  return "Hello " + user.nane; // typo: "nane" instead of "name"
  // JavaScript: silently prints "Hello undefined"
}
```

### With TypeScript:

```ts
type User = {
  name: string;
  email: string;
};

function greet(user: User) {
  return "Hello " + user.nane; // ← red squiggle: Property 'nane' does not exist
}
```

TypeScript catches the typo **while you type**.

### How we use it in this project:

```tsx
// app/dashboard/page.tsx

type Stats = {
  totalEntries: number;
  bestScore: number;
  streak: number;
  avgScore: number;
};

type DashboardData = {
  lineData: LinePoint[];   // array of {date, score} objects
  pieData: PieSlice[];     // array of {name, value} objects
  activityDays: ActivityDay[];
  pathEntries: PathEntry[];
  stats: Stats;
};

// Now when we write data.stats.totalEntries, TypeScript knows it's a number.
// If we accidentally write data.stats.totalEntreis, it immediately shows an error.
```

### The `?` operator means "optional":

```ts
type Activity = {
  name: string;             // required — must always exist
  category?: string;        // optional — might be undefined
  duration_minutes: number; // required
};
```

---

## 4. Tailwind CSS

**What it is:** Instead of writing a separate CSS file, you add small utility classes directly to your HTML elements. Each class does one specific thing.

### Traditional CSS approach:

```css
/* styles.css */
.card {
  background-color: #1e293b;
  border-radius: 12px;
  border: 1px solid rgba(51, 65, 85, 0.6);
  padding: 16px;
}
```

```html
<div class="card">...</div>
```

### Tailwind approach:

```tsx
<div className="bg-slate-800 rounded-xl border border-slate-700/60 p-4">
  ...
</div>
```

Every class maps to exactly one CSS property:

| Tailwind class | What it does |
|---|---|
| `bg-slate-800` | background-color: the dark slate color |
| `rounded-xl` | border-radius: extra large (12px) |
| `border` | adds a 1px border |
| `border-slate-700/60` | border color: slate-700 at 60% opacity |
| `p-4` | padding: 16px on all sides |
| `px-4` | padding: 16px on left and right only |
| `py-2` | padding: 8px on top and bottom only |
| `text-sm` | font-size: small (14px) |
| `font-bold` | font-weight: bold |
| `text-slate-400` | text color: medium grey |
| `flex` | display: flex (puts children side by side) |
| `items-center` | align items vertically centered |
| `gap-3` | 12px space between flex children |
| `grid` | display: grid |
| `grid-cols-2` | 2 equal columns |
| `md:grid-cols-4` | on medium+ screens: 4 columns instead |
| `hidden sm:inline` | hide on mobile, show on small+ screens |
| `hover:bg-slate-700` | change background on mouse hover |
| `transition` | animate property changes smoothly |
| `animate-pulse` | pulsing opacity animation (loading state) |
| `w-full` | width: 100% |
| `h-[340px]` | height: exactly 340px (custom value in brackets) |
| `min-h-screen` | minimum height: 100% of the screen height |
| `space-y-8` | 32px vertical gap between children |
| `overflow-hidden` | hide anything that goes outside the box |
| `z-50` | z-index: 50 (appears above other elements) |

### Responsive design with prefixes:

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
```

- `grid-cols-2` → 2 columns on all screen sizes by default
- `md:grid-cols-4` → on screens ≥ 768px wide, switch to 4 columns

No media queries needed. Tailwind handles it.

### Custom components in `globals.css`:

```css
/* app/globals.css */
@layer components {
  .card {
    @apply rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-sm;
  }
  .btn-primary {
    @apply w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold
           text-white transition hover:bg-indigo-500 disabled:opacity-50;
  }
}
```

`@apply` lets you bundle multiple Tailwind classes under one custom class name. So anywhere you write `className="card"`, you get all those styles.

---

## 5. Framer Motion

**What it is:** A library that makes animations easy. You describe the start state, the end state, and it handles the in-between.

### Basic animation — fade in + slide up:

```tsx
import { motion } from "framer-motion";

// Without animation:
<div>Hello</div>

// With animation (fades in and slides up from 12px below):
<motion.div
  initial={{ opacity: 0, y: 12 }}   // start: invisible, 12px below
  animate={{ opacity: 1, y: 0 }}    // end: fully visible, in place
  transition={{ delay: 0.1 }}       // wait 0.1s before starting
>
  Hello
</motion.div>
```

`motion.div` is just a regular `<div>` that understands animation props. You can do `motion.p`, `motion.span`, `motion.li` — any HTML element.

### Animating a list with staggered delay:

```tsx
// app/journal/page.tsx
{parsed.activities.map((a, idx) => (
  <motion.li
    key={idx}
    initial={{ opacity: 0, x: -12 }}   // start: invisible, 12px to the left
    animate={{ opacity: 1, x: 0 }}     // end: visible, in place
    transition={{ delay: idx * 0.06 }} // each item starts 0.06s after the previous
  >
    {a.name}
  </motion.li>
))}
```

`idx * 0.06` means: item 0 starts at 0s, item 1 at 0.06s, item 2 at 0.12s, etc. This creates a "cascade" effect.

### AnimatePresence — animating elements that appear/disappear:

```tsx
import { AnimatePresence } from "framer-motion";

<AnimatePresence>
  {error && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}   // starts invisible and collapsed
      animate={{ opacity: 1, height: "auto" }} // expands open
      exit={{ opacity: 0, height: 0 }}      // collapses when removed
    >
      {error}
    </motion.div>
  )}
</AnimatePresence>
```

Without `AnimatePresence`, React just yanks the element out of the DOM instantly. With it, the `exit` animation plays before removal.

### The animated score bar in journal results:

```tsx
<motion.div
  className="h-full rounded-full bg-emerald-500"
  initial={{ width: 0 }}
  animate={{ width: `${((score + 10) / 20) * 100}%` }}
  transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
/>
```

`score` ranges from -10 to +10. The formula `((score + 10) / 20) * 100` converts it to a 0–100% width:
- score = -10 → 0%
- score = 0 → 50%
- score = +10 → 100%

### The shared navigation pill animation:

```tsx
// components/Nav/Navbar.tsx
{active && (
  <motion.span
    layoutId="nav-pill"   // same layoutId = Framer Motion tracks it across renders
    className="absolute inset-0 rounded-lg bg-slate-800"
    transition={{ type: "spring", stiffness: 400, damping: 32 }}
  />
)}
```

`layoutId` is the magic here. When you click a different nav link, Framer Motion sees the same `nav-pill` element moving to a new position and smoothly animates between them — like a physical pill sliding along the nav bar.

---

## 6. Recharts

**What it is:** A library for drawing data charts — line graphs, pie charts, bar charts — using React components.

### How charts work conceptually:

You give it an array of data objects and tell it which keys to use for which axes.

### Line chart (Alignment Trend):

```tsx
// components/Dashboard/Charts.tsx

const lineData = [
  { date: "Mar 1", score: 3 },
  { date: "Mar 2", score: 6 },
  { date: "Mar 3", score: -2 },
];

<ResponsiveContainer width="100%" height="100%">
  <LineChart data={lineData}>

    {/* Dotted grid lines in the background */}
    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

    {/* X-axis uses the "date" key from each data object */}
    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />

    {/* Y-axis goes from -10 to +10 */}
    <YAxis domain={[-10, 10]} />

    {/* Popup when you hover over a point */}
    <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8 }} />

    {/* The actual line, using the "score" key */}
    <Line
      type="monotone"     // smooth curve (vs "linear" for straight segments)
      dataKey="score"     // which key to plot on the Y axis
      stroke="#6366f1"    // indigo line color
      strokeWidth={2}
      dot={{ r: 4, fill: "#6366f1" }}        // circle at each data point
      activeDot={{ r: 6, fill: "#a5b4fc" }}  // larger circle on hover
    />
  </LineChart>
</ResponsiveContainer>
```

### Why `ResponsiveContainer`?

Charts need explicit pixel dimensions to render. `ResponsiveContainer width="100%" height="100%"` makes the chart fill its parent element automatically, so it resizes with the screen.

### Pie chart (Time Allocation):

```tsx
const pieData = [
  { name: "Study", value: 180 },   // 180 minutes
  { name: "Exercise", value: 45 },
  { name: "Gaming", value: 60 },
];

const COLORS = ["#6366f1", "#22d3ee", "#4ade80"];

<PieChart>
  <Pie
    data={pieData}
    dataKey="value"     // what determines slice size
    innerRadius={50}    // donut hole size (0 = full pie)
    outerRadius={75}    // overall chart radius
    paddingAngle={3}    // gap between slices
  >
    {/* Give each slice its own color */}
    {pieData.map((_, idx) => (
      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
    ))}
  </Pie>
  <Tooltip formatter={(val) => [`${val} min`]} />
  <Legend />
</PieChart>
```

`idx % COLORS.length` = cycle through colors. If there are 8 slices and only 5 colors, it wraps back to the first color.

---

## 7. React Three Fiber

**What it is:** React Three Fiber (R3F) lets you write Three.js 3D scenes using React components. Three.js is the underlying library that draws 3D graphics using the browser's WebGL engine.

### The mental model:

A 3D scene needs exactly three things:
1. **Camera** — where the viewer is standing and looking from
2. **Lights** — without lights, everything is black
3. **Objects** — the things you see (spheres, lines, text)

```tsx
// components/Path/Path3D.tsx

<Canvas
  camera={{ position: [0, 2, 12], fov: 45 }}  // camera position [x, y, z], field of view
  gl={{ antialias: true, alpha: true }}         // smooth edges, transparent background
>
  <PathScene entries={entries} />
</Canvas>
```

`Canvas` creates the WebGL drawing surface. Everything inside it is 3D.

### Lights:

```tsx
<ambientLight intensity={0.4} />
{/* Ambient = soft light from everywhere, like an overcast sky */}

<directionalLight position={[5, 10, 5]} intensity={1.2} />
{/* Directional = sunlight from a specific direction */}

<pointLight position={[-5, 5, -5]} color="#6366f1" intensity={0.8} />
{/* Point = light bulb, radiates in all directions from one spot */}
```

### A glowing sphere (journal entry node):

```tsx
function PathNode({ position, score }) {
  const color = score >= 5 ? "#22d3ee" : score >= 1 ? "#4ade80" : "#f87171";

  return (
    <group position={position}>  {/* group = empty container, like a <div> */}

      <mesh>  {/* mesh = an object = geometry + material */}
        <sphereGeometry args={[0.22, 24, 24]} />
        {/*                radius, widthSegments, heightSegments */}
        {/* More segments = smoother sphere. 24 = looks smooth, not too heavy */}

        <meshStandardMaterial
          color={color}
          emissive={color}         // glow color (same as base = bright glow)
          emissiveIntensity={0.6}  // glow strength
          roughness={0.2}          // 0 = mirror-like, 1 = totally matte
          metalness={0.5}          // 0 = plastic, 1 = metal
        />
      </mesh>

      {/* Floating text label above the sphere */}
      <Text position={[0, 0.5, 0]} fontSize={0.22} color="#f1f5f9">
        {score > 0 ? `+${score}` : String(score)}
      </Text>
    </group>
  );
}
```

### Animation with `useFrame`:

```tsx
const meshRef = useRef(null);

useFrame(state => {
  if (meshRef.current) {
    // This runs every frame (~60 times per second)
    // Math.sin creates a smooth oscillation between -1 and 1
    meshRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime + index) * 0.08;
    //                                 ↑ time in seconds       ↑ amplitude (how far it moves)
  }
});
```

The spheres bob up and down because their Y position is set to a sine wave of time.

### Drawing a line between points:

```tsx
import { Line } from "@react-three/drei";

const points = [
  new THREE.Vector3(-6, 1.05, 0),   // x, y, z of first point
  new THREE.Vector3(-3.6, 2.1, 0),
  new THREE.Vector3(-1.2, -0.7, 0),
];

<Line points={points} color="#6366f1" lineWidth={2.5} />
```

### OrbitControls — drag to rotate:

```tsx
import { OrbitControls } from "@react-three/drei";

<OrbitControls
  enablePan={false}       // disable panning (moving the view)
  maxPolarAngle={Math.PI / 2}  // prevent rotating upside-down
  minDistance={4}         // can't zoom in closer than 4 units
  maxDistance={24}        // can't zoom out further than 24 units
/>
```

This single component gives you mouse drag to rotate and scroll to zoom for free.

---

## 8. Prisma

**What it is:** Prisma is an ORM (Object-Relational Mapper). It lets you talk to your PostgreSQL database using TypeScript instead of raw SQL.

### Without Prisma (raw SQL):

```ts
const result = await db.query(
  "SELECT pe.*, j.created_at FROM parsed_entries pe JOIN journals j ON pe.journal_id = j.id WHERE j.user_id = $1 ORDER BY pe.created_at DESC LIMIT 30",
  [userId]
);
```

### With Prisma:

```ts
const entries = await prisma.parsedEntry.findMany({
  where: { journal: { userId } },
  orderBy: { createdAt: "desc" },
  take: 30,
  include: { journal: { select: { createdAt: true } } }
});
```

Readable, typed, and Prisma generates the SQL for you.

### The schema — your database blueprint:

```prisma
// prisma/schema.prisma

model User {
  id           String   @id @default(uuid())  // primary key, auto-generated UUID
  email        String   @unique               // must be unique across all users
  passwordHash String                         // hashed, never stored plain
  createdAt    DateTime @default(now())       // auto-set when row is created

  // Relations: one user has many of these
  goals    Goal[]
  journals Journal[]
  sessions Session[]
}

model ParsedEntry {
  id             String   @id @default(uuid())
  journal        Journal  @relation(fields: [journalId], references: [id], onDelete: Cascade)
  journalId      String   // foreign key pointing to a Journal row
  parsedJson     Json     // stores the entire LLM response as JSON
  alignmentScore Int
  activities     Json?    // the ? means nullable — can be null
  followUpData   Json?    // stores {question, userAnswer, assessment}
  createdAt      DateTime @default(now())
}
```

`onDelete: Cascade` = if you delete a Journal, all its ParsedEntry rows are automatically deleted too.

### Common Prisma operations:

```ts
// CREATE — insert a new row
const user = await prisma.user.create({
  data: { email: "user@example.com", passwordHash: hash }
});

// READ ONE
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" }
});

// READ MANY with filter + sort + limit
const entries = await prisma.parsedEntry.findMany({
  where: { journal: { userId: "abc-123" } },
  orderBy: { createdAt: "desc" },
  take: 30  // LIMIT 30
});

// UPDATE
await prisma.parsedEntry.update({
  where: { id: entryId },
  data: { followUpData: { question, userAnswer, assessment } }
});

// DELETE
await prisma.journal.delete({ where: { id: journalId } });

// UPSERT — insert if not exists, update if exists
await prisma.conversationSummary.upsert({
  where: { userId },
  create: { userId, summary: newSummary, summarizedUpTo: date },
  update: { summary: newSummary, summarizedUpTo: date }
});
```

### Migrations:

When you change `schema.prisma`, you run:
```bash
npx prisma migrate dev --name describe_the_change
```

Prisma compares your new schema to the current database, generates SQL `ALTER TABLE` statements, and applies them. The migration SQL files in `prisma/migrations/` are your change history.

---

## 9. API Routes

**What they are:** Files in `app/api/` that handle HTTP requests from the browser. They run on the server, so they can safely use the database and secret API keys.

### Anatomy of an API route:

```ts
// app/api/dashboard/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  // 1. Auth check — who is asking?
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    //                                                     ↑ HTTP status code
    // 401 = "you need to be logged in"
  }

  // 2. Fetch data from database
  const entries = await prisma.parsedEntry.findMany({
    where: { journal: { userId } }
  });

  // 3. Process and return
  return NextResponse.json({ entries });
  // status 200 (OK) is the default when you don't specify
}

export async function POST(req: NextRequest) {
  const body = await req.json(); // parse the request body
  // ... handle POST
}
```

### HTTP status codes you'll see:

| Code | Meaning | When we use it |
|---|---|---|
| 200 | OK | Successful GET, successful data return |
| 201 | Created | New user/goal/entry was created |
| 400 | Bad Request | Missing required field in request body |
| 401 | Unauthorized | Not logged in |
| 404 | Not Found | Resource doesn't exist or doesn't belong to you |
| 409 | Conflict | Email already registered |
| 429 | Too Many Requests | Rate limit hit |
| 500 | Internal Server Error | Unexpected crash |
| 502 | Bad Gateway | Third-party (LLM) failed |

### How the frontend calls an API route:

```tsx
// app/dashboard/page.tsx

useEffect(() => {
  fetch("/api/dashboard")          // GET request by default
    .then(r => {
      if (!r.ok) throw new Error("Failed");
      return r.json();             // parse the JSON response
    })
    .then(data => setData(data))   // store in state
    .catch(e => setError(e.message));
}, []);   // [] = run once when component mounts
```

### Posting data:

```tsx
const res = await fetch("/api/journal", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: journalText })  // convert object → JSON string
});
const data = await res.json();  // parse response back to object
```

---

## 10. Authentication

**What it is:** Proving who you are (login) and staying proven across multiple page visits (sessions).

### How passwords are handled:

**Never store plain passwords.** If your database is hacked, you don't want attackers to see everyone's passwords.

Instead, we use **hashing** (Argon2id):

```ts
// lib/auth.ts
import argon2 from "argon2";

// When user signs up:
const hash = await argon2.hash("mysecretpassword123");
// hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
// This is a one-way transformation — you can't reverse it to get the password back

// Store the hash in the database, never the password.
await prisma.user.create({ data: { email, passwordHash: hash } });

// When user logs in:
const isValid = await argon2.verify(user.passwordHash, "mysecretpassword123");
// Returns true if the password matches the hash
```

### Sessions — staying logged in:

HTTP is "stateless" — each request is independent. The server doesn't remember you between requests. Sessions solve this.

**Flow:**

```
1. User logs in with correct password
   ↓
2. Server creates a Session row in the database:
   { token: "random-256-bit-string", userId: "...", expiresAt: "1 hour from now" }
   ↓
3. Server sets a cookie in the browser:
   Set-Cookie: gat_session=random-256-bit-string; HttpOnly; SameSite=Lax
   ↓
4. Browser automatically sends this cookie on every future request
   ↓
5. Server reads the cookie, looks up the token in the Session table,
   finds the userId, and knows who you are
```

```ts
// lib/auth.ts — checking who is logged in
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = cookies();  // from next/headers
  const token = cookieStore.get("gat_session")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  // session expired → treat as logged out

  return session.userId;
}
```

### Why `HttpOnly` cookies?

JavaScript in the browser **cannot read** `HttpOnly` cookies. This means if someone injects malicious JavaScript into your page (XSS attack), it still can't steal the session token.

---

## 11. Groq / LLM

**What it is:** Groq is a cloud service that runs large language models (LLMs) like Meta's Llama. We call their API to analyse journal entries and power the help chat.

### How an LLM API call works:

```ts
// lib/groq.ts

const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`
  },
  body: JSON.stringify({
    model: "llama-3.3-70b-versatile",
    temperature: 0.0,  // 0 = deterministic/consistent, 1 = creative/random
    max_tokens: 1600,  // maximum length of the response
    messages: [
      {
        role: "system",
        content: "You are a structured parser for a habit tracker..."
        // System message = instructions/personality for the AI
      },
      {
        role: "user",
        content: "Journal entry: Today I studied ML for 3 hours..."
        // User message = what the AI is responding to
      }
    ]
  })
});

const data = await response.json();
const reply = data.choices[0].message.content;
```

### Function/Tool Calling:

Normal LLM responses are plain text. But we need structured JSON (specific fields, specific types). Tool calling forces the LLM to return data in a schema we define:

```ts
// lib/llmSchema.ts

// We define the exact shape we want back:
const parseJournalFunctionSchema = {
  name: "parse_journal",
  parameters: {
    type: "object",
    properties: {
      activities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            duration_minutes: { type: "integer" },
            sub_topics: {
              type: "array",
              items: {
                properties: {
                  name: { type: "string" },
                  duration_minutes: { type: "integer" }
                }
              }
            }
          }
        }
      },
      alignment_score: { type: "integer" },
      summary: { type: "string" },
      follow_up_question: { type: "string" }
    }
  }
};

// In the API call, we tell the LLM: "you MUST call this function":
tool_choice: { type: "function", function: { name: "parse_journal" } }
```

So instead of: `"You studied ML for 3 hours today..."` (plain text)

We get:
```json
{
  "activities": [
    {
      "name": "Study: Costing, Finance, FM",
      "category": "study",
      "duration_minutes": 120,
      "sub_topics": [
        { "name": "Costing", "duration_minutes": 40 },
        { "name": "Finance", "duration_minutes": 40 },
        { "name": "FM", "duration_minutes": 40 }
      ]
    }
  ],
  "alignment_score": 7,
  "summary": "Strong study session covering three subjects...",
  "follow_up_question": "You covered Costing, Finance, and FM today. Which feels strongest?"
}
```

### The Help Chat — conversation context:

```ts
// app/api/chat/route.ts

// Build the LLM's memory of the conversation:
const messages = [
  { role: "system", content: "You are a blunt coach. User's goal: Pass CA exams..." },
  // summary of older messages (to save space):
  { role: "assistant", content: "[SUMMARY: User struggles with FM, strong in Costing...]" },
  // recent actual messages:
  { role: "user", content: "I studied for 1h today" },
  { role: "assistant", content: "1 hour is not enough. Your exam is in 6 weeks..." },
  // the new message:
  { role: "user", content: "What should I focus on tomorrow?" }
];
```

LLMs have a "context window" — they can only see a limited number of tokens (roughly words) at once. When the conversation gets long, we summarise the older messages to stay within the limit.

---

## 12. Rate Limiting

**What it is:** Limiting how many times someone can call an API endpoint in a given time period.

**Why?** LLM API calls cost money. Without rate limiting, a single user (or attacker) could spam your journal endpoint millions of times and bankrupt you.

### The token bucket algorithm:

Imagine a bucket with holes in it:
- The bucket has a maximum capacity (burst limit)
- It drains at a fixed rate (the "rate")
- Each API call takes one token from the bucket
- If the bucket is empty → you're rate limited

```ts
// lib/rate-limiter.ts (conceptually):

const PRESETS = {
  llm: {
    maxTokens: 5,        // can burst up to 5 quick requests
    refillRate: 1/60,    // refills 1 token every 60 seconds
  },
  auth: {
    maxTokens: 10,
    refillRate: 1/30,    // 1 token every 30 seconds
  },
  general: {
    maxTokens: 60,
    refillRate: 1,       // 1 token per second
  }
};

// Usage:
const rl = checkRateLimit(`llm:${userId}`, "llm");
if (!rl.allowed) {
  return NextResponse.json(
    { error: `Rate limit exceeded. Retry after ${rl.retryAfterSeconds}s.` },
    { status: 429 }
  );
}
```

The key `llm:${userId}` means each user has their own independent bucket. One user hammering the endpoint doesn't affect other users.

---

## 13. AJV

**What it is:** A JSON Schema validator. We use it to verify that the LLM's response actually matches the shape we expect before trusting it.

**Why?** LLMs can hallucinate or return unexpected formats. Before we store AI output in our database, we validate it:

```ts
// lib/groq.ts

import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(parseJournalFunctionSchema.parameters);
// "compile" turns the schema into a fast validation function

const args = JSON.parse(llmResponseString); // parse the LLM's JSON string

const valid = validate(args); // returns true or false

if (!valid) {
  throw new Error(
    "LLM output failed validation: " + JSON.stringify(validate.errors)
  );
  // e.g., "alignment_score must be integer" — if LLM returned 7.5 instead of 7
}

return args; // safe to use
```

This means the database only ever receives well-formed data, even if the LLM misbehaves.

---

## 14. How All the Pieces Connect

Here's the full journey when you submit a journal entry:

```
You type "studied costing and FM for 2 hours"
and click "Analyze Journal"
│
▼
app/journal/page.tsx (browser)
  fetch("POST /api/journal", { text: "studied costing..." })
│
▼
app/api/journal/route.ts (server)
  1. getSessionUserId()            ← reads your cookie, gets your userId
  2. checkRateLimit()              ← checks you haven't exceeded 5 LLM calls
  3. prisma.journal.create()       ← saves your raw text to PostgreSQL
  4. callParseJournal()            ← sends text to Groq API
│
▼
lib/groq.ts → Groq API (external)
  Sends: system prompt + your text + last 5 entries as context
  Receives: JSON with activities, score, summary, sub_topics, follow_up_question
│
▼
app/api/journal/route.ts (server)
  5. AJV validates the JSON        ← rejects if malformed
  6. prisma.parsedEntry.create()   ← saves structured data to PostgreSQL
  7. returns { parsed, parsedEntryId }
│
▼
app/journal/page.tsx (browser)
  setParsed(data.parsed)           ← React state triggers re-render
  Shows: score bar, activities with sub_topics, strengths, follow_up_question
│
▼
You answer the follow-up question and click "Get honest assessment"
│
▼
app/api/journal/[id]/followup/route.ts (server)
  callFollowUp(question, yourAnswer, goalTitle, recentHistory)
  prisma.parsedEntry.update({ followUpData: {...} })
  returns { assessment }
│
▼
app/journal/page.tsx (browser)
  setAssessment(data.assessment)   ← shows the blunt coach response
```

### And when you open the dashboard:

```
app/dashboard/page.tsx
  useEffect → fetch("/api/dashboard")
│
▼
app/api/dashboard/route.ts
  1. getSessionUserId()
  2. prisma.parsedEntry.findMany() ← last 90 entries with journal.createdAt
  3. Group by date:
     - If 3 entries on same day → merge activities, keep latest score
  4. Compute:
     - lineData   = [{date, score}] per day
     - pieData    = sum of minutes per category
     - activityDays = activities grouped by day
     - pathEntries = [{id, created_at, score}] per day
     - stats      = {totalEntries, bestScore, streak, avgScore}
  5. return all of this as JSON
│
▼
app/dashboard/page.tsx
  setData(result)
  │
  ├─ <Path3D entries={pathEntries} />         ← 3D glowing spheres
  ├─ <Charts lineData={...} pieData={...} />  ← line + pie charts
  ├─ <TaskBoard days={activityDays} />        ← activity pills per day
  └─ stat cards showing totalEntries, streak, bestScore, avgScore
```

---

## Quick Reference: Which library does what

| I want to... | Use |
|---|---|
| Create a page at a URL | Next.js — create `app/mypage/page.tsx` |
| Run server code (database, secrets) | Next.js API route — `app/api/x/route.ts` |
| Add type safety to variables | TypeScript — declare `type MyType = {...}` |
| Style an element | Tailwind — add classes like `bg-slate-800 rounded-xl p-4` |
| Animate an element | Framer Motion — wrap with `<motion.div initial animate>` |
| Animate list items one by one | Framer Motion — use `transition={{ delay: idx * 0.06 }}` |
| Draw a line/pie chart | Recharts — `<LineChart data={...}>`, `<PieChart>` |
| Render 3D objects | React Three Fiber — `<Canvas>`, `<mesh>`, `<sphereGeometry>` |
| Animate in 3D per frame | R3F `useFrame` hook |
| Query the database | Prisma — `prisma.modelName.findMany(...)` |
| Hash a password | Argon2 — `argon2.hash(password)` |
| Check who is logged in | Custom `getSessionUserId()` function |
| Call the AI | `callParseJournal()` / `callChat()` in `lib/groq.ts` |
| Validate AI output shape | AJV — `validate(data)` |
| Protect against API abuse | `checkRateLimit()` in `lib/rate-limiter.ts` |

---

*This file was written specifically for the Goal Alignment Tracker codebase. All code examples are taken directly from the actual project files.*
