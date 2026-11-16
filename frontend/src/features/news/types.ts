export interface News {
  id: string | number;
  category_name: string;
  category?: number;
  title: string;
  summary: string;
  content?: string | null;
  author?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  thumbnail_url?: string;
  image_url?: string;
  slug: string;
  published_at: string;
  created_at: string;
}

export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
}
