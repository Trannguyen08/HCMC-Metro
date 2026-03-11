"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "vi" | "en";

interface TranslationDict {
  [key: string]: {
    vi: string;
    en: string;
  };
}

const translations: TranslationDict = {
  // Navbar
  "nav.promo": { vi: "Ưu đãi", en: "Promotions" },
  "nav.route": { vi: "Tra cứu Lộ trình", en: "Search Route" },
  "nav.amenities": { vi: "Tiện ích quanh Ga", en: "Station Amenities" },
  "nav.map": { vi: "Bản đồ số", en: "Digital Map" },
  "nav.login": { vi: "Đăng nhập", en: "Login" },
  "nav.register": { vi: "Đăng ký", en: "Register" },
  "nav.profile": { vi: "Hồ sơ", en: "Profile" },
  "nav.book": { vi: "Đặt vé", en: "Booking" },
  "nav.logout": { vi: "Đăng xuất", en: "Logout" },
  "nav.account": { vi: "Tài khoản", en: "Account" },

  // Profile Page
  "profile.title": { vi: "Hồ sơ", en: "Profile" },
  "profile.desc": { vi: "Quản lý thông tin cá nhân và vé của bạn (mock).", en: "Manage your personal information and tickets (mock)." },
  "profile.personal_info": { vi: "Thông tin cá nhân", en: "Personal Information" },
  "profile.ticket_history": { vi: "Lịch sử vé", en: "Ticket History" },
  "profile.active_tickets": { vi: "Vé đang dùng", en: "Active Tickets" },
  "profile.full_name": { vi: "Họ tên", en: "Full Name" },
  "profile.email": { vi: "Email", en: "Email" },
  "profile.phone": { vi: "Số điện thoại", en: "Phone Number" },
  "profile.save": { vi: "Lưu thay đổi", en: "Save Changes" },
  "profile.saved": { vi: "Đã lưu", en: "Saved" },
  "profile.upload_avatar": { vi: "Tải ảnh", en: "Upload Avatar" },
  "profile.not_logged_in": { vi: "Bạn chưa đăng nhập", en: "Not logged in" },
  "profile.not_logged_in_desc": { vi: "Vui lòng đăng nhập để xem hồ sơ, lịch sử vé và cài đặt.", en: "Please login to view your profile, ticket history, and settings." },

  // Table Headers
  "table.id": { vi: "Mã vé", en: "Ticket ID" },
  "table.route": { vi: "Lộ trình", en: "Route" },
  "table.date": { vi: "Ngày", en: "Date" },
  "table.type": { vi: "Loại vé", en: "Type" },
  "table.price": { vi: "Giá", en: "Price" },
  "table.status": { vi: "Trạng thái", en: "Status" },

  // Active Tickets
  "ticket.type": { vi: "Loại vé", en: "Ticket Type" },
  "ticket.one_way": { vi: "Một chiều", en: "One Way" },
  "ticket.validity": { vi: "Hiệu lực", en: "Validity" },
  "ticket.today": { vi: "Trong ngày", en: "Today" },
  "ticket.qr_placeholder": { vi: "QR Code (placeholder)", en: "QR Code (placeholder)" },
  "ticket.qr_desc": { vi: "Xuất trình tại cổng soát vé", en: "Present at the gate" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("vi");

  useEffect(() => {
    const saved = localStorage.getItem("app-lang") as Language;
    if (saved && (saved === "vi" || saved === "en")) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("app-lang", lang);
  };

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
