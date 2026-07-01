"use client";

import React, { useEffect, useState } from "react";
import { Train, Activity, Plus, MapPin, Edit, EyeOff, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/StatCard";
import { accentInsensitiveSearch } from "@/lib/utils";
import api from "@/lib/api";

export default function AdminMetroPage() {
  const [lines, setLines] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openStationDialog, setOpenStationDialog] = useState(false);
  const [stationForm, setStationForm] = useState<any>({});

  const [openTrainDialog, setOpenTrainDialog] = useState(false);
  const [trainForm, setTrainForm] = useState<any>({});
  
  const [stationSearch, setStationSearch] = useState("");
  const [trainSearch, setTrainSearch] = useState("");

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get("/admin/lines/").catch(() => ({ data: [] })),
      api.get("/admin/stations/").catch(() => ({ data: [] })),
      api.get("/admin/trains/").catch(() => ({ data: [] })),
    ])
    .then(([resLines, resStations, resTrains]: any) => {
      setLines(resLines.data || []);
      setStations(resStations.data || []);
      setTrains(resTrains.data || []);
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSaveStation = async () => {
    try {
      if (stationForm.id) {
        await api.put(`/admin/stations/${stationForm.id}/`, stationForm);
      } else {
        await api.post(`/admin/stations/`, stationForm);
      }
      setOpenStationDialog(false);
      fetchAll();
    } catch (err: any) {
      console.error(err);
      alert("Lỗi khi lưu ga: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleDeleteStation = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa mềm ga này (chuyển is_active=false)?")) return;
    try {
      await api.delete(`/admin/stations/${id}/`);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa ga.");
    }
  };

  const handleSaveTrain = async () => {
    try {
      if (trainForm.id) {
        await api.put(`/admin/trains/${trainForm.id}/`, trainForm);
      } else {
        await api.post(`/admin/trains/`, trainForm);
      }
      setOpenTrainDialog(false);
      fetchAll();
    } catch (err: any) {
      console.error(err);
      alert("Lỗi khi lưu tàu: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleDeleteTrain = async (id: number) => {
    if (!confirm("Bạn có chắc muốn ẩn tàu này (ngưng hoạt động)?")) return;
    try {
      await api.delete(`/admin/trains/${id}/`);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi ẩn tàu.");
    }
  };
  const filteredStations = stations.filter(s => 
    accentInsensitiveSearch(s.name, stationSearch) || 
    accentInsensitiveSearch(s.code, stationSearch) ||
    accentInsensitiveSearch(s.address || "", stationSearch)
  );

  const filteredTrains = trains.filter(t => 
    accentInsensitiveSearch(t.train_number, trainSearch) ||
    accentInsensitiveSearch(t.current_station_name || "", trainSearch)
  );

  const activeTrains = trains.filter(t => t.is_active).length;
  const activeStations = stations.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          label="Tuyến Metro" 
          value={lines.length} 
          icon={Activity} 
          color="text-blue-600"
          bg="bg-blue-50"
          description="Số tuyến trong hệ thống"
        />
        <StatCard 
          label="Nhà Ga" 
          value={`${activeStations}/${stations.length}`} 
          icon={MapPin} 
          color="text-orange-600"
          bg="bg-orange-50"
          description="Ga đang hoạt động"
        />
        <StatCard 
          label="Đoàn Tàu" 
          value={`${activeTrains}/${trains.length}`} 
          icon={Train} 
          color="text-emerald-600"
          bg="bg-emerald-50"
          description="Tàu đang vận hành"
        />
      </div>

      <Tabs defaultValue="stations" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="stations">Nhà Ga</TabsTrigger>
          <TabsTrigger value="trains">Hệ Thống Tàu</TabsTrigger>
        </TabsList>
        

        <TabsContent value="stations">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full">
                <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-metro-blue" /> Danh sách Nhà Ga</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Tìm tên ga, mã ga..." 
                      className="pl-8" 
                      value={stationSearch}
                      onChange={e => setStationSearch(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => { setStationForm({ is_active: true }); setOpenStationDialog(true); }}><Plus className="h-4 w-4 mr-2" /> Thêm Ga</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <div className="py-10 text-center text-muted-foreground">Đang tải...</div> : (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/80 border-b">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-gray-700">Mã Ga</th>
                          <th className="px-4 py-3 font-semibold text-gray-700">Tên Ga</th>
                          <th className="px-4 py-3 font-semibold text-gray-700">Địa chỉ</th>
                          <th className="px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                          <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStations.map((station: any) => (
                          <tr key={station.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs">{station.code}</td>
                            <td className="px-4 py-3 font-medium">{station.name}</td>
                            <td className="px-4 py-3 text-xs">{station.address || "—"}</td>
                            <td className="px-4 py-3"><Badge variant={station.is_active ? "default" : "destructive"}>{station.is_active ? "Hoạt động" : "Vô hiệu"}</Badge></td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => { setStationForm(station); setOpenStationDialog(true); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => handleDeleteStation(station.id)} disabled={!station.is_active}>
                                  <EyeOff className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trains">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full">
                <CardTitle className="text-lg flex items-center gap-2"><Train className="h-5 w-5 text-metro-blue" /> Danh sách Tàu</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Tìm mã tàu, vị trí..." 
                      className="pl-8" 
                      value={trainSearch}
                      onChange={e => setTrainSearch(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => { setTrainForm({ capacity: 0, status: "active", is_active: true }); setOpenTrainDialog(true); }}><Plus className="h-4 w-4 mr-2" /> Thêm Tàu</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <div className="py-10 text-center text-muted-foreground">Đang tải...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-700">Mã tàu</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Sức chứa</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Tuyến</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Ga đang dừng</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Ga sắp tới</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Tình trạng</th>
                        <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrains.map((train: any) => {
                        const routeLabel = train.route_label || (train.direction === "outbound" ? "Lượt đi" : "Lượt về");
                        const isStopped = train.status === "stopped";
                        const statusLabel = isStopped ? "Đang dừng" : "Di chuyển";
                        const statusClass = isStopped
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700";
                        const conditionLabel = train.is_active ? "Hoạt động" : "Bảo trì";
                        const conditionClass = train.is_active
                          ? "bg-blue-100 text-blue-700"
                          : "bg-rose-100 text-rose-700";

                        return (
                          <tr key={train.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono font-semibold">{train.train_number}</td>
                            <td className="px-4 py-3">{train.capacity ?? "—"}</td>
                            <td className="px-4 py-3 text-sm">{routeLabel}</td>
                            <td className="px-4 py-3">{train.current_station_name ?? <span className="text-muted-foreground text-xs">Chưa xác định</span>}</td>
                            <td className="px-4 py-3">{train.next_station_name ?? <span className="text-muted-foreground text-xs italic">—</span>}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${conditionClass}`}>
                                {conditionLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => { setTrainForm(train); setOpenTrainDialog(true); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => handleDeleteTrain(train.id)} disabled={!train.is_active}>
                                  <EyeOff className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <Dialog open={openStationDialog} onOpenChange={setOpenStationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{stationForm.id ? "Sửa Ga" : "Thêm Ga Mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label>Mã Ga</Label>
              <Input value={stationForm.code || ""} onChange={e => setStationForm({...stationForm, code: e.target.value})} placeholder="VD: BT" />
            </div>
            <div className="space-y-2">
              <Label>Tên Ga</Label>
              <Input value={stationForm.name || ""} onChange={e => setStationForm({...stationForm, name: e.target.value})} placeholder="VD: Bến Thành" />
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input value={stationForm.address || ""} onChange={e => setStationForm({...stationForm, address: e.target.value})} placeholder="VD: Công trường Quách Thị Trang" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tuyến (Line)</Label>
                <select 
                   className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                   value={stationForm.line || ""} 
                   onChange={e => setStationForm({...stationForm, line: parseInt(e.target.value) || ""})}
                 >
                   <option value="">Chọn tuyến...</option>
                   {lines.map((line: any) => (
                     <option key={line.id} value={line.id}>{line.name} ({line.code})</option>
                   ))}
                 </select>
              </div>
              <div className="space-y-2">
                <Label>Thứ tự (Order)</Label>
                <Input type="number" value={stationForm.sequence_order || ""} onChange={e => setStationForm({...stationForm, sequence_order: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <Button onClick={handleSaveStation} className="w-full mt-4">Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openTrainDialog} onOpenChange={setOpenTrainDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{trainForm.id ? "Sửa Tàu" : "Thêm Tàu Mới"}</DialogTitle>
          </DialogHeader>
           <div className="space-y-4 py-3">
             {!trainForm.id && (
               <div className="space-y-2">
                 <Label>Số Tàu</Label>
                 <Input value={trainForm.train_number || ""} onChange={e => setTrainForm({...trainForm, train_number: e.target.value})} placeholder="VD: TR-001" />
               </div>
             )}
             {!trainForm.id && (
               <div className="space-y-2">
                 <Label>Sức Chứa</Label>
                 <Input type="number" value={trainForm.capacity || ""} onChange={e => setTrainForm({...trainForm, capacity: parseInt(e.target.value) || 0})} />
               </div>
             )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={trainForm.status || "active"} 
                    onChange={e => setTrainForm({...trainForm, status: e.target.value})}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="stopped">Đang dừng</option>
                    <option value="maintenance">Bảo trì</option>
                  </select>
                </div>
                {!trainForm.id && (
                  <div className="space-y-2">
                    <Label>Hướng di chuyển</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={trainForm.direction || "outbound"} 
                      onChange={e => setTrainForm({...trainForm, direction: e.target.value})}
                    >
                      <option value="outbound">Lượt đi (Outbound)</option>
                      <option value="inbound">Lượt về (Inbound)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!trainForm.id && (
                  <div className="space-y-2">
                    <Label>Tuyến (Line ID)</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={trainForm.line || ""} 
                      onChange={e => setTrainForm({...trainForm, line: parseInt(e.target.value) || ""})}
                    >
                      <option value="">Chọn tuyến...</option>
                      {lines.map(line => (
                        <option key={line.id} value={line.id}>{line.code} - {line.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {!trainForm.id && (
                  <div className="space-y-2">
                    <Label>Nhà ga hiện tại</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={trainForm.current_station || ""} 
                      onChange={e => setTrainForm({...trainForm, current_station: parseInt(e.target.value) || null})}
                    >
                      <option value="">Không xác định</option>
                      {stations.map(st => (
                        <option key={st.id} value={st.id}>{st.name} ({st.code})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

             <div className="flex items-center space-x-2 pt-2">
               <input 
                 type="checkbox" 
                 id="is_active" 
                 checked={trainForm.is_active !== false} 
                 onChange={e => setTrainForm({...trainForm, is_active: e.target.checked})}
                 className="h-4 w-4 rounded border-gray-300 text-metro-blue focus:ring-metro-blue"
               />
               <Label htmlFor="is_active">Hoạt động</Label>
             </div>

             <Button onClick={handleSaveTrain} className="w-full mt-4">Lưu thông tin tàu</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
