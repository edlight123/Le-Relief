import { NextRequest, NextResponse } from "next/server";
import * as mediaRepo from "@/lib/repositories/media";
import { auth } from "@/lib/auth";
import { getBucket } from "@/lib/firebase";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf", ".mp4", ".webm",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function firebaseDownloadUrl(bucketName: string, storagePath: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const media = await mediaRepo.getMedia();
  return NextResponse.json({ media });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large: max ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
      { status: 400 },
    );
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: `File type not allowed. Accepted: ${[...ALLOWED_EXTENSIONS].join(", ")}` },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeFilename = `${crypto.randomUUID()}${ext}`;
  const storagePath = `uploads/${safeFilename}`;
  const token = crypto.randomUUID();

  const bucket = getBucket();
  await bucket.file(storagePath).save(buffer, {
    resumable: false,
    metadata: {
      contentType: file.type || "application/octet-stream",
      cacheControl: "public, max-age=31536000",
      metadata: {
        firebaseStorageDownloadTokens: token,
        originalName: file.name,
      },
    },
  });

  const url = firebaseDownloadUrl(bucket.name, storagePath, token);

  const media = await mediaRepo.createMedia({
    filename: file.name,
    url,
    type: file.type,
    size: file.size,
  });

  return NextResponse.json(media, { status: 201 });
}
