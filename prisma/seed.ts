import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@example.com";
  const rawPassword = "DemoPass123!";

  // SECURITY: Hash the seed password — never store plaintext.
  const passwordHash = await argon2.hash(rawPassword, {
    type: argon2.argon2id,
    memoryCost: 1 << 16,
    timeCost: 4,
    parallelism: 2
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash
    }
  });

  console.log(`✅ Demo user: ${user.email} (password: DemoPass123!)`);

  await prisma.goal.upsert({
    where: { id: "seed-goal-1" },
    update: {},
    create: {
      id: "seed-goal-1",
      userId: user.id,
      title: "Become a Machine Learning Engineer",
      description:
        "Study ML fundamentals, build projects, and land a job at a top tech company.",
      targetDate: new Date("2026-12-31")
    }
  });

  console.log("✅ Seed goal created");
  console.log("\nRun docker-compose up and visit http://localhost:3000");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
