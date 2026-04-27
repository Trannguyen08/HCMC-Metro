import io
import logging
from email.mime.image import MIMEImage

import qrcode
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def _format_vnd(amount) -> str:
    try:
        return f"{int(amount):,}".replace(",", ".") + " VNĐ"
    except Exception:
        return "0 VNĐ"


def _station_name(station, fallback: str = "-") -> str:
    return station.name if station else fallback


def _build_message(subject: str, html_content: str, recipient: str) -> EmailMultiAlternatives:
    text_content = strip_tags(html_content)
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient],
    )
    msg.encoding = "utf-8"
    msg.attach_alternative(html_content, "text/html; charset=utf-8")
    return msg


class TicketEmailService:
    @staticmethod
    def send_ticket_email(ticket):
        user = ticket.user
        subject = f"Vé Metro của bạn - {ticket.ticket_type.name}"

        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(str(ticket.id))
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format="PNG")
        img_bytes = img_byte_arr.getvalue()

        context = {
            "user_name": user.full_name,
            "ticket_id": str(ticket.id),
            "ticket_type": ticket.ticket_type.name,
            "valid_from": ticket.valid_from,
            "valid_until": ticket.valid_until,
            "from_station": _station_name(ticket.from_station),
            "to_station": _station_name(ticket.to_station),
            "price_paid": _format_vnd(ticket.price_paid),
            "qr_code": ticket.qr_code or "N/A",
        }

        html_content = f"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body style="margin:0;padding:0;background:#f4f7fb;">
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:20px auto;border:1px solid #dbe3ee;border-radius:12px;padding:24px;background:#ffffff;">
                <h2 style="color:#0055A5;text-align:center;margin-top:0;">HCMC Metro - Vé điện tử</h2>
                <p>Xin chào <strong>{context['user_name']}</strong>,</p>
                <p>Cảm ơn bạn đã đặt vé trên hệ thống HCMC Metro. Dưới đây là thông tin vé của bạn:</p>

                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <tr>
                        <td style="padding:10px;border-bottom:1px solid #eef2f7;"><strong>Mã vé:</strong></td>
                        <td style="padding:10px;border-bottom:1px solid #eef2f7;">{context['ticket_id']}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px;border-bottom:1px solid #eef2f7;"><strong>Loại vé:</strong></td>
                        <td style="padding:10px;border-bottom:1px solid #eef2f7;">{context['ticket_type']}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px;border-bottom:1px solid #eef2f7;"><strong>Lộ trình:</strong></td>
                        <td style="padding:10px;border-bottom:1px solid #eef2f7;">{context['from_station']} &rarr; {context['to_station']}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px;border-bottom:1px solid #eef2f7;"><strong>Giá vé:</strong></td>
                        <td style="padding:10px;border-bottom:1px solid #eef2f7;color:#DC2626;"><strong>{context['price_paid']}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding:10px;border-bottom:1px solid #eef2f7;"><strong>Hạn dùng:</strong></td>
                        <td style="padding:10px;border-bottom:1px solid #eef2f7;">{context['valid_from']} đến {context['valid_until']}</td>
                    </tr>
                </table>

                <div style="text-align:center;margin-top:30px;padding:20px;background-color:#f8fafc;border-radius:10px;">
                    <p style="margin-bottom:15px;">Vui lòng quét mã QR này tại cổng kiểm soát:</p>
                    <img src="cid:ticket_qr" alt="Mã QR vé" style="width:200px;height:200px;">
                    <p style="font-size:12px;color:#64748b;margin-top:10px;">Mã QR: {context['qr_code']}</p>
                </div>

                <p style="margin-top:30px;font-size:14px;text-align:center;color:#475569;">
                    Chúc bạn có một chuyến đi an toàn và thoải mái cùng HCMC Metro!
                </p>
            </div>
        </body>
        </html>
        """

        msg = _build_message(subject, html_content, user.email)

        mime_img = MIMEImage(img_bytes)
        mime_img.add_header("Content-ID", "<ticket_qr>")
        mime_img.add_header("Content-Disposition", "inline", filename="ticket_qr.png")
        msg.attach(mime_img)

        try:
            msg.send()
            logger.info("Ticket email sent to %s for ticket %s", user.email, ticket.id)
        except Exception as exc:
            logger.error("Failed to send ticket email to %s: %s", user.email, str(exc))
            raise

    @staticmethod
    def send_scan_success_email(ticket):
        user = ticket.user
        subject = "Thông báo: Vé Metro của bạn vừa được quét thành công"

        from_st = _station_name(getattr(ticket, "from_station", None), "Không chỉ định")
        to_st = _station_name(getattr(ticket, "to_station", None), "Không chỉ định")
        scan_time_str = timezone.localtime(timezone.now()).strftime("%H:%M:%S ngày %d/%m/%Y")

        html_content = f"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body style="margin:0;padding:0;background:#f4f7fb;">
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:20px auto;border:1px solid #dbe3ee;border-radius:12px;padding:24px;background:#ffffff;">
                <h2 style="color:#0055A5;text-align:center;margin-top:0;">HCMC Metro - Thông báo quét vé</h2>
                <p>Xin chào <strong>{user.full_name}</strong>,</p>
                <p>Tuyệt vời! Vé của bạn vừa được quét thành công qua hệ thống cổng kiểm soát vào lúc <strong>{scan_time_str}</strong>.</p>
                <div style="background-color:#f8fafc;padding:15px;border-radius:10px;margin:20px 0;">
                    <p style="margin:5px 0;"><strong>Loại vé:</strong> {ticket.ticket_type.name}</p>
                    <p style="margin:5px 0;"><strong>Hành trình:</strong> {from_st} &rarr; {to_st}</p>
                    <p style="margin:5px 0;"><strong>Thời gian quét:</strong> {scan_time_str}</p>
                    <p style="margin:5px 0;font-size:12px;color:#64748b;"><strong>Mã vé:</strong> {str(ticket.id)}</p>
                </div>
                <p>Chúc bạn có một chuyến đi thuận lợi và an toàn cùng HCMC Metro!</p>
            </div>
        </body>
        </html>
        """

        msg = _build_message(subject, html_content, user.email)

        try:
            msg.send()
            logger.info("Scan success email sent to %s for ticket %s", user.email, ticket.id)
        except Exception as exc:
            logger.error("Failed to send scan success email to %s: %s", user.email, str(exc))
            raise

    @staticmethod
    def send_ticket_exhausted_email(ticket):
        user = ticket.user
        subject = "Thông báo: Vé Metro của bạn đã hết lượt sử dụng"

        from_st = _station_name(getattr(ticket, "from_station", None), "Không chỉ định")
        to_st = _station_name(getattr(ticket, "to_station", None), "Không chỉ định")
        scan_time_str = timezone.localtime(timezone.now()).strftime("%H:%M:%S ngày %d/%m/%Y")

        html_content = f"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body style="margin:0;padding:0;background:#f4f7fb;">
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:20px auto;border:1px solid #dbe3ee;border-radius:12px;padding:24px;background:#ffffff;">
                <h2 style="color:#DC2626;text-align:center;margin-top:0;">HCMC Metro - Vé hết lượt sử dụng</h2>
                <p>Xin chào <strong>{user.full_name}</strong>,</p>
                <p>Vé của bạn đã được sử dụng hết số lượt quy định tại thời điểm <strong>{scan_time_str}</strong> và hiện không còn giá trị để qua cổng kiểm soát nữa.</p>
                <div style="background-color:#fff1f2;padding:15px;border-radius:10px;margin:20px 0;">
                    <p style="margin:5px 0;"><strong>Loại vé:</strong> {ticket.ticket_type.name}</p>
                    <p style="margin:5px 0;"><strong>Hành trình:</strong> {from_st} &rarr; {to_st}</p>
                    <p style="margin:5px 0;"><strong>Lần quét cuối:</strong> {scan_time_str}</p>
                    <p style="margin:5px 0;font-size:12px;color:#64748b;"><strong>Mã vé:</strong> {str(ticket.id)}</p>
                </div>
                <p>Cảm ơn bạn đã đồng hành cùng HCMC Metro. Vui lòng mua vé mới cho những chuyến đi tiếp theo của bạn.</p>
                <div style="text-align:center;margin-top:20px;">
                    <a href="https://hcmc-metro.com/" style="display:inline-block;padding:10px 20px;background-color:#0055A5;color:white;text-decoration:none;border-radius:6px;">Mua vé mới ngay</a>
                </div>
            </div>
        </body>
        </html>
        """

        msg = _build_message(subject, html_content, user.email)

        try:
            msg.send()
            logger.info("Ticket exhausted email sent to %s for ticket %s", user.email, ticket.id)
        except Exception as exc:
            logger.error("Failed to send ticket exhausted email to %s: %s", user.email, str(exc))
            raise
