export const METRO_STATIONS = [
  { id: 1, name: "Bến Thành", code: "BT" },
  { id: 2, name: "Nhà hát TP", code: "NH" },
  { id: 3, name: "Ba Son", code: "BS" },
  { id: 4, name: "Văn Thánh", code: "VT" },
  { id: 5, name: "Tân Cảng", code: "TC" },
  { id: 6, name: "Thảo Điền", code: "TD" },
  { id: 7, name: "An Phú", code: "AP" },
  { id: 8, name: "Rạch Chiếc", code: "RC" },
  { id: 9, name: "Phước Long", code: "PL" },
  { id: 10, name: "Bình Thái", code: "BinhT" },
  { id: 11, name: "Thủ Đức", code: "ThuD" },
  { id: 12, name: "Khu CNC", code: "CNC" },
  { id: 13, name: "Đại học QG", code: "DHQG" },
  { id: 14, name: "Suối Tiên", code: "ST" }
] as const;

export type MetroStation = (typeof METRO_STATIONS)[number];

export type TicketType = "Một chiều" | "Khứ hồi" | "Tháng";

export type RouteResult = {
  id: string;
  from: MetroStation;
  to: MetroStation;
  departureTime: string; // HH:mm
  arrivalTime: string; // HH:mm
  durationMinutes: number;
  priceVnd: number;
  stops: MetroStation[];
};

function idxOf(stationId: number) {
  return METRO_STATIONS.findIndex((s) => s.id === stationId);
}

export function estimatePriceVnd(fromId: number, toId: number) {
  const a = idxOf(fromId);
  const b = idxOf(toId);
  const hops = Math.max(1, Math.abs(a - b));
  const raw = 6000 + hops * 1200;
  return Math.min(20000, raw);
}

export function buildStops(fromId: number, toId: number) {
  const a = idxOf(fromId);
  const b = idxOf(toId);
  if (a === -1 || b === -1) return [];
  const dir = a <= b ? 1 : -1;
  const stops: MetroStation[] = [];
  for (let i = a; dir === 1 ? i <= b : i >= b; i += dir) {
    stops.push(METRO_STATIONS[i]);
  }
  return stops;
}

export function mockRouteResults(fromId: number, toId: number): RouteResult[] {
  const from = METRO_STATIONS.find((s) => s.id === fromId) ?? METRO_STATIONS[0];
  const to = METRO_STATIONS.find((s) => s.id === toId) ?? METRO_STATIONS[13];
  const basePrice = estimatePriceVnd(from.id, to.id);
  const stops = buildStops(from.id, to.id);

  const samples = [
    { dep: "06:10", arr: "06:38", dur: 28, factor: 1.0 },
    { dep: "07:00", arr: "07:30", dur: 30, factor: 1.05 },
    { dep: "08:15", arr: "08:47", dur: 32, factor: 0.95 },
    { dep: "10:05", arr: "10:35", dur: 30, factor: 1.0 },
    { dep: "17:20", arr: "17:55", dur: 35, factor: 1.1 },
    { dep: "20:10", arr: "20:42", dur: 32, factor: 1.0 }
  ];

  return samples.map((s, i) => ({
    id: `r_${from.code}_${to.code}_${i}`,
    from,
    to,
    departureTime: s.dep,
    arrivalTime: s.arr,
    durationMinutes: s.dur,
    priceVnd: Math.round(basePrice * s.factor / 1000) * 1000,
    stops
  }));
}

export type AmenityCategory =
  | "Tất cả"
  | "Y tế"
  | "Giáo dục"
  | "Ăn uống"
  | "Mua sắm"
  | "Ngân hàng"
  | "Bãi xe";

export type Amenity = {
  id: string;
  stationId: number;
  category: Exclude<AmenityCategory, "Tất cả">;
  name: string;
  address: string;
  distanceKm: number;
  rating: number; // 0-5
};

