from rest_framework import serializers


class PayOSCreatePaymentSerializer(serializers.Serializer):
    ticket_type_id = serializers.IntegerField()
    from_station_id = serializers.IntegerField(required=False, allow_null=True)
    to_station_id = serializers.IntegerField(required=False, allow_null=True)
    valid_from = serializers.DateField(required=False)
    is_round_trip = serializers.BooleanField(required=False, default=False)


class PayOSContinuePaymentSerializer(serializers.Serializer):
    ticket_id = serializers.UUIDField()


class PayOSVerifySerializer(serializers.Serializer):
    orderCode = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False, allow_blank=True)
    code = serializers.CharField(required=False, allow_blank=True)
    id = serializers.CharField(required=False, allow_blank=True)
    cancel = serializers.CharField(required=False, allow_blank=True)

    def to_internal_value(self, data):
        if hasattr(data, "dict"):
            data = data.dict()
        return super().to_internal_value(data)
