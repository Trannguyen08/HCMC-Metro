export type FeedbackType = "facility" | "experience" | "error";

export type FeedbackStatus = "pending" | "processing" | "resolved";

export interface Train {
  id: number;
  train_number: string;
}

export interface Feedback {
  id: string;
  user: string;
  user_full_name: string;
  type: FeedbackType;
  content: string;
  train: number | null;
  train_detail: Train | null;
  status: FeedbackStatus;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackData {
  type: FeedbackType;
  content: string;
  rating?: number;
  train?: number | null;
}
