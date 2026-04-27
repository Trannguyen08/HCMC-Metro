"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Làm thế nào để mua vé tháng?",
    a: "Bạn có thể đăng ký vé tháng trực tiếp trên ứng dụng hoặc tại quầy dịch vụ ở các ga chính như Bến Thành, Suối Tiên. Sau khi đăng ký và thanh toán, vé sẽ được tích hợp vào mã QR trong tài khoản của bạn."
  },
  {
    q: "Trẻ em và người cao tuổi có được giảm giá không?",
    a: "Có, Metro HCM có chính sách miễn phí vé cho trẻ em dưới 6 tuổi và giảm 50% giá vé cho người cao tuổi (trên 60 tuổi) khi xuất trình giấy tờ tùy thân phù hợp."
  },
  {
    q: "Thời gian hoạt động của tàu là khi nào?",
    a: "Tuyến số 1 hoạt động từ 6:00 sáng đến 22:00 đêm hàng ngày. Tần suất chuyến từ 5-10 phút/chuyến vào giờ cao điểm và 15 phút/chuyến vào giờ thấp điểm."
  },
  {
    q: "Tôi có thể mang xe đạp lên tàu không?",
    a: "Hiện tại, Metro HCM cho phép mang xe đạp gấp gọn lên tàu. Đối với xe đạp thông thường, vui lòng sử dụng khu vực gửi xe tại nhà ga."
  }
];

export function FAQSection() {
  return (
    <section className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 md:p-10">
      <div className="text-center space-y-2">
        <h2 className="font-heading text-2xl font-bold tracking-tight">Câu hỏi thường gặp</h2>
        <p className="text-sm text-muted-foreground mx-auto max-w-xl">
          Giải đáp các thắc mắc phổ biến của hành khách về dịch vụ và vận hành của Metro HCM.
        </p>
      </div>

      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b-slate-300">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-metro-blue transition-colors">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-slate-600">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
