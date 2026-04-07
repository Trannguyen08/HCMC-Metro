import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
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
        
        qr_data = json.dumps({
            "ticket_id": str(ticket.id),
            "user_id": str(ticket.user_id),
            "type": ticket.ticket_type.name,
            "valid_until": str(ticket.valid_until)
        })
        
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
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
