import { PrismaClient } from "../../src/generated/prisma/client.js";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { SEED_MEMBERS, SEED_PLANS } from "./seed-data.js";

// PostgreSQLへ接続するためのコネクションプールを作成
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Prisma v7 用の PostgreSQL アダプターを作成
const adapter = new PrismaPg(pool);

// PrismaClient に adapter を設定
const prisma = new PrismaClient({ adapter });

//seed処理
async function main() {
  await prisma.member.deleteMany();
  await prisma.plan.deleteMany();

  await prisma.plan.createMany({
    data: SEED_PLANS,
  });

  const plans = await prisma.plan.findMany();

  const memberCreateData = SEED_MEMBERS.map(({ planName, ...member }) => {
    const plan = plans.find((plan) => plan.name === planName);

    if (!plan) {
      throw new Error(`Plan not found: ${planName}`);
    }

    return {
      ...member,
      planId: plan.id,
    };
  });

  await prisma.member.createMany({
    data: memberCreateData,
  });
}

main()
  .catch((e) => {
    console.error("Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
