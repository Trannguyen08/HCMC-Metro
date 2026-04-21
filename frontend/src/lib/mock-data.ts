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
  | "Cà phê"
  | "Nhà hàng"
  | "Mua sắm"
  | "Khách sạn"
  | "Dịch vụ";

export type Amenity = {
  id: string;
  stationId: number;
  nearestStation: string;
  category: Exclude<AmenityCategory, "Tất cả">;
  name: string;
  address: string;
  distanceM: number; // metres
  rating: number; // 0-5
  imageUrl: string;
};

export const AMENITIES: Amenity[] = [
  {
    id: "am_001",
    stationId: 1,
    nearestStation: "Ga Bến Thành",
    category: "Dịch vụ",
    name: "Chợ Bến Thành",
    address: "Lê Lợi, P. Bến Thành, Q.1, TP.HCM",
    distanceM: 80,
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_002",
    stationId: 1,
    nearestStation: "Ga Bến Thành",
    category: "Khách sạn",
    name: "New World Saigon Hotel",
    address: "76 Lê Lai, P. Bến Thành, Q.1, TP.HCM",
    distanceM: 250,
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_003",
    stationId: 2,
    nearestStation: "Ga Nhà hát Thành phố",
    category: "Dịch vụ",
    name: "Nhà hát Thành phố",
    address: "7 Công Trường Lam Sơn, Q.1, TP.HCM",
    distanceM: 50,
    rating: 4.9,
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_004",
    stationId: 1,
    nearestStation: "Ga Bến Thành",
    category: "Cà phê",
    name: "The Coffee House – Bến Thành",
    address: "86 Nam Kỳ Khởi Nghĩa, Q.1, TP.HCM",
    distanceM: 180,
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_005",
    stationId: 1,
    nearestStation: "Ga Bến Thành",
    category: "Nhà hàng",
    name: "Nhà hàng Ngon",
    address: "160 Pasteur, P. Bến Nghé, Q.1, TP.HCM",
    distanceM: 350,
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_006",
    stationId: 1,
    nearestStation: "Ga Bến Thành",
    category: "Mua sắm",
    name: "Vincom Center Bến Thành",
    address: "72 Lê Thánh Tôn, P. Bến Nghé, Q.1, TP.HCM",
    distanceM: 400,
    rating: 4.4,
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_007",
    stationId: 3,
    nearestStation: "Ga Ba Son",
    category: "Cà phê",
    name: "Starbucks Ba Son",
    address: "2 Đường Tôn Đức Thắng, Q.1, TP.HCM",
    distanceM: 120,
    rating: 4.3,
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_008",
    stationId: 3,
    nearestStation: "Ga Ba Son",
    category: "Khách sạn",
    name: "Park Hyatt Saigon",
    address: "2 Công Trường Lam Sơn, Q.1, TP.HCM",
    distanceM: 200,
    rating: 4.9,
    imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe2e4?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_009",
    stationId: 6,
    nearestStation: "Ga Thảo Điền",
    category: "Nhà hàng",
    name: "Hoàng Yến Restaurant",
    address: "7 Nguyễn Thị Minh Khai, TP. Thủ Đức, TP.HCM",
    distanceM: 300,
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_010",
    stationId: 6,
    nearestStation: "Ga Thảo Điền",
    category: "Mua sắm",
    name: "Thảo Điền Pearl Mall",
    address: "12 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM",
    distanceM: 450,
    rating: 4.2,
    imageUrl: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_011",
    stationId: 7,
    nearestStation: "Ga An Phú",
    category: "Cà phê",
    name: "Highlands Coffee An Phú",
    address: "101 An Phú, TP. Thủ Đức, TP.HCM",
    distanceM: 160,
    rating: 4.4,
    imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_012",
    stationId: 11,
    nearestStation: "Ga Thủ Đức",
    category: "Dịch vụ",
    name: "Trung tâm hành chính Thủ Đức",
    address: "1 Võ Văn Ngân, TP. Thủ Đức, TP.HCM",
    distanceM: 500,
    rating: 3.9,
    imageUrl: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_013",
    stationId: 11,
    nearestStation: "Ga Thủ Đức",
    category: "Nhà hàng",
    name: "Quán Bình Dân Thủ Đức",
    address: "25 Kha Vạn Cân, TP. Thủ Đức, TP.HCM",
    distanceM: 200,
    rating: 4.3,
    imageUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_014",
    stationId: 13,
    nearestStation: "Ga Đại học QG",
    category: "Cà phê",
    name: "Cafe Sân Vườn ĐHQG",
    address: "Khu phố 6, P. Linh Trung, TP. Thủ Đức, TP.HCM",
    distanceM: 90,
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_015",
    stationId: 14,
    nearestStation: "Ga Suối Tiên",
    category: "Mua sắm",
    name: "Gigamall Thủ Đức",
    address: "240 Phạm Văn Đồng, TP. Thủ Đức, TP.HCM",
    distanceM: 600,
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "am_016",
    stationId: 14,
    nearestStation: "Ga Suối Tiên",
    category: "Khách sạn",
    name: "Mường Thanh Luxury Sài Gòn",
    address: "Xa lộ Hà Nội, TP. Thủ Đức, TP.HCM",
    distanceM: 800,
    rating: 4.3,
    imageUrl: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80"
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

