"use client";

import React, { useEffect, useState } from "react";
import { 
  Users as UsersIcon, 
  Search, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/admin/pagination";
import { StatCard } from "@/components/admin/StatCard";
import { accentInsensitiveSearch } from "@/lib/utils";
import api from "@/lib/api";

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  email_verified: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const fetchUsers = async (p = page) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users/", {
        params: { page: p }
      });
      if (res.data.results) {
        setUsers(res.data.results);
        setTotalPages(res.data.total_pages || 1);
      } else {
        setUsers(Array.isArray(res.data) ? res.data : []);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    accentInsensitiveSearch(u.full_name || "", search) ||
    accentInsensitiveSearch(u.email || "", search)
  );

  const activeUsers = users.filter(u => u.is_active).length;
  const verifiedUsers = users.filter(u => u.email_verified).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quản lý Người dùng</h2>
          <p className="text-sm text-muted-foreground">
            Danh sách tất cả thành viên đã đăng ký trong hệ thống.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          label="Tổng người dùng" 
          value={users.length} 
          icon={UsersIcon} 
          color="text-cyan-600"
          bg="bg-transparent"
          description="Thành viên đã đăng ký"
        />
        <StatCard 
          label="Đang hoạt động" 
          value={activeUsers} 
          icon={ShieldCheck} 
          color="text-emerald-600"
          bg="bg-transparent"
          description="Tài khoản không bị khóa"
        />
        <StatCard 
          label="Xác thực Email" 
          value={verifiedUsers} 
          icon={Mail} 
          color="text-orange-500"
          bg="bg-transparent"
          description="Đã xác thực email thành công"
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
             <CardTitle className="text-lg">Danh sách Thành viên</CardTitle>
             <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm theo tên hoặc email..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-left text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <tr className="border-b">
                    <th className="px-4 py-3">Người dùng</th>
                    <th className="px-4 py-3">Liên hệ</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground">
                        Đang tải danh sách người dùng...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground">
                        Không tìm thấy người dùng nào.
                      </td>
                    </tr>
                  ) : filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-metro-blue/10 flex items-center justify-center text-metro-blue font-bold">
                             {u.full_name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="font-bold text-foreground">{u.full_name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Mail className="h-3 w-3 opacity-60" /> {u.email}
                          </div>
                          {u.phone && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <Phone className="h-3 w-3 opacity-60" /> {u.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <Badge variant={u.is_active ? "outline" : "secondary"} className="w-fit text-[10px] font-bold uppercase">
                            {u.is_active ? "Đang hoạt động" : "Bị khóa"}
                          </Badge>
                          {u.email_verified && (
                            <span className="flex items-center gap-1 text-[9px] text-metro-green font-bold uppercase">
                              <UserCheck className="h-3 w-3" /> Đã xác thực
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2">
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              Gửi thông báo
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 text-rose-600 focus:text-rose-600">
                               {u.is_active ? (
                                 <><UserX className="h-4 w-4" /> Khóa tài khoản</>
                               ) : (
                                 <><UserCheck className="h-4 w-4" /> Mở khóa</>
                               )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            onPageChange={(p) => setPage(p)} 
            className="mt-4"
          />
        </CardContent>
      </Card>
    </div>
  );
}
