"use client";

import * as React from "react";
import { FeedbackForm } from "@/features/feedback/components/feedback-form";
import { FeedbackList } from "@/features/feedback/components/feedback-list";

export default function ProfileFeedbackPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="order-2 md:order-1">
        <FeedbackList />
      </div>
      <div className="order-1 md:order-2">
        <FeedbackForm />
      </div>
    </div>
  );
}
