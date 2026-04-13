export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  alt: string | null;
  createdAt: Date;
}
