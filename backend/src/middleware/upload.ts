import multer from "multer";

// Buffered in memory so the same file can be routed to either Cloudinary or
// local disk storage (see utils/storage.ts) without touching disk twice.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});
