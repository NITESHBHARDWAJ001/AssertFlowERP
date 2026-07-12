import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { env, isCloudinaryConfigured } from "../config/env";

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

const UPLOADS_ROOT = path.join(__dirname, "..", "..", "uploads");

export interface UploadedFile {
  url: string;
  storage: "cloudinary" | "local";
}

interface UploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder: string; // e.g. "assets/<assetId>/images"
}

function uploadToCloudinary(input: UploadInput): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `assetflow/${input.folder}`, resource_type: "auto" },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve({ url: result.secure_url, storage: "cloudinary" });
      }
    );
    stream.end(input.buffer);
  });
}

async function uploadToLocalDisk(input: UploadInput): Promise<UploadedFile> {
  const dir = path.join(UPLOADS_ROOT, input.folder);
  await fs.mkdir(dir, { recursive: true });

  const ext = path.extname(input.originalName) || "";
  const filename = `${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(dir, filename), input.buffer);

  const url = `${env.backendUrl}/uploads/${input.folder}/${filename}`;
  return { url, storage: "local" };
}

export async function uploadFile(input: UploadInput): Promise<UploadedFile> {
  if (isCloudinaryConfigured) {
    return uploadToCloudinary(input);
  }
  return uploadToLocalDisk(input);
}
