import { NextRequest, NextResponse } from "next/server";
import * as mediaRepo from "@/lib/repositories/media";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf", ".mp4", ".webm",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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

  // File size validation
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large: max ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
      { status: 400 },
    );
  }

  // File type validation — only allow safe extensions
  const ext = path.extname(file.name).toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: `File type not allowed. Accepted: ${[...ALLOWED_EXTENSIONS].join(", ")}` },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Use UUID-based filename to prevent path traversal and special chars
  const safeFilename = `${crypto.randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  // Resolve and validate the final path stays within uploadDir
  const finalPath = path.resolve(uploadDir, safeFilename);
  if (!finalPath.startsWith(uploadDir)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  await writeFile(finalPath, buffer);

  const url = `/uploads/${safeFilename}`;
  const media = await mediaRepo.createMedia({
    filename: file.name,
    url,
    type: file.type,
    size: file.size,
  });

  return NextResponse.json(media, { status: 201 });
}
