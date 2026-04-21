import time
import hmac
import hashlib
from decimal import Decimal

import requests
from payos import PayOS
from django.conf import settings


class PayOSService:
    SUCCESS_STATUSES = {"PAID", "SUCCESSFUL", "COMPLETED"}

    _instance = None

    @classmethod
    def get_sdk_instance(cls) -> PayOS:
        if cls._instance is None:
            cls._instance = PayOS(
                client_id=settings.PAYOS_CLIENT_ID,
                api_key=settings.PAYOS_API_KEY,
                checksum_key=settings.PAYOS_CHECKSUM_KEY,
            )
        return cls._instance

    @staticmethod
    def generate_order_code() -> int:
        # PayOS orderCode should be numeric and fit common integer ranges.
        return int(time.time() * 1000)

    @staticmethod
    def _headers() -> dict:
        return {
            "x-client-id": settings.PAYOS_CLIENT_ID,
            "x-api-key": settings.PAYOS_API_KEY,
            "Content-Type": "application/json",
        }

    @staticmethod
    def _create_payment_request_signature(*, amount: int, cancel_url: str, description: str, order_code: int, return_url: str) -> str:
        # PayOS requires this exact alphabetically-sorted format.
        raw = (
            f"amount={amount}"
            f"&cancelUrl={cancel_url}"
            f"&description={description}"
            f"&orderCode={order_code}"
            f"&returnUrl={return_url}"
        )
        return hmac.new(
            settings.PAYOS_CHECKSUM_KEY.encode("utf-8"),
            raw.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    @classmethod
    def create_payment_link(
        cls,
        *,
        order_code: int,
        amount: Decimal,
        description: str,
        return_url: str,
        cancel_url: str,
    ) -> str:
        amount_int = int(Decimal(amount))
        payload = {
            "orderCode": int(order_code),
            "amount": amount_int,
            "description": description[:25],
            "returnUrl": return_url,
            "cancelUrl": cancel_url,
            "items": [
                {
                    "name": "Ve Metro",
                    "quantity": 1,
                    "price": amount_int,
                }
            ],
        }
        payload["signature"] = cls._create_payment_request_signature(
            amount=amount_int,
            cancel_url=cancel_url,
            description=payload["description"],
            order_code=int(order_code),
            return_url=return_url,
        )
        resp = requests.post(
            f"{settings.PAYOS_API_BASE.rstrip('/')}/v2/payment-requests",
            json=payload,
            headers=cls._headers(),
            timeout=20,
        )
        if resp.status_code >= 400:
            try:
                detail = resp.json()
            except Exception:
                detail = resp.text
            raise ValueError(f"PayOS create link failed: {detail}")
        data = resp.json() or {}
        checkout_url = (data.get("data") or {}).get("checkoutUrl")
        if not checkout_url:
            raise ValueError("Khong lay duoc checkoutUrl tu PayOS.")
        return checkout_url

    @classmethod
    def get_payment_status(cls, *, order_code: int | str) -> str | None:
        resp = requests.get(
            f"{settings.PAYOS_API_BASE.rstrip('/')}/v2/payment-requests/{int(order_code)}",
            headers=cls._headers(),
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json() or {}
        status = (data.get("data") or {}).get("status")
        if status is None:
            return None
        return str(status).upper()

    @classmethod
    def is_success_status(cls, status_value: str | None) -> bool:
        if not status_value:
            return False
        return str(status_value).upper() in cls.SUCCESS_STATUSES
