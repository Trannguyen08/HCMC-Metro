import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

@shared_task(name="apps.users.tasks.send_otp_email_task")
def send_otp_email_task(full_name, email, otp, email_type="registration"):
    """
    Background task to send OTP emails for registration or forgot password.
    """
    if email_type == "forgot_password":
        subject = "Đổi mật khẩu HCMC Metro"
        body = (
            f"Xin chào {full_name},\n\n"
            f"Mã OTP để khôi phục mật khẩu của bạn là: {otp}\n"
            f"Mã có hiệu lực trong 3 phút.\n\n"
            "Nếu bạn không yêu cầu chức năng này, vui lòng bỏ qua email."
        )
    else:
        subject = "Mã OTP xác thực đăng ký HCMC Metro"
        body = (
            f"Xin chào {full_name},\n\n"
            f"Mã OTP xác thực email của bạn là: {otp}\n"
            f"Mã có hiệu lực trong 10 phút.\n\n"
            "Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này."
        )

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[email],
            fail_silently=False,
        )
        logger.info(f"OTP email ({email_type}) sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email ({email_type}) to {email}: {str(e)}")
        # Optionally retry here if needed
        # self.retry(exc=e, countdown=60)
        return False
