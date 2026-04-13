import { db } from "@/lib/db";

export async function getMedia() {
  return db.media.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createMedia(data: {
  filename: string;
  url: string;
  type: string;
  size: number;
  alt?: string;
}) {
  return db.media.create({ data });
}

export async function deleteMedia(id: string) {
  return db.media.delete({ where: { id } });
}
