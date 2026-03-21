"use client";

import React, { useEffect, useState } from "react";
import { 
  Train, 
  MapPin, 
  Activity, 
  Plus, 
  Search,
  Filter
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface MetroLine {
  id: number;
  name: string;
  code: string;
  color: string;
  is_active: boolean;
}

export default function AdminMetroPage() {
  const [lines, setLines] = useState<MetroLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/lines/")
      .then((res: any) => setLines(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hệ thống Metro</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý tuyến đường, nhà ga và cơ sở hạ tầng.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Thêm Tuyến mới
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-metro-blue" />
              Các Tuyến đang vận hành
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                  <div className="col-span-full py-10 text-center text-muted-foreground">Đang tải...</div>
                ) : lines.map(line => (
                  <div key={line.id} className="relative overflow-hidden rounded-xl border p-4 hover:shadow-md transition-shadow">
                     <div 
                       className="absolute left-0 top-0 bottom-0 w-1.5" 
                       style={{ backgroundColor: line.color }}
                     />
                     <div className="flex items-start justify-between">
                        <div className="space-y-1">
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: line.color }}>
                                 {line.code}
                              </span>
                              <h3 className="font-bold">{line.name}</h3>
                           </div>
                           <p className="text-xs text-muted-foreground">Cập nhật: 12 phút trước</p>
                        </div>
                        <Badge variant={line.is_active ? "outline" : "secondary"}>
                           {line.is_active ? "Hoạt động" : "Bảo trì"}
                        </Badge>
                     </div>
                     <div className="mt-4 flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-[10px]">Ga dừng (14)</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-[10px]">Tàu (6)</Button>
                        <Button variant="outline" size="sm" className="h-8 ml-auto">Chỉnh sửa</Button>
                     </div>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
