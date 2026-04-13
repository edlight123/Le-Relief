import * as mediaRepo from "@/lib/repositories/media";

export async function getMedia() {
  return mediaRepo.getMedia();
}

export async function createMedia(data: {
  filename: string;
  url: string;
  type: string;
  size: number;
  alt?: string;
}) {
  return mediaRepo.createMedia(data);
}

export async function deleteMedia(id: string) {
  return mediaRepo.deleteMedia(id);
}
