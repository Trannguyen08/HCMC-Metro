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
  { value: "all", label: "Tat ca nhom" },
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
      alert("Khong the tai du lieu amenity trong trang admin.");
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
      alert("Khong the tai danh sach amenity.");
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
        alert("Khong the tai danh sach amenity.");
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
        "Khong the luu amenity. Vui long kiem tra lai du lieu.";
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
      alert("Khong the xoa amenity nay.");
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
          <h2 className="text-2xl font-bold tracking-tight">Quan ly Amenity</h2>
          <p className="text-sm text-muted-foreground">
            Theo doi, cap nhat va bo sung cac tien ich xung quanh ga Metro.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={handleOpenCreate}
          disabled={stations.length === 0 || amenityTypes.length === 0}
        >
          <Plus className="h-4 w-4" />
          Them amenity
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tong amenity</CardTitle>
            <Store className="h-4 w-4 text-metro-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{amenities.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Toan bo diem tien ich dang quan ly</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dang hien thi</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Amenity dang bat tren he thong</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tam an</CardTitle>
            <XCircle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Amenity da tat hoac tam dung</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Do phu nha ga</CardTitle>
            <MapPin className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stationCoverageCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">So nha ga dang co amenity lien ket</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="pb-4">
          <CardTitle>Danh sach amenity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_220px_220px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tim theo ten, dia chi hoac ga..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <Select value={stationFilter} onValueChange={setStationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Loc theo ga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca nha ga</SelectItem>
                {stations.map((station) => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as AmenityType)}>
              <SelectTrigger>
                <SelectValue placeholder="Loc theo nhom" />
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
                <SelectItem value="all">Tat ca trang thai</SelectItem>
                <SelectItem value="true">Dang bat</SelectItem>
                <SelectItem value="false">Tam an</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Amenity</th>
                  <th className="px-4 py-3 font-medium">Loai</th>
                  <th className="px-4 py-3 font-medium">Nha ga</th>
                  <th className="px-4 py-3 font-medium">Khoang cach</th>
                  <th className="px-4 py-3 font-medium">Trang thai</th>
                  <th className="px-4 py-3 font-medium">Cap nhat</th>
                  <th className="px-4 py-3 text-right font-medium">Thao tac</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Dang tai du lieu...
                    </td>
                  </tr>
                ) : amenities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Chua co amenity nao phu hop voi bo loc hien tai.
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
                              {item.address || "Chua cap nhat dia chi"}
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
                        {item.distance_meters ? `${item.distance_meters} m` : "Chua co"}
                      </td>
                      <td className="px-4 py-4">
                        {item.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Dang bat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-rose-600">
                            <XCircle className="h-4 w-4" />
                            Tam an
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {format(new Date(item.updated_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel>Thao tac</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <a
                                href={`/tien-ich/${item.id}-${item.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Xem trang cong khai
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Chinh sua
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-rose-600 focus:text-rose-600"
                              onClick={() => handleOpenDelete(item)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xoa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
            <DialogTitle>{editingItem ? "Chinh sua amenity" : "Them amenity moi"}</DialogTitle>
            <DialogDescription>
              Dien thong tin chi tiet de hien thi amenity trong he thong admin va trang cong khai.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Ten amenity</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Vi du: Highlands Coffee Ben Thanh"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="station">Nha ga</Label>
                <Select
                  value={formData.station}
                  onValueChange={(value) => setFormData({ ...formData, station: value })}
                >
                  <SelectTrigger id="station">
                    <SelectValue placeholder="Chon nha ga" />
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
                    <SelectValue placeholder="Chon loai amenity" />
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
                <Label htmlFor="distance_meters">Khoang cach toi ga (m)</Label>
                <Input
                  id="distance_meters"
                  type="number"
                  min="0"
                  value={formData.distance_meters}
                  onChange={(event) => setFormData({ ...formData, distance_meters: event.target.value })}
                  placeholder="Vi du: 120"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rating">Danh gia</Label>
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
              <Label htmlFor="address">Dia chi</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                placeholder="So nha, duong, phuong..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image_url">Anh dai dien</Label>
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
                    placeholder="Hoac nhap URL https://..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Ho tro JPG, PNG, WEBP, GIF. Kich thuoc toi da 5MB.
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="opening_hours">Gio mo cua</Label>
                <Input
                  id="opening_hours"
                  value={formData.opening_hours}
                  onChange={(event) => setFormData({ ...formData, opening_hours: event.target.value })}
                  placeholder="T2-T6: 07:00 - 22:00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">So dien thoai</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  placeholder="0901234567"
                />
              </div>
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
              <Label htmlFor="description">Mo ta</Label>
              <textarea
                id="description"
                rows={5}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                placeholder="Mo ta ngan ve amenity nay..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: Boolean(checked) })}
              />
              <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium">
                Hien thi amenity tren he thong
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                Huy
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
