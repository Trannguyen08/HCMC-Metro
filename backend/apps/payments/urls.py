from django.urls import path

from apps.payments.views import (
    PayOSCancelRedirectAPIView,
    PayOSContinuePaymentAPIView,
    PayOSCreatePaymentAPIView,
    PayOSReturnRedirectAPIView,
    PayOSVerifyReturnAPIView,
)

urlpatterns = [
    path("payos/create/", PayOSCreatePaymentAPIView.as_view(), name="payos-create-payment"),
    path("payos/continue/", PayOSContinuePaymentAPIView.as_view(), name="payos-continue-payment"),
    path("payos/return/", PayOSReturnRedirectAPIView.as_view(), name="payos-return-redirect"),
    path("payos/cancel/", PayOSCancelRedirectAPIView.as_view(), name="payos-cancel-redirect"),
    path("payos/verify-return/", PayOSVerifyReturnAPIView.as_view(), name="payos-verify-return"),
]
