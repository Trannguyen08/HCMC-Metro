"use client";

import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Loader2,
  Newspaper,
  FileText,
  Send
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { IMAGE_UPLOAD_ACCEPT, validateImageFile } from "@/lib/upload-validation";
import { Pagination } from "@/components/admin/pagination";
import { StatCard } from "@/components/admin/StatCard";
import { accentInsensitiveSearch } from "@/lib/utils";
import api from "@/lib/api";

interface News {
  id: string;
  category: number;
  category_name: string;
  title: string;
  summary: string;
  thumbnail_url: string;
  is_published: boolean;
  published_at: string | null;
  slug: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
}

export default function AdminNewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<News | null>(null);
  const [itemToDelete, setItemToDelete] = useState<News | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    category: "",
    thumbnail_url: "",
    slug: "",
    is_published: false
  });

  const fetchNews = async (p = page) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/news/", {
        params: { page: p }
      });
      if (res.data.results) {
        setNews(res.data.results);
        setTotalPages(res.data.total_pages || 1);
      } else {
        setNews(Array.isArray(res.data) ? res.data : []);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Fetch news failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/news/categories/");
      setCategories(res.data);
    } catch (err) {
      console.error("Fetch categories failed:", err);
    }
  };

  useEffect(() => {
    fetchNews(page);
    fetchCategories();
  }, [page]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setSelectedFile(null);
    setFormData({
      title: "",
      summary: "",
      category: categories[0]?.id.toString() || "",
      thumbnail_url: "",
      slug: "",
      is_published: false
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: News) => {
    setEditingItem(item);
    setSelectedFile(null);
    setFormData({
      title: item.title,
      summary: item.summary,
      category: item.category.toString(),
      thumbnail_url: item.thumbnail_url,
      slug: item.slug,
      is_published: item.is_published
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (item: News) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationError = validateImageFile(file);

      if (validationError) {
        alert(validationError);
        e.target.value = "";
        return;
      }

      setSelectedFile(file);
      // Optional: auto-generate slug from title if slug is empty
      if (!formData.slug && formData.title) {
         // simple slugify logic could go here
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalThumbnailUrl = formData.thumbnail_url;

      // 1. Upload file to Cloudinary if selected
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);
        const uploadRes = await api.post("/upload/", uploadFormData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        finalThumbnailUrl = uploadRes.data.url;
      }

      // 2. Prepare payload
      const payload = {
        ...formData,
        thumbnail_url: finalThumbnailUrl,
        category: parseInt(formData.category),
        published_at: formData.is_published ? new Date().toISOString() : null
      };

      // 3. Save news
      if (editingItem) {
        await api.put(`/admin/news/${editingItem.id}/`, payload);
      } else {
        await api.post("/admin/news/create/", payload);
      }

      setIsDialogOpen(false);
      setSelectedFile(null);
      fetchNews();
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Có lỗi xảy ra khi lưu tin tức.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/admin/news/${itemToDelete.id}/`);
      setIsDeleteDialogOpen(false);
      fetchNews();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Có lỗi xảy ra khi xóa tin tức.");
    }
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = !searchQuery || 
      accentInsensitiveSearch(item.title, searchQuery) ||
      accentInsensitiveSearch(item.summary, searchQuery);
    
    const matchesCategory = categoryFilter === "all" || item.category.toString() === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const totalNews = news.length;
  const publishedCount = news.filter(n => n.is_published).length;
  const draftCount = news.filter(n => !n.is_published).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quản lý Tin tức</h2>
          <p className="text-sm text-muted-foreground">
            Tạo, chỉnh sửa và xuất bản các bài viết trên hệ thống.
          </p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" /> Thêm Tin mới
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          label="Tổng tin tức" 
          value={totalNews} 
          icon={Newspaper} 
          description="Bài viết trong hệ thống"
        />
        <StatCard 
          label="Đã xuất bản" 
          value={publishedCount} 
          icon={Send} 
          color="text-emerald-600"
          bg="bg-emerald-50"
          description="Tin tức đang công khai"
        />
        <StatCard 
          label="Bản nháp" 
          value={draftCount} 
          icon={FileText} 
          color="text-orange-600"
          bg="bg-orange-50"
          description="Chờ chỉnh sửa/xác nhận"
        />
      </div>

      <Card className="shadow-sm border-none ring-1 ring-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm tiêu đề, nội dung (không dấu vẫn ra)..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0055a4] text-white font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Bài viết</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Ngày tạo</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">Đang tải...</td>
                  </tr>
                ) : filteredNews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">Không có dữ liệu.</td>
                  </tr>
                ) : filteredNews.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-16 flex-shrink-0 bg-muted rounded overflow-hidden">
                          <img 
                            src={item.thumbnail_url || "https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=2070&auto=format&fit=crop"} 
                            alt="" 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="truncate">
                          <div className="font-medium text-foreground">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.summary}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{item.category_name}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.is_published ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none shadow-none font-bold">
                          Công khai
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none shadow-none font-bold">
                          Bản nháp
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      {format(new Date(item.created_at), "dd/MM/yyyy", { locale: vi })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          asChild
                        >
                          <a href={`/tin-tuc/${item.slug}`} target="_blank">
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
                ))}
              </tbody>
            </table>
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              onPageChange={(p) => setPage(p)} 
              className="mt-4 px-6"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Chỉnh sửa tin tức" : "Thêm tin tức mới"}
            </DialogTitle>
            <DialogDescription>
              Điền đầy đủ các thông tin bên dưới để lưu tin tức.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input 
                id="title" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Khai trương tuyến Metro số 1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Danh mục</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input 
                  id="slug" 
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="ví dụ: khai-truong-metro-so-1"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Ảnh đại diện</Label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-32 bg-muted rounded border flex items-center justify-center overflow-hidden">
                  {selectedFile ? (
                    <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="h-full w-full object-cover" />
                  ) : formData.thumbnail_url ? (
                    <img src={formData.thumbnail_url} alt="Thumbnail" className="h-full w-full object-cover" />
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
                    id="thumbnail" 
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="Hoặc nhập URL https://..."
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="summary">Nội dung tóm tắt</Label>
              <textarea 
                id="summary"
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Nội dung ngắn gọn..."
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="published" 
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: !!checked })}
              />
              <Label htmlFor="published" className="text-sm font-medium cursor-pointer">
                Xuất bản (Công khai nội dung này)
              </Label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUploading}>Hủy</Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bài viết &quot;{itemToDelete?.title}&quot;? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
            <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={handleDelete}>Xóa vĩnh viễn</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
