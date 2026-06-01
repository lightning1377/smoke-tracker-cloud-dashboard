import type { PrismaClient, User } from "@prisma/client";
import { serializeGoal, serializeSmokeItem, serializeSmokeLog } from "../lib/serializers.js";

export type ExportFormat = "csv" | "json";

export interface BuiltExport {
  body: string;
  contentType: string;
  filename: string;
}

function csvEscape(value: unknown) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function timestampForFilename(value: string) {
  return value.replaceAll(":", "-").replaceAll(".", "-");
}

export async function buildUserExport(prisma: PrismaClient, user: User, format: ExportFormat): Promise<BuiltExport> {
  const [items, logs, goals] = await Promise.all([
    prisma.smokeItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.smokeLog.findMany({
      where: { userId: user.id },
      include: { smokeItem: true },
      orderBy: { timestamp: "asc" },
    }),
    prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const exportedAt = new Date().toISOString();
  const filenameTimestamp = timestampForFilename(exportedAt);

  if (format === "json") {
    return {
      body: JSON.stringify(
        {
          exportedAt,
          user: {
            id: user.id,
            email: user.email,
          },
          items: items.map(serializeSmokeItem),
          logs: logs.map(serializeSmokeLog),
          goals: goals.map(serializeGoal),
        },
        null,
        2,
      ),
      contentType: "application/json",
      filename: `smoke-tracker-export-${filenameTimestamp}.json`,
    };
  }

  const rows = [
    ["timestamp", "itemName", "itemId", "pricePerUnit", "notes"],
    ...logs.map((log) => [
      log.timestamp.toISOString(),
      log.smokeItem.name,
      log.smokeItem.id,
      log.smokeItem.pricePerUnit.toNumber(),
      log.notes ?? "",
    ]),
  ];

  return {
    body: rows.map((row) => row.map(csvEscape).join(",")).join("\n"),
    contentType: "text/csv",
    filename: `smoke-tracker-logs-${filenameTimestamp}.csv`,
  };
}
