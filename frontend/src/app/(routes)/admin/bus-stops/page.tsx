"use client";

import { useEffect, useState } from "react";
import { Bus, Edit, Loader2, MapPin, Plus, Search, Trash2 } from "lucide-react";

import api from "@/lib/api";
import type { MetroStation } from "@/types/amenity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminBusStop {
  id: number;
  name: string;
  code: string;
  station_code: string;
  station_name: string;
  address: string | null;
  latitude: string;
  longitude: string;
  routes: string[] | null;
  distance_to_station: number | null;
  stop_type: string | null;
  note: string | null;
  is_active: boolean;
}

interface BusStopFormState {
  name: string;
  code: string;
  station: string;
  address: string;
  latitude: string;
  longitude: string;
  routes: string;
  distance_to_station: string;
  stop_type: string;
  note: string;
  is_active: boolean;
}

function createEmptyForm(stations: MetroStation[]): BusStopFormState {
  return {
    name: "",
    code: "",
    station: stations[0]?.id ?? "",
    address: "",
    latitude: "",
    longitude: "",
    routes: "",
    distance_to_station: "",
    stop_type: "",
    note: "",
    is_active: true,
  };
}

export default function AdminBusStopsPage() {
  const [busStops, setBusStops] = useState<AdminBusStop[]>([]);
  const [stations, setStations] = useState<MetroStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [stationFilter, setStationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminBusStop | null>(null);
  const [itemToDelete, setItemToDelete] = useState<AdminBusStop | null>(null);
  const [formData, setFormData] = useState<BusStopFormState>(createEmptyForm([]));

  useEffect(() => {
    void fetchInitialData();
  }, []);

  useEffect(() => {
    if (loading) return;
    void refreshBusStops();
  }, [loading, searchQuery, stationFilter, statusFilter]);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [busRes, stationsRes] = await Promise.all([
        api.get<AdminBusStop[]>("/admin/bus-stops/"),
        api.get<MetroStation[]>("/metro/stations/"),
      ]);
      setBusStops(busRes.data);
      setStations(stationsRes.data);
    } catch (error) {
      console.error("Fetch bus stop admin data failed:", error);
      alert("Không thể tải dữ liệu trạm bus trong trang admin.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshBusStops() {
    try {
      const params: Record<string, string> = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (stationFilter !== "all") params.station = stationFilter;
      if (statusFilter !== "all") params.is_active = statusFilter;

      const response = await api.get<AdminBusStop[]>("/admin/bus-stops/", { params });
      setBusStops(response.data);
    } catch (error) {
      console.error("Refresh bus stops failed:", error);
      alert("Không thể tải danh sách trạm bus.");
    }
  }

  function handleOpenCreate() {
    setEditingItem(null);
    setFormData(createEmptyForm(stations));
    setDialogOpen(true);
  }

  function handleOpenEdit(item: AdminBusStop) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      station: item.station_code,
      address: item.address ?? "",
      latitude: item.latitude?.toString() ?? "",
      longitude: item.longitude?.toString() ?? "",
      routes: item.routes?.join(", ") ?? "",
      distance_to_station: item.distance_to_station?.toString() ?? "",
      stop_type: item.stop_type ?? "",
      note: item.note ?? "",
      is_active: item.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        station: formData.station,
        address: formData.address.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        routes: formData.routes
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        distance_to_station: formData.distance_to_station ? Number(formData.distance_to_station) : null,
        stop_type: formData.stop_type.trim(),
        note: formData.note.trim(),
        is_active: formData.is_active,
      };

      if (editingItem) {
        await api.put(`/admin/bus-stops/${editingItem.id}/`, payload);
      } else {
        await api.post("/admin/bus-stops/", payload);
      }

      setDialogOpen(false);
      await refreshBusStops();
    } catch (error) {
      console.error("Submit bus stop failed:", error);
      alert("Không thể lưu trạm bus. Vui lòng kiểm tra lại dữ liệu.");
    } finally {
      setSaving(false);
    }
  }

  function handleOpenDelete(item: AdminBusStop) {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/admin/bus-stops/${itemToDelete.id}/`);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      await refreshBusStops();
    } catch (error) {
      console.error("Delete bus stop failed:", error);
      alert("Không thể xóa trạm bus.");
    } finally {
      setDeleting(false);
    }
  }

  const activeCount = busStops.filter((item) => item.is_active).length;
  const coveredStations = new Set(busStops.map((item) => item.station_code)).size;

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quản lý trạm bus</h2>
          <p className="text-sm text-muted-foreground">
            Theo dõi, cập nhật và bổ sung các điểm trung chuyển xe buýt gần ga metro.
          </p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate} disabled={stations.length === 0}>
          <Plus className="h-4 w-4" />
          Thêm trạm bus
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số trạm</CardTitle>
            <Bus className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{busStops.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Toàn bộ điểm bus đang quản lý</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang hiển thị</CardTitle>
            <MapPin className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Trạm bus đang bật trên bản đồ số</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ga đã liên kết</CardTitle>
            <Search className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coveredStations}</div>
            <p className="mt-1 text-xs text-muted-foreground">Số ga metro đã có trạm bus liên kết</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="pb-4">
          <CardTitle>Danh sách trạm bus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_220px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm theo tên, mã, địa chỉ hoặc ga..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <Select value={stationFilter} onValueChange={setStationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo ga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhà ga</SelectItem>
                {stations.map((station) => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="true">Hoạt động</SelectItem>
                <SelectItem value="false">Tạm ẩn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-medium">Trạm bus</th>
                    <th className="px-4 py-3 font-medium">Ga liên kết</th>
                    <th className="px-4 py-3 font-medium">Tuyến</th>
                    <th className="px-4 py-3 font-medium">Khoảng cách</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : busStops.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        Chưa có trạm bus nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    busStops.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-4">
                          <div className="font-bold text-foreground">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {item.code} · {item.address || "Chưa cập nhật địa chỉ"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium">{item.station_name}</div>
                          <div className="text-xs text-muted-foreground">{item.station_code}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex max-w-[280px] flex-wrap gap-1.5">
                            {item.routes?.length ? (
                              item.routes.map((route) => (
                                <Badge key={route} variant="secondary" className="text-[10px] font-bold">
                                  {route}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Chưa có</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground text-xs font-mono">
                          {item.distance_to_station ? `${item.distance_to_station} m` : "Chưa có"}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={item.is_active ? "default" : "secondary"} className="text-[10px] font-bold uppercase">
                            {item.is_active ? "Hoạt động" : "Tạm ẩn"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => handleOpenDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Chỉnh sửa trạm bus" : "Thêm trạm bus mới"}</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin trạm bus để hiển thị trên bản đồ số và quản trị nội bộ.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên trạm bus</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Mã trạm</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(event) => setFormData({ ...formData, code: event.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="station">Nhà ga liên kết</Label>
                <Select value={formData.station} onValueChange={(value) => setFormData({ ...formData, station: value })}>
                  <SelectTrigger id="station">
                    <SelectValue placeholder="Chọn nhà ga" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="stop_type">Loại trạm</Label>
                <Input
                  id="stop_type"
                  value={formData.stop_type}
                  onChange={(event) => setFormData({ ...formData, stop_type: event.target.value })}
                  placeholder="Ví dụ: Trạm dừng xe buýt"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.00000001"
                  value={formData.latitude}
                  onChange={(event) => setFormData({ ...formData, latitude: event.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.00000001"
                  value={formData.longitude}
                  onChange={(event) => setFormData({ ...formData, longitude: event.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="distance_to_station">Khoảng cách tới ga (m)</Label>
                <Input
                  id="distance_to_station"
                  type="number"
                  min="0"
                  value={formData.distance_to_station}
                  onChange={(event) => setFormData({ ...formData, distance_to_station: event.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(event) => setFormData({ ...formData, address: event.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="routes">Các tuyến bus</Label>
              <Input
                id="routes"
                value={formData.routes}
                onChange={(event) => setFormData({ ...formData, routes: event.target.value })}
                placeholder="Ví dụ: 1, 3, 4, 155"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Ghi chú</Label>
              <textarea
                id="note"
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.note}
                onChange={(event) => setFormData({ ...formData, note: event.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: Boolean(checked) })}
              />
              <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium">
                Hiển thị trạm bus trên hệ thống
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Hủy
              </Button>
              <Button type="submit" disabled={saving || !formData.name.trim() || !formData.code.trim() || !formData.station}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingItem ? "Cập nhật trạm bus" : "Tạo trạm bus"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa trạm bus</DialogTitle>
            <DialogDescription>
              Trạm bus &quot;{itemToDelete?.name}&quot; sẽ bị xóa khỏi hệ thống.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Hủy
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Xóa trạm bus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
