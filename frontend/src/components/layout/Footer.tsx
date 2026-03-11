import Link from "next/link";

const COLS = [
  {
    title: "Metro",
    links: [
      { label: "Tin tức", href: "/#tin-tuc" },
      { label: "FAQ", href: "/#faq" },
      { label: "Bãi gửi xe", href: "/tien-ich" }
    ]
  },
  {
    title: "Tra cứu",
    links: [
      { label: "Tiện ích quanh Ga", href: "/tien-ich" },
      { label: "Bản đồ tra cứu", href: "/ban-do-so" }
    ]
  },
  {
    title: "Bản đồ số",
    links: [
      { label: "Tạo địa điểm mới", href: "/ban-do-so" },
      { label: "Tra cứu lộ trình", href: "/lo-trinh" }
    ]
  },
  {
    title: "Quy định chung",
    links: [
      { label: "Điều khoản sử dụng", href: "/#dieu-khoan" },
      { label: "Chính sách bảo mật", href: "/#bao-mat" },
      { label: "Liên hệ", href: "/#lien-he" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-10 md:grid-cols-4">
        {COLS.map((c) => (
          <div key={c.title} className="space-y-3">
            <div className="font-heading text-sm font-semibold">{c.title}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {c.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link
                    href={l.href}
                    className="transition-colors duration-300 ease-smooth hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>Bản quyền © 2025 hcmc-metro.com</div>
          <div className="flex gap-4">
            <Link href="/#gop-y" className="hover:text-foreground">
              Đóng góp ý kiến
            </Link>
            <span>Việt Nam</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

