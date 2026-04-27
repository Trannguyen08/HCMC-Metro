"use client";

import * as React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

export default function ProfileSecurityPage() {
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

  return (
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
  );
}
