"use client";

import * as React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  Loader2,
  MessageSquare,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { feedbackService } from "@/features/feedback/services/feedback-service";
import { Feedback, FeedbackStatus, FeedbackType } from "@/features/feedback/types";

const STATUS_OPTIONS: Array<{ value: FeedbackStatus; label: string }> = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "processing", label: "Đang xử lý" },
  { value: "resolved", label: "Đã giải quyết" },
];

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = React.useState<Feedback[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const fetchFeedbacks = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await feedbackService.getAllFeedbacks();
      setFeedbacks(data);
    } catch (err) {
      console.error("Failed to fetch feedbacks", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const getStatusLabel = (status: FeedbackStatus) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "processing":
        return "Đang xử lý";
      case "resolved":
        return "Đã giải quyết";
      default:
        return status;
    }
  };

  const getTypeLabel = (type: FeedbackType) => {
    switch (type) {
      case "facility":
        return "Cơ sở vật chất";
      case "experience":
        return "Trải nghiệm";
      case "error":
        return "Lỗi hệ thống";
      default:
        return type;
    }
  };

  const getStatusBadgeClassName = (status: FeedbackStatus) => {
    switch (status) {
      case "pending":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "processing":
        return "border-blue-200 bg-blue-50 text-blue-700";
      case "resolved":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      default:
        return "";
    }
  };

  const getAllowedStatusOptions = (status: FeedbackStatus) => {
    switch (status) {
      case "pending":
        return STATUS_OPTIONS;
      case "processing":
        return STATUS_OPTIONS.filter((option) => option.value === "processing" || option.value === "resolved");
      case "resolved":
        return STATUS_OPTIONS.filter((option) => option.value === "resolved");
      default:
        return STATUS_OPTIONS;
    }
  };

  const isStatusLocked = (status: FeedbackStatus) => status === "resolved";

  const handleUpdateStatus = async (id: string, nextStatus: FeedbackStatus) => {
    const currentFeedback = feedbacks.find((feedback) => feedback.id === id);
    if (!currentFeedback || currentFeedback.status === nextStatus) {
      return;
    }

    setUpdatingId(id);
    try {
      await feedbackService.updateFeedbackStatus(id, nextStatus);
      setFeedbacks((prev) => prev.map((fb) => (fb.id === id ? { ...fb, status: nextStatus } : fb)));
    } catch (err) {
      console.error("Failed to update status", err);
      window.alert("Cập nhật trạng thái thất bại.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const keyword = searchQuery.toLowerCase();
    const matchesSearch =
      fb.user_full_name.toLowerCase().includes(keyword) ||
      fb.content.toLowerCase().includes(keyword) ||
      (fb.train_detail?.train_number || "").toLowerCase().includes(keyword);

    const matchesStatus = statusFilter === "all" || fb.status === statusFilter;
    const matchesType = typeFilter === "all" || fb.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: feedbacks.length,
    pending: feedbacks.filter((f) => f.status === "pending").length,
    processing: feedbacks.filter((f) => f.status === "processing").length,
    resolved: feedbacks.filter((f) => f.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Góp ý</h1>
        <p className="text-sm text-muted-foreground">
          Xem và xử lý các phản hồi từ khách hàng về trải nghiệm dịch vụ Metro.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-none ring-1 ring-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Tổng số</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none ring-1 ring-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Chờ xử lý</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none ring-1 ring-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Đang xử lý</p>
              <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none ring-1 ring-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Đã giải quyết</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.resolved}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none ring-1 ring-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, nội dung, mã tàu..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[176px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="processing">Đang xử lý</SelectItem>
                    <SelectItem value="resolved">Đã giải quyết</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-[148px]">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="experience">Trải nghiệm</SelectItem>
                  <SelectItem value="facility">Cơ sở vật chất</SelectItem>
                  <SelectItem value="error">Lỗi hệ thống</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Khách hàng</th>
                  <th className="px-4 py-3 text-left">Loại / Mã tàu</th>
                  <th className="w-1/3 px-4 py-3 text-left">Nội dung</th>
                  <th className="px-4 py-3 text-left">Ngày gửi</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                      Đang tải danh sách góp ý...
                    </td>
                  </tr>
                ) : filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      Không tìm thấy góp ý nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map((fb) => {
                    const statusOptions = getAllowedStatusOptions(fb.status);

                    return (
                      <tr key={fb.id} className="border-b transition-colors hover:bg-muted/30">
                        <td className="px-4 py-4">
                          <div className="font-medium">{fb.user_full_name}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                              {getTypeLabel(fb.type)}
                            </span>
                            {fb.train_detail && (
                              <Badge variant="secondary" className="h-4 w-fit px-1 text-[10px]">
                                Tàu: {fb.train_detail.train_number}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="line-clamp-2 text-muted-foreground">{fb.content}</p>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {format(new Date(fb.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </td>
                        <td className="px-4 py-4">
                          <Select
                            value={fb.status}
                            onValueChange={(value: FeedbackStatus) => handleUpdateStatus(fb.id, value)}
                            disabled={updatingId === fb.id || isStatusLocked(fb.status)}
                          >
                            <SelectTrigger
                              className={`h-9 w-[180px] ${getStatusBadgeClassName(fb.status)}`}
                              aria-label={`Trạng thái góp ý của ${fb.user_full_name}`}
                            >
                              <SelectValue>{getStatusLabel(fb.status)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
