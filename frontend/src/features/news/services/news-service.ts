import api from "@/services/api-client";
import { News, NewsCategory } from "../types";

export const newsService = {
  getNews: async (params?: { category?: string; search?: string; exclude?: string; offset?: number; limit?: number }): Promise<News[]> => {
    const { data } = await api.get<News[]>("/news/", { params });
    return data;
  },

  getNewsDetail: async (slug: string): Promise<News> => {
    const { data } = await api.get<News>(`/news/${slug}/`);
    return data;
  },

  getCategories: async (): Promise<NewsCategory[]> => {
    const { data } = await api.get<NewsCategory[]>("/news/categories/");
    return data;
  },
};
