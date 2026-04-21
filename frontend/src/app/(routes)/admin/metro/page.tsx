"use client";

import React, { useEffect, useState } from "react";
import { Train, Activity, Plus, MapPin, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      alert("Loi khi luu ga: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleDeleteStation = async (id: number) => {
    if (!confirm("Ban co chac muon xoa mem ga nay (chuyen is_active=false)?")) return;
    try {
      await api.delete(`/admin/stations/${id}/`);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Loi khi xoa ga.");
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
      alert("Loi khi luu tau: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleDeleteTrain = async (id: number) => {
    if (!confirm("Ban co chac muon xoa mem tau nay (chuyen is_active=false)?")) return;
    try {
      await api.delete(`/admin/trains/${id}/`);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Loi khi xoa tau.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hệ thống Metro</h2>
          <p className="text-sm text-muted-foreground">Quản lý tuyến đường, nhà ga và cơ sở hạ tầng.</p>
        </div>
      </div>

      <Tabs defaultValue="lines" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="lines">Cac Tuyen (Lines)</TabsTrigger>
          <TabsTrigger value="stations">Nha Ga (Stations)</TabsTrigger>
          <TabsTrigger value="trains">Hệ Thống Tau (Trains)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lines">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-metro-blue" /> Cac Tuyen dang van hanh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? <div className="col-span-full py-10 text-center text-muted-foreground">Dang tai...</div> : 
                  lines.map((line: any) => (
                    <div key={line.id} className="relative overflow-hidden rounded-xl border p-4 hover:shadow-md transition-shadow">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: line.color }} />
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: line.color }}>{line.code}</span>
                            <h3 className="font-bold">{line.name}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground">Cap nhat: gan day</p>
                        </div>
                        <Badge variant={line.is_active ? "outline" : "secondary"}>{line.is_active ? "Hoat dong" : "Bao tri"}</Badge>
                      </div>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stations">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-metro-blue" /> Danh sach Nha Ga</CardTitle>
                <Button onClick={() => { setStationForm({ is_active: true }); setOpenStationDialog(true); }}><Plus className="h-4 w-4 mr-2" /> Them Ga</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <div className="py-10 text-center text-muted-foreground">Dang tai...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-700">Ma Ga</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Ten Ga</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">ID Tuyen</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Trang thai</th>
                        <th className="px-4 py-3 font-semibold text-right">Thao tac</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stations.map((station: any) => (
                        <tr key={station.id} className="border-b">
                          <td className="px-4 py-3">{station.code}</td>
                          <td className="px-4 py-3 font-medium">{station.name}</td>
                          <td className="px-4 py-3">{station.line || "-"}</td>
                          <td className="px-4 py-3"><Badge variant={station.is_active ? "default" : "destructive"}>{station.is_active ? "Kich hoat" : "Vô hiệu"}</Badge></td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="icon" onClick={() => { setStationForm(station); setOpenStationDialog(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-rose-600" onClick={() => handleDeleteStation(station.id)} disabled={!station.is_active}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        <TabsContent value="trains">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-lg flex items-center gap-2"><Train className="h-5 w-5 text-metro-blue" /> Danh sach Tau</CardTitle>
                <Button onClick={() => { setTrainForm({ capacity: 0, status: "active", is_active: true }); setOpenTrainDialog(true); }}><Plus className="h-4 w-4 mr-2" /> Them Tau</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <div className="py-10 text-center text-muted-foreground">Dang tai...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-700">So Tau</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Suc chua</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">ID Tuyen</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Trang thai hien tai</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">is_active</th>
                        <th className="px-4 py-3 font-semibold text-right">Thao tac</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trains.map((train: any) => (
                        <tr key={train.id} className="border-b">
                          <td className="px-4 py-3 font-medium">{train.train_number}</td>
                          <td className="px-4 py-3">{train.capacity || 0}</td>
                          <td className="px-4 py-3">{train.line || "-"}</td>
                          <td className="px-4 py-3">{train.status}</td>
                          <td className="px-4 py-3"><Badge variant={train.is_active ? "default" : "destructive"}>{train.is_active ? "Kich hoat" : "Vô hiệu"}</Badge></td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="icon" onClick={() => { setTrainForm(train); setOpenTrainDialog(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-rose-600" onClick={() => handleDeleteTrain(train.id)} disabled={!train.is_active}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
              <Label>ID Tuyến (Line)</Label>
              <Input type="number" value={stationForm.line || ""} onChange={e => setStationForm({...stationForm, line: parseInt(e.target.value) || ""})} placeholder="VD: 1" />
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
            <div className="space-y-2">
              <Label>Số Tàu</Label>
              <Input value={trainForm.train_number || ""} onChange={e => setTrainForm({...trainForm, train_number: e.target.value})} placeholder="VD: TR-001" />
            </div>
            <div className="space-y-2">
              <Label>Sức Chứa</Label>
              <Input type="number" value={trainForm.capacity || ""} onChange={e => setTrainForm({...trainForm, capacity: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Input value={trainForm.status || ""} onChange={e => setTrainForm({...trainForm, status: e.target.value})} placeholder="active / maintenance" />
            </div>
            <div className="space-y-2">
              <Label>ID Tuyến</Label>
              <Input type="number" value={trainForm.line || ""} onChange={e => setTrainForm({...trainForm, line: parseInt(e.target.value) || ""})} placeholder="VD: 1" />
            </div>
            <Button onClick={handleSaveTrain} className="w-full mt-4">Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
