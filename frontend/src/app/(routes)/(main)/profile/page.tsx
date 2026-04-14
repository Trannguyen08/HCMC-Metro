"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { LogIn, QrCode, UserCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import api from "@/services/api-client";

type TicketItem = {
  id: string;
  ticket_type_name: string;
  status: string;
  valid_from: string;
  valid_until: string;
  from_station_details?: { name?: string; code?: string } | null;
  to_station_details?: { name?: string; code?: string } | null;
  price_paid: string;
  created_at: string;
};

function statusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Đang hoạt động";
    case "pending":
      return "Chưa thanh toán";
    case "cancelled":
      return "Đã hủy";
    case "expired":
      return "Hết hạn";
    case "used":
      return "Đang sử dụng";
    default:
      return status;
  }
}

function TicketStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const variant = normalized === "active" ? "secondary" : normalized === "cancelled" ? "outline" : "default";
  return <Badge variant={variant as any}>{statusLabel(status)}</Badge>;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN");
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN");
}

function formatRoute(t: TicketItem) {
  const fromName = t.from_station_details?.name || "Hệ thống";
  const toName = t.to_station_details?.name || "Tất cả ga";
  return `${fromName} → ${toName}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateProfile, logout } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = React.useState(user?.full_name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [phone, setPhone] = React.useState(user?.phone ?? "");
  const [saved, setSaved] = React.useState(false);

  const [tickets, setTickets] = React.useState<TicketItem[]>([]);
  const [loadingTickets, setLoadingTickets] = React.useState(false);
  const [qrByTicket, setQrByTicket] = React.useState<Record<string, string>>({});
  const [actingTicketId, setActingTicketId] = React.useState<string | null>(null);

  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [showOldPassword, setShowOldPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [securityLoading, setSecurityLoading] = React.useState(false);
  const [securityMessage, setSecurityMessage] = React.useState({ type: "", text: "" });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || newPassword.length < 6) {
      setSecurityMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }
    setSecurityLoading(true);
    setSecurityMessage({ type: "", text: "" });
    try {
      await api.post("/auth/change-password/", { old_password: oldPassword, new_password: newPassword });
      setSecurityMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setSecurityMessage({ type: "error", text: err.response?.data?.detail || "Lỗi khi đổi mật khẩu." });
    } finally {
      setSecurityLoading(false);
    }
  };

  React.useEffect(() => {
    setName(user?.full_name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      const accessToken = typeof window !== "undefined" ? localStorage.getItem("metro.access") : null;
      if (!accessToken) {
        await logout();
        return;
      }

      setLoadingTickets(true);
      try {
        const meRes = await api.get("/auth/me/");
        const ticketsRes = await api.get("/ticketing/my-tickets/");
        const me = meRes.data;
        updateProfile({
          full_name: me.full_name,
          email: me.email,
          phone: me.phone,
          date_of_birth: me.date_of_birth,
          avatar_url: me.avatar_url,
          email_verified: me.email_verified,
          is_admin: me.is_admin,
        });

        const ticketData = ticketsRes.data?.results || ticketsRes.data || [];
        setTickets(Array.isArray(ticketData) ? ticketData : []);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          await logout();
          return;
        }
        console.error("Failed to load profile tickets", err);
      } finally {
        setLoadingTickets(false);
      }
    };

    load();
  }, [isAuthenticated, updateProfile, logout]);

  const activeTickets = React.useMemo(
    () => tickets.filter((t) => t.status === "active"),
    [tickets]
  );

  const loadQr = async (ticketId: string) => {
    try {
      const res = await api.get(`/ticketing/my-tickets/${ticketId}/qr/`);
      const qr = res.data?.qr_base64;
      if (qr) {
        setQrByTicket((prev) => ({ ...prev, [ticketId]: qr }));
      }
    } catch (err) {
      console.error("Failed to load QR", err);
    }
  };

  const downloadQrImage = (ticketId: string) => {
    const qr = qrByTicket[ticketId];
    if (!qr) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${qr}`;
    link.download = `metro-ticket-${ticketId.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const continuePayment = async (ticketId: string) => {
    setActingTicketId(ticketId);
    try {
      const res = await api.post("/payments/payos/continue/", { ticket_id: ticketId });
      if (!res.data?.payment_url) {
        alert("Không tạo được liên kết thanh toán.");
        return;
      }
      window.location.href = res.data.payment_url;
    } catch (err: any) {
      alert(err.response?.data?.detail || "Không thể tiếp tục thanh toán.");
    } finally {
      setActingTicketId(null);
    }
  };

  const cancelTicket = async (ticketId: string) => {
    setActingTicketId(ticketId);
    try {
      await api.post(`/ticketing/my-tickets/${ticketId}/cancel/`);
      setTickets((prev) => prev.map((item) => (item.id === ticketId ? { ...item, status: "cancelled" } : item)));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Không thể hủy vé.");
    } finally {
      setActingTicketId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">{t("profile.not_logged_in")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("profile.not_logged_in_desc")}</p>
            <Button asChild>
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                {t("nav.login")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">{t("profile.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("profile.desc")}</p>
        </div>
        <Button variant="outline" onClick={logout}>
          {t("nav.logout")}
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="profile">{t("profile.personal_info")}</TabsTrigger>
          <TabsTrigger value="history">{t("profile.ticket_history")}</TabsTrigger>
          <TabsTrigger value="active">{t("profile.active_tickets")}</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <UserCircle2 className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{user?.full_name}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                </div>
                <Button variant="outline" size="sm" type="button" onClick={() => alert("Upload avatar (mock).")}>Tải ảnh</Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1 md:col-span-1">
                  <Label>Họ tên</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <Label>Số điện thoại</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    updateProfile({ full_name: name, email, phone });
                    setSaved(true);
                    window.setTimeout(() => setSaved(false), 1200);
                  }}
                >
                  {t("profile.save")}
                </Button>
                {saved && <span className="text-sm text-metro-green">{t("profile.saved")}</span>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lịch sử vé</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTickets ? (
                <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
              ) : tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu vé.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60 text-left text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">{t("table.id")}</th>
                        <th className="px-4 py-3 font-medium">{t("table.route")}</th>
                        <th className="px-4 py-3 font-medium">{t("table.date")}</th>
                        <th className="px-4 py-3 font-medium">{t("table.type")}</th>
                        <th className="px-4 py-3 font-medium">{t("table.price")}</th>
                        <th className="px-4 py-3 font-medium">{t("table.status")}</th>
                        <th className="px-4 py-3 font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => (
                        <tr key={ticket.id} className="border-t">
                          <td className="px-4 py-3 font-medium">#{ticket.id.slice(0, 8)}</td>
                          <td className="px-4 py-3">{formatRoute(ticket)}</td>
                          <td className="px-4 py-3">{formatDateTime(ticket.created_at)}</td>
                          <td className="px-4 py-3">{ticket.ticket_type_name}</td>
                          <td className="px-4 py-3">{Math.round(parseFloat(ticket.price_paid || "0")).toLocaleString("vi-VN")}đ</td>
                          <td className="px-4 py-3">
                            <TicketStatusBadge status={ticket.status} />
                          </td>
                          <td className="px-4 py-3">
                            {ticket.status === "pending" ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => continuePayment(ticket.id)}
                                  disabled={actingTicketId === ticket.id}
                                >
                                  Tiếp tục thanh toán
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cancelTicket(ticket.id)}
                                  disabled={actingTicketId === ticket.id}
                                >
                                  Hủy vé
                                </Button>
                              </div>
                            ) : ticket.status === "cancelled" ? (
                              <span className="text-xs text-muted-foreground">Đã hủy</span>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => router.push(`/dat-ve/thanh-cong?id=${ticket.id}`)}>
                                Xem chi tiết
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          {loadingTickets ? (
            <Card className="shadow-card">
              <CardContent className="p-4 text-sm text-muted-foreground">Đang tải dữ liệu...</CardContent>
            </Card>
          ) : activeTickets.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-4 text-sm text-muted-foreground">Không có vé đang hoạt động.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {activeTickets.map((ticket) => (
                <Card key={ticket.id} className="card-hover shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Vé #{ticket.id.slice(0, 8)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-xl border bg-background p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t("ticket.type")}</span>
                        <span className="font-medium">{ticket.ticket_type_name}</span>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t("ticket.validity")}</span>
                        <span className="font-medium">{formatDate(ticket.valid_from)} - {formatDate(ticket.valid_until)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <QrCode className="h-4 w-4 text-metro-blue" />
                          Mã QR Vé
                        </div>
                        <div className="text-xs text-muted-foreground">Xuất trình tại cổng soát vé</div>
                      </div>
                      <div>
                        {qrByTicket[ticket.id] ? (
                          <div className="flex flex-col items-center gap-2">
                            <img
                              src={`data:image/png;base64,${qrByTicket[ticket.id]}`}
                              alt={`QR ${ticket.id}`}
                              className="h-20 w-20 rounded-lg border bg-background p-1"
                            />
                            <Button size="sm" variant="outline" onClick={() => downloadQrImage(ticket.id)}>
                              Tải ảnh
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => loadQr(ticket.id)}>
                            Tải QR
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="security">
          <Card className="shadow-card max-w-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Đổi mật khẩu</CardTitle>
            </CardHeader>
            <CardContent>
              {securityMessage.text && (
                <div className={`mb-4 rounded p-3 text-sm font-medium ${securityMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-600"}`}>
                  {securityMessage.text}
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Mật khẩu hiện tại</Label>
                  <div className="relative">
                    <Input
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="********"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mật khẩu ít nhất 6 ký tự"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={securityLoading || !oldPassword || newPassword.length < 6}>
                  {securityLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Lưu mật khẩu
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

