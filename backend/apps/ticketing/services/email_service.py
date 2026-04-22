import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.conf import settings
from email.mime.image import MIMEImage

from apps.ticketing.services.booking_service import BookingService

logger = logging.getLogger(__name__)

class TicketEmailService:
    @staticmethod
    def send_ticket_email(ticket):
        """
        Send a ticket confirmation email with an embedded QR code image.
        """
        user = ticket.user
        subject = f"Vé Metro của bạn - {ticket.ticket_type.name}"
        
        # Generate QR code as bytes
        import qrcode
        import io
        import json
        
        qr_data = str(ticket.id)
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()

        # Context for template
        context = {
            'user_name': user.full_name,
            'ticket_id': str(ticket.id),
            'ticket_type': ticket.ticket_type.name,
            'valid_from': ticket.valid_from,
            'valid_until': ticket.valid_until,
            'from_station': ticket.from_station.name if ticket.from_station else "-",
            'to_station': ticket.to_station.name if ticket.to_station else "-",
            'price_paid': f"{int(ticket.price_paid):,}".replace(",", ".") + " VNĐ"
        }
        
        # Generate HTML content
        # For simplicity in this demo, we'll use a direct HTML string. 
        # In a real app, use render_to_string('emails/ticket.html', context)
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="margin: 0; padding: 0;">
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                <h2 style="color: #0055A5; text-align: center;">HCMC Metro - Vé Điện Tử</h2>
                <p>Xin chào <strong>{context['user_name']}</strong>,</p>
                <p>Cảm ơn bạn đã đặt vé trên hệ thống HCMC Metro. Dưới đây là thông tin vé của bạn:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Mã vé:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">{context['ticket_id']}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Loại vé:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">{context['ticket_type']}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Lộ trình:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">{context['from_station']} &rarr; {context['to_station']}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Giá vé:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: #DC2626;"><strong>{context['price_paid']}</strong></td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Hạn dùng:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">{context['valid_from']} đến {context['valid_until']}</td>
                </tr>
            </table>

            <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                <p style="margin-bottom: 15px;">Vui lòng quét mã QR này tại cổng kiểm soát:</p>
                <img src="cid:ticket_qr" alt="Mã QR Vé" style="width: 200px; height: 200px;">
                <p style="font-size: 12px; color: #666; margin-top: 10px;">Mã QR: {ticket.qr_code or 'N/A'}</p>
            </div>
            
                <p style="margin-top: 30px; font-size: 14px; text-align: center; color: #666;">
                    Chúc bạn có một chuyến đi an toàn và thoải mái cùng HCMC Metro!
                </p>
            </div>
        </body>
        </html>
        """
        
        text_content = strip_tags(html_content)
        
        msg = EmailMultiAlternatives(
            subject, 
            text_content, 
            settings.DEFAULT_FROM_EMAIL, 
            [user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        
        # Attach QR image as inline
        mime_img = MIMEImage(img_byte_arr)
        mime_img.add_header('Content-ID', '<ticket_qr>')
        mime_img.add_header('Content-Disposition', 'inline', filename="ticket_qr.png")
        msg.attach(mime_img)
        
        try:
            msg.send()
            logger.info(f"Ticket email sent to {user.email} for ticket {ticket.id}")
        except Exception as e:
            logger.error(f"Failed to send ticket email to {user.email}: {str(e)}")
            raise e

    @staticmethod
    def send_scan_success_email(ticket):
        """
        Send an email when a ticket QR code is successfully scanned.
        """
        user = ticket.user
        subject = f"Thông báo: Vé Metro của bạn vừa được quét thành công"
        
        from_st = ticket.from_station.name if getattr(ticket, 'from_station', None) else "Không chỉ định"
        to_st = ticket.to_station.name if getattr(ticket, 'to_station', None) else "Không chỉ định"
        scan_time_str = timezone.localtime(timezone.now()).strftime('%H:%M:%S ngày %d/%m/%Y')
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="margin: 0; padding: 0;">
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                <h2 style="color: #0055A5; text-align: center;">HCMC Metro - Thông báo quét vé</h2>
                <p>Xin chào <strong>{user.full_name}</strong>,</p>
                <p>Tuyệt vời! Vé của bạn vừa được quét thành công qua hệ thống cổng kiểm soát vào lúc <strong>{scan_time_str}</strong>.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Loại vé:</strong> {ticket.ticket_type.name}</p>
                <p style="margin: 5px 0;"><strong>Hành trình:</strong> {from_st} &rarr; {to_st}</p>
                <p style="margin: 5px 0;"><strong>Thời gian quét:</strong> {scan_time_str}</p>
                <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>Mã vé:</strong> {str(ticket.id)}</p>
            </div>
                <p>Chúc bạn có một chuyến đi thuận lợi và an toàn cùng HCMC Metro!</p>
            </div>
        </body>
        </html>
        """
        text_content = strip_tags(html_content)
        
        msg = EmailMultiAlternatives(
            subject, 
            text_content, 
            settings.DEFAULT_FROM_EMAIL, 
            [user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        
        try:
            msg.send()
            logger.info(f"Scan success email sent to {user.email} for ticket {ticket.id}")
        except Exception as e:
            logger.error(f"Failed to send scan success email to {user.email}: {str(e)}")
            raise e

    @staticmethod
    def send_ticket_exhausted_email(ticket):
        """
        Send an email when a ticket QR code has run out of uses.
        """
        user = ticket.user
        subject = f"Thông báo: Vé Metro của bạn đã hết lượt sử dụng"
        
        from_st = ticket.from_station.name if getattr(ticket, 'from_station', None) else "Không chỉ định"
        to_st = ticket.to_station.name if getattr(ticket, 'to_station', None) else "Không chỉ định"
        scan_time_str = timezone.localtime(timezone.now()).strftime('%H:%M:%S ngày %d/%m/%Y')
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="margin: 0; padding: 0;">
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                <h2 style="color: #DC2626; text-align: center;">HCMC Metro - Vé hết lượt sử dụng</h2>
                <p>Xin chào <strong>{user.full_name}</strong>,</p>
                <p>Vé của bạn đã được sử dụng hết số lượt quy định tại thời điểm <strong>{scan_time_str}</strong> và hiện không còn giá trị để qua cổng kiểm soát nữa.</p>
            <div style="background-color: #ffeaea; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Loại vé:</strong> {ticket.ticket_type.name}</p>
                <p style="margin: 5px 0;"><strong>Hành trình:</strong> {from_st} &rarr; {to_st}</p>
                <p style="margin: 5px 0;"><strong>Lần quét cuối:</strong> {scan_time_str}</p>
                <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>Mã vé:</strong> {str(ticket.id)}</p>
            </div>
            <p>Cảm ơn bạn đã đồng hành cùng HCMC Metro. Vui lòng mua vé mới cho những chuyến đi tiếp theo của bạn.</p>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="https://hcmc-metro.com/" style="display: inline-block; padding: 10px 20px; background-color: #0055A5; color: white; text-decoration: none; border-radius: 5px;">Mua vé mới ngay</a>
                </div>
            </div>
        </body>
        </html>
        """
        text_content = strip_tags(html_content)
        
        msg = EmailMultiAlternatives(
            subject, 
            text_content, 
            settings.DEFAULT_FROM_EMAIL, 
            [user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        
        try:
            msg.send()
            logger.info(f"Ticket exhausted email sent to {user.email} for ticket {ticket.id}")
        except Exception as e:
            logger.error(f"Failed to send ticket exhausted email to {user.email}: {str(e)}")
            raise e