export const AMENITIES: Amenity[] = [
  {
    id: "am_001",
    stationId: 1,
    category: "Ăn uống",
    name: "Phố ẩm thực Đồng Khởi (mock)",
    address: "Q.1, TP.HCM",
    distanceKm: 0.6,
    rating: 4.6
  },
  {
    id: "am_002",
    stationId: 1,
    category: "Ngân hàng",
    name: "ATM Metro Central",
    address: "Bến Thành, Q.1, TP.HCM",
    distanceKm: 0.2,
    rating: 4.2
  },
  {
    id: "am_003",
    stationId: 6,
    category: "Mua sắm",
    name: "Trung tâm mua sắm Thảo Điền (mock)",
    address: "TP. Thủ Đức, TP.HCM",
    distanceKm: 0.9,
    rating: 4.4
  },
  {
    id: "am_004",
    stationId: 10,
    category: "Y tế",
    name: "Phòng khám Bình Thái (mock)",
    address: "TP. Thủ Đức, TP.HCM",
    distanceKm: 1.1,
    rating: 4.1
  },
  {
    id: "am_005",
    stationId: 11,
    category: "Giáo dục",
    name: "Trung tâm học tập Thủ Đức (mock)",
    address: "TP. Thủ Đức, TP.HCM",
    distanceKm: 0.8,
    rating: 4.0
  },
  {
    id: "am_006",
    stationId: 14,
    category: "Bãi xe",
    name: "Bãi gửi xe Suối Tiên (mock)",
    address: "Suối Tiên, TP. Thủ Đức, TP.HCM",
    distanceKm: 0.3,
    rating: 4.3
  },
  {
    id: "am_007",
    stationId: 3,
    category: "Ăn uống",
    name: "Cà phê Ba Son (mock)",
    address: "Q.1, TP.HCM",
    distanceKm: 0.4,
    rating: 4.5
  },
  {
    id: "am_008",
    stationId: 2,
    category: "Mua sắm",
    name: "Nhà hát TP Souvenir (mock)",
    address: "Q.1, TP.HCM",
    distanceKm: 0.5,
    rating: 4.1
  }
];

export type NewsItem = {
  id: string;
  date: string; // dd/mm/yyyy
  title: string;
  excerpt: string;
  imageAlt: string;
};

export const NEWS: NewsItem[] = [
  {
    id: "n_001",
    date: "12/01/2026",
    title: "Metro Line 1: Cập nhật lịch vận hành thử nghiệm",
    excerpt:
      "Hệ thống metro tăng tần suất giờ cao điểm, tối ưu luồng khách và nâng cao trải nghiệm.",
    imageAlt: "Tin tức Metro"
  },
  {
    id: "n_002",
    date: "28/02/2026",
    title: "Mở rộng tiện ích quanh ga: bãi xe, ATM và điểm hỗ trợ hành khách",
    excerpt:
      "Thêm nhiều tiện ích thiết yếu quanh các ga trọng điểm nhằm phục vụ người dân tốt hơn.",
    imageAlt: "Tiện ích quanh ga"
  },
  {
    id: "n_003",
    date: "05/03/2026",
    title: "Ưu đãi vé tháng cho sinh viên và người lao động",
    excerpt:
      "Chương trình ưu đãi vé tháng giúp tối ưu chi phí di chuyển hằng ngày, đăng ký nhanh chóng.",
    imageAlt: "Ưu đãi vé tháng"
  }
];

export type TicketHistoryItem = {
  id: string;
  route: string;
  date: string;
  type: TicketType;
  priceVnd: number;
  status: "Thành công" | "Đang xử lý" | "Đã hủy";
};

export const MOCK_TICKET_HISTORY: TicketHistoryItem[] = [
  {
    id: "T20260112001",
    route: "Bến Thành → Ba Son",
    date: "12/01/2026",
    type: "Một chiều",
    priceVnd: 8000,
    status: "Thành công"
  },
  {
    id: "T20260203012",
    route: "Thảo Điền → Bến Thành",
    date: "03/02/2026",
    type: "Một chiều",
    priceVnd: 14000,
    status: "Thành công"
  },
  {
    id: "T20260218005",
    route: "Bến Thành → Suối Tiên",
    date: "18/02/2026",
    type: "Khứ hồi",
    priceVnd: 36000,
    status: "Đang xử lý"
  }
];

