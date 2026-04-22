"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Edit,
  Eye,
  Loader2,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Store,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import api from "@/lib/api";
import { IMAGE_UPLOAD_ACCEPT, validateImageFile } from "@/lib/upload-validation";
import { TYPE_COLORS, TYPE_LABELS } from "@/features/metro/constants/amenity";
import type { AmenityType, MetroStation } from "@/types/amenity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AmenityCategory = Exclude<AmenityType, "all">;

interface AdminAmenity {
  id: string;
  name: string;
  slug: string;
  category: AmenityCategory;
  address: string;
  station_code: string;
  station_name: string;
  amenity_type_name: string;
  distance_meters: number | null;
  image_url: string;
  description: string;
  rating: number | null;
  opening_hours: string;
  phone: string;
  website: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AmenityTypeOption {
  id: number;
  name: string;
  category: AmenityCategory;
}

interface AmenityFormState {
  name: string;
  station: string;
  amenity_type: string;
  address: string;
  distance_meters: string;
  image_url: string;
  description: string;
  rating: string;
  opening_hours: string;
  phone: string;
  website: string;
  is_active: boolean;
}

const CATEGORY_OPTIONS: Array<{ value: AmenityType; label: string }> = [
  { value: "all", label: "Tất cả nhóm" },
  { value: "cafe", label: TYPE_LABELS.cafe },
  { value: "restaurant", label: TYPE_LABELS.restaurant },
  { value: "shopping", label: TYPE_LABELS.shopping },
  { value: "hotel", label: TYPE_LABELS.hotel },
  { value: "service", label: TYPE_LABELS.service },
];

function createEmptyForm(
  stations: MetroStation[],
  amenityTypes: AmenityTypeOption[],
): AmenityFormState {
  return {
    name: "",
    station: stations[0]?.id ?? "",
    amenity_type: amenityTypes[0]?.id.toString() ?? "",
    address: "",
    distance_meters: "",
    image_url: "",
    description: "",
    rating: "",
    opening_hours: "",
    phone: "",
    website: "",
    is_active: true,
  };
}

export default function AdminAmenitiesPage() {
  const [amenities, setAmenities] = useState<AdminAmenity[]>([]);
  const [stations, setStations] = useState<MetroStation[]>([]);
  const [amenityTypes, setAmenityTypes] = useState<AmenityTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [stationFilter, setStationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<AmenityType>("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminAmenity | null>(null);
  const [itemToDelete, setItemToDelete] = useState<AdminAmenity | null>(null);
  const [formData, setFormData] = useState<AmenityFormState>(createEmptyForm([], []));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    void fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [amenitiesRes, stationsRes, amenityTypesRes] = await Promise.all([
        api.get<AdminAmenity[]>("/admin/amenities/"),
        api.get<MetroStation[]>("/metro/stations/"),
        api.get<AmenityTypeOption[]>("/admin/amenity-types/"),
      ]);

      setAmenities(amenitiesRes.data);
      setStations(stationsRes.data);
      setAmenityTypes(amenityTypesRes.data);
    } catch (error) {
      console.error("Fetch amenities admin data failed:", error);
      alert("Không thể tải dữ liệu tiện ích trong trang admin.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshAmenities() {
    try {
      const params: Record<string, string> = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (stationFilter !== "all") params.station = stationFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (statusFilter !== "all") params.is_active = statusFilter;

      const response = await api.get<AdminAmenity[]>("/admin/amenities/", { params });
      setAmenities(response.data);
    } catch (error) {
      console.error("Refresh amenities failed:", error);
      alert("Không thể tải danh sách tiện ích.");
    }
  }

  useEffect(() => {
    if (loading) return;

    const syncAmenities = async () => {
      try {
        const params: Record<string, string> = {};
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (stationFilter !== "all") params.station = stationFilter;
        if (categoryFilter !== "all") params.category = categoryFilter;
        if (statusFilter !== "all") params.is_active = statusFilter;

        const response = await api.get<AdminAmenity[]>("/admin/amenities/", { params });
        setAmenities(response.data);
      } catch (error) {
        console.error("Refresh amenities failed:", error);
        alert("Không thể tải danh sách tiện ích.");
      }
    };

    void syncAmenities();
  }, [loading, searchQuery, stationFilter, categoryFilter, statusFilter]);

  function handleOpenCreate() {
    setEditingItem(null);
    setFormData(createEmptyForm(stations, amenityTypes));
    setSelectedFile(null);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(item: AdminAmenity) {
    const amenityType = amenityTypes.find((option) => option.name === item.amenity_type_name);

    setEditingItem(item);
    setFormData({
      name: item.name,
      station: item.station_code,
      amenity_type: amenityType?.id.toString() ?? "",
      address: item.address ?? "",
      distance_meters: item.distance_meters?.toString() ?? "",
      image_url: item.image_url ?? "",
      description: item.description ?? "",
      rating: item.rating?.toString() ?? "",
      opening_hours: item.opening_hours ?? "",
      phone: item.phone ?? "",
      website: item.website ?? "",
      is_active: item.is_active,
    });
    setSelectedFile(null);
    setIsDialogOpen(true);
  }

  function handleOpenDelete(item: AdminAmenity) {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      alert(validationError);
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      let finalImageUrl = formData.image_url.trim();

      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);

        const uploadResponse = await api.post<{ url: string }>("/upload/", uploadFormData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        finalImageUrl = uploadResponse.data.url;
      }

      const payload = {
        name: formData.name.trim(),
        station: formData.station,
        amenity_type: Number(formData.amenity_type),
        address: formData.address.trim(),
        distance_meters: formData.distance_meters ? Number(formData.distance_meters) : null,
        image_url: finalImageUrl,
        description: formData.description.trim(),
        rating: formData.rating ? Number(formData.rating) : null,
        opening_hours: formData.opening_hours.trim(),
        phone: formData.phone.trim(),
        website: formData.website.trim(),
        is_active: formData.is_active,
      };

      if (editingItem) {
        await api.put(`/admin/amenities/${editingItem.id}/`, payload);
      } else {
        await api.post("/admin/amenities/create/", payload);
      }

      setIsDialogOpen(false);
      setSelectedFile(null);
      await refreshAmenities();
    } catch (error) {
      console.error("Submit amenity failed:", error);
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
        "Không thể lưu tiện ích. Vui lòng kiểm tra lại dữ liệu.";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/admin/amenities/${itemToDelete.id}/`);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      await refreshAmenities();
    } catch (error) {
      console.error("Delete amenity failed:", error);
      alert("Không thể xóa tiện ích này.");
    } finally {
      setDeleting(false);
    }
  }

  const activeCount = amenities.filter((item) => item.is_active).length;
  const inactiveCount = amenities.filter((item) => !item.is_active).length;
  const stationCoverageCount = new Set(amenities.map((item) => item.station_code)).size;

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quản lý tiện ích</h2>
          <p className="text-sm text-muted-foreground">
            Theo dõi, cập nhật và bổ sung các tiện ích xung quanh ga Metro.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={handleOpenCreate}
          disabled={stations.length === 0 || amenityTypes.length === 0}
        >
          <Plus className="h-4 w-4" />
          Thêm tiện ích
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng tiện ích</CardTitle>
            <Store className="h-4 w-4 text-metro-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{amenities.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Toàn bộ điểm tiện ích đang quản lý</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang hiển thị</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Tiện ích đang bật trên hệ thống</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tạm ẩn</CardTitle>
            <XCircle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Tiện ích đã tắt hoặc tạm dừng</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Độ phủ nhà ga</CardTitle>
            <MapPin className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stationCoverageCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Số nhà ga đang có tiện ích liên kết</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="pb-4">
          <CardTitle>Danh sách tiện ích</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_220px_220px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm theo tên, địa chỉ hoặc ga..."
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

            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as AmenityType)}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo nhóm" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trang thai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="true">Đang bật</SelectItem>
                <SelectItem value="false">Tạm ẩn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Tiện ích</th>
                  <th className="px-4 py-3 font-medium">Loại</th>
                  <th className="px-4 py-3 font-medium">Nhà ga</th>
                  <th className="px-4 py-3 font-medium">Khoảng cách</th>
                  <th className="px-4 py-3 font-medium">Giờ hoạt động</th>
                  <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : amenities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Chưa có tiện ích nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  amenities.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-20 overflow-hidden rounded-md bg-muted">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground">{item.name}</div>
                            <div className="line-clamp-2 text-xs text-muted-foreground">
                              {item.address || "Chưa cập nhật địa chỉ"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <Badge className={TYPE_COLORS[item.category]}>
                            {TYPE_LABELS[item.category]}
                          </Badge>
                          <div className="text-xs text-muted-foreground">{item.amenity_type_name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{item.station_name}</div>
                        <div className="text-xs text-muted-foreground">{item.station_code}</div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {item.distance_meters ? `${item.distance_meters} m` : "Chưa có"}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {item.opening_hours || "Chưa có"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            asChild
                          >
                            <a
                              href={`/tien-ich/${item.id}-${item.slug}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Chỉnh sửa tiện ích" : "Thêm tiện ích mới"}</DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết để hiển thị tiện ích trong hệ thống admin và trang công khai.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên amenity</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Ví dụ: Highlands Coffee"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="station">Nhà ga</Label>
                <Select
                  value={formData.station}
                  onValueChange={(value) => setFormData({ ...formData, station: value })}
                >
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
                <Label htmlFor="amenity_type">Loai chi tiet</Label>
                <Select
                  value={formData.amenity_type}
                  onValueChange={(value) => setFormData({ ...formData, amenity_type: value })}
                >
                  <SelectTrigger id="amenity_type">
                    <SelectValue placeholder="Chọn loại tiện ích" />
                  </SelectTrigger>
                  <SelectContent>
                    {amenityTypes.map((option) => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="distance_meters">Khoảng cách tới ga (m)</Label>
                <Input
                  id="distance_meters"
                  type="number"
                  min="0"
                  value={formData.distance_meters}
                  onChange={(event) => setFormData({ ...formData, distance_meters: event.target.value })}
                  placeholder="Ví dụ: 120"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rating">Đánh giá</Label>
                <Input
                  id="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(event) => setFormData({ ...formData, rating: event.target.value })}
                  placeholder="0.0 - 5.0"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                placeholder="Số nhà, đường..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image_url">Ảnh đại diện</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-36 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {selectedFile ? (
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Amenity preview"
                      className="h-full w-full object-cover"
                    />
                  ) : formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt="Amenity preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground opacity-30" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept={IMAGE_UPLOAD_ACCEPT}
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(event) => setFormData({ ...formData, image_url: event.target.value })}
                    placeholder="Hoặc nhập URL https://..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Hỗ trợ JPG, PNG, WEBP, GIF. Kích thước tối đa 5MB.
                  </p>
                </div>
              </div>
              {formData.image_url && !selectedFile ? (
                <div className="overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={formData.image_url}
                    alt="Amenity preview"
                    className="h-48 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="opening_hours">Giờ mở cửa</Label>
              <Input
                id="opening_hours"
                value={formData.opening_hours}
                onChange={(event) => setFormData({ ...formData, opening_hours: event.target.value })}
                placeholder="T2-T6: 07:00 - 22:00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                placeholder="0901234567"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(event) => setFormData({ ...formData, website: event.target.value })}
                placeholder="https://domain.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Mô tả</Label>
              <textarea
                id="description"
                rows={5}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                placeholder="Mô tả..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: Boolean(checked) })}
              />
              <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium">
                Hiển thị tiện ích trên hệ thống
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  !formData.station ||
                  !formData.amenity_type ||
                  !formData.name.trim()
                }
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingItem ? "Cap nhat amenity" : "Tao amenity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xac nhan xoa amenity</DialogTitle>
            <DialogDescription>
              Amenity &quot;{itemToDelete?.name}&quot; se bi xoa khoi he thong. Hanh dong nay khong the hoan tac.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleting}>
              Huy
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Xoa amenity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
