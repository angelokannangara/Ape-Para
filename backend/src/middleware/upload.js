import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { config } from '../config.js';
import { HttpError } from '../utils/httpError.js';

export const uploadRoot = path.resolve(config.uploadDir);
fs.mkdirSync(uploadRoot, { recursive: true });

const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

export const uploadImage = multer({
  storage: multer.diskStorage({
    destination: uploadRoot,
    // Random name; extension derived from MIME, never from the client filename.
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + EXT_BY_MIME[file.mimetype]),
  }),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) return cb(null, true);
    cb(new HttpError(400, 'Only JPEG, PNG or WebP images are allowed'));
  },
}).single('image');

/** Checks magic bytes so a renamed non-image can't slip through on its MIME header. */
export async function hasImageSignature(filePath) {
  const fh = await fs.promises.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(12);
    await fh.read(buf, 0, 12, 0);
    const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const webp = buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
    return jpeg || png || webp;
  } finally {
    await fh.close();
  }
}

export const removeFile = (filePath) => fs.promises.unlink(filePath).catch(() => {});
