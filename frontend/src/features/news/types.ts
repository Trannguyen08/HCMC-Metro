export interface News {
  id: string;
  category_name: string;
  category?: number;
  title: string;
  summary: string;
  thumbnail_url: string;
  slug: string;
  published_at: string;
  created_at: string;
}

export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
}
