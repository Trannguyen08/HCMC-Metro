import api from "@/services/api-client";
import { Feedback, CreateFeedbackData, FeedbackStatus } from "../types";

export const feedbackService = {
  // User endpoints
  getMyFeedbacks: async (): Promise<Feedback[]> => {
    const res = await api.get("/feedback/user/");
    return res.data;
  },
  
  createFeedback: async (data: CreateFeedbackData): Promise<Feedback> => {
    const res = await api.post("/feedback/user/", data);
    return res.data;
  },

  // Admin endpoints
  getAllFeedbacks: async (): Promise<Feedback[]> => {
    const res = await api.get("/feedback/admin/");
    return res.data;
  },

  updateFeedbackStatus: async (id: string, status: FeedbackStatus): Promise<Feedback> => {
    const res = await api.patch(`/feedback/admin/${id}/`, { status });
    return res.data;
  }
};
