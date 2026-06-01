import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config.js";

const s3Client = new S3Client({
  region: config.AWS_REGION,
});

export function isExportStorageConfigured() {
  return Boolean(config.S3_EXPORT_BUCKET);
}

function exportBucket() {
  if (!config.S3_EXPORT_BUCKET) {
    throw new Error("S3 export storage is not configured.");
  }

  return config.S3_EXPORT_BUCKET;
}

export async function uploadExportObject({
  key,
  body,
  contentType,
}: {
  key: string;
  body: string;
  contentType: string;
}) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: exportBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
    }),
  );
}

export async function createExportDownloadUrl({
  key,
  filename,
  contentType,
}: {
  key: string;
  filename: string;
  contentType: string;
}) {
  const command = new GetObjectCommand({
    Bucket: exportBucket(),
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
    ResponseContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: config.S3_EXPORT_URL_EXPIRES_SECONDS,
  });
  const expiresAt = new Date(Date.now() + config.S3_EXPORT_URL_EXPIRES_SECONDS * 1000).toISOString();

  return { url, expiresAt };
}
