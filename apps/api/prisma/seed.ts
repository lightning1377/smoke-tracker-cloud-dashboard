import { config as loadEnv } from "dotenv";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: "../../.env" });
loadEnv();

const prisma = new PrismaClient();

function atToday(hour: number, minute = 16) {
  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  return value;
}

function daysAgo(days: number, hour: number) {
  const value = new Date();
  value.setDate(value.getDate() - days);
  value.setHours(hour, 10, 0, 0);
  return value;
}

async function main() {
  const email = "demo@smoketracker.local";
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      displayName: "Demo User",
      timezone: "UTC",
      passwordHash: await argon2.hash("Password123!"),
    },
    create: {
      email,
      displayName: "Demo User",
      timezone: "UTC",
      passwordHash: await argon2.hash("Password123!"),
    },
  });

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  await prisma.exportJob.deleteMany({ where: { userId: user.id } });
  await prisma.goal.deleteMany({ where: { userId: user.id } });
  await prisma.smokeLog.deleteMany({ where: { userId: user.id } });
  await prisma.smokeItem.deleteMany({ where: { userId: user.id } });

  const cigarette = await prisma.smokeItem.create({
    data: {
      userId: user.id,
      name: "Cigarette",
      pricePerUnit: 0.5,
      color: "#F43F46",
      icon: "C",
      dailyTarget: 5,
    },
  });

  const vape = await prisma.smokeItem.create({
    data: {
      userId: user.id,
      name: "Vape",
      pricePerUnit: 2,
      color: "#3B82F6",
      icon: "V",
      dailyTarget: 3,
    },
  });

  await prisma.goal.create({
    data: {
      userId: user.id,
      smokeItemId: cigarette.id,
      type: "limit",
      isActive: true,
      dailyLimit: 5,
    },
  });

  await prisma.goal.create({
    data: {
      userId: user.id,
      smokeItemId: vape.id,
      type: "limit",
      isActive: true,
      dailyLimit: 3,
    },
  });

  await prisma.smokeLog.createMany({
    data: [
      { userId: user.id, smokeItemId: cigarette.id, timestamp: atToday(20), notes: "After dinner" },
      { userId: user.id, smokeItemId: cigarette.id, timestamp: daysAgo(1, 19), notes: null },
      { userId: user.id, smokeItemId: vape.id, timestamp: daysAgo(1, 21), notes: null },
      { userId: user.id, smokeItemId: cigarette.id, timestamp: daysAgo(2, 18), notes: null },
      { userId: user.id, smokeItemId: cigarette.id, timestamp: daysAgo(3, 17), notes: null },
      { userId: user.id, smokeItemId: vape.id, timestamp: daysAgo(4, 12), notes: null },
      { userId: user.id, smokeItemId: cigarette.id, timestamp: daysAgo(5, 20), notes: null },
      { userId: user.id, smokeItemId: cigarette.id, timestamp: daysAgo(6, 16), notes: null },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
