import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 7),
  },
  // Comma-separated list supported so local dev survives Vite picking a
  // different port (5173, 5174, ...) when the default is already in use.
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "AssetFlow <no-reply@assetflow.local>",
  },
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  backendUrl: process.env.BACKEND_URL ?? "http://localhost:4000",
  cloudinary: parseCloudinaryConfig(),
};

// Accepts either the three discrete CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET
// vars, a CLOUDINARY_URL, or (since it's easy to paste the whole dashboard
// string into the wrong field) a full "cloudinary://key:secret@cloud_name"
// URL placed in any one of the three variables.
function parseCloudinaryConfig(): { cloudName: string; apiKey: string; apiSecret: string } {
  const candidates = [
    process.env.CLOUDINARY_URL,
    process.env.CLOUDINARY_API_SECRET,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_CLOUD_NAME,
  ];

  for (const candidate of candidates) {
    if (!candidate?.startsWith("cloudinary://")) continue;
    const match = candidate.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (match) {
      const [, apiKey, apiSecret, cloudName] = match;
      return { cloudName, apiKey, apiSecret };
    }
  }

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  };
}

// Cloudinary is only used when all three credentials are present; otherwise
// uploads fall back to local disk storage served from /uploads. This mirrors
// the SMTP dev-mode fallback so the app is fully usable with zero external
// accounts configured.
export const isCloudinaryConfigured = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);
