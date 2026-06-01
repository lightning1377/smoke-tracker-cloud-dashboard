import type { ExportJob, User } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { buildUserExport, type ExportFormat } from "../services/export-builder.js";
import {
  createExportDownloadUrl,
  isExportStorageConfigured,
  uploadExportObject,
} from "../services/s3-export-storage.js";

const createExportSchema = z.object({
  format: z.enum(["csv", "json"]).default("csv"),
});

const exportParamsSchema = z.object({
  id: z.string().uuid(),
});

function serializeExportJob(job: ExportJob) {
  return {
    id: job.id,
    userId: job.userId,
    status: job.status,
    format: job.format,
    s3Key: job.s3Key,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

function contentTypeForFormat(format: ExportFormat) {
  return format === "json" ? "application/json" : "text/csv";
}

function filenameFromS3Key(s3Key: string) {
  return s3Key.split("/").at(-1) ?? "smoke-tracker-export";
}

function exportObjectKey(userId: string, jobId: string, filename: string) {
  return `exports/${userId}/${jobId}/${filename}`;
}

function exportErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Export failed";
  return message.slice(0, 180);
}

export const exportRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  async function createCompletedExportJob(user: User, format: ExportFormat) {
    const job = await app.prisma.exportJob.create({
      data: {
        userId: user.id,
        status: "processing",
        format,
      },
    });

    try {
      const builtExport = await buildUserExport(app.prisma, user, format);
      const s3Key = exportObjectKey(user.id, job.id, builtExport.filename);

      await uploadExportObject({
        key: s3Key,
        body: builtExport.body,
        contentType: builtExport.contentType,
      });

      const completedJob = await app.prisma.exportJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          s3Key,
          completedAt: new Date(),
        },
      });

      return { job: completedJob, builtExport };
    } catch (error) {
      await app.prisma.exportJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorMessage: exportErrorMessage(error),
        },
      });
      throw error;
    }
  }

  app.post("/", async (request, reply) => {
    if (!isExportStorageConfigured()) {
      return reply.code(503).send({ message: "S3 export storage is not configured" });
    }

    const body = createExportSchema.parse(request.body ?? {});
    const { job } = await createCompletedExportJob(request.currentUser, body.format);

    return reply.code(202).send({
      job: serializeExportJob(job),
    });
  });

  app.get("/", async (request) => {
    const jobs = await app.prisma.exportJob.findMany({
      where: { userId: request.currentUser.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return { jobs: jobs.map(serializeExportJob) };
  });

  app.get("/:id/download-url", async (request, reply) => {
    if (!isExportStorageConfigured()) {
      return reply.code(503).send({ message: "S3 export storage is not configured" });
    }

    const params = exportParamsSchema.parse(request.params);
    const job = await app.prisma.exportJob.findFirst({
      where: {
        id: params.id,
        userId: request.currentUser.id,
      },
    });

    if (!job) {
      return reply.code(404).send({ message: "Export job not found" });
    }

    if (job.status !== "completed" || !job.s3Key) {
      return reply.code(409).send({ message: "Export job is not ready for download" });
    }

    return createExportDownloadUrl({
      key: job.s3Key,
      filename: filenameFromS3Key(job.s3Key),
      contentType: contentTypeForFormat(job.format),
    });
  });
};
