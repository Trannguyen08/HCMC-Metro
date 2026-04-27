import api from "@/lib/api";

import { resolveMediaUrl } from "../utils";
import { News, NewsCategory } from "../types";

type RawNews = News & {
  image_url?: string;
};

function normalizeNews(news: RawNews): News {
  const rawThumbnail = news.thumbnail_url || news.image_url;

  return {
    ...news,
    thumbnail_url: resolveMediaUrl(rawThumbnail),
  };
}

export const newsService = {
  getNews: async (params?: {
    category?: string;
    search?: string;
    exclude?: string | number;
    offset?: number;
    limit?: number;
  }): Promise<News[]> => {
    const { data } = await api.get<RawNews[]>("/news/", { params });
    return data.map(normalizeNews);
  },

  getNewsDetail: async (slug: string): Promise<News> => {
    const { data } = await api.get<RawNews>(`/news/${slug}/`);
    return normalizeNews(data);
  },

  getCategories: async (): Promise<NewsCategory[]> => {
    const { data } = await api.get<NewsCategory[]>("/news/categories/");
    return data;
  },
};
