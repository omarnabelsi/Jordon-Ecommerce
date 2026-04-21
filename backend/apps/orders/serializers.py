from rest_framework import serializers

from apps.orders.models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_variant",
            "product_name",
            "quantity",
            "unit_price",
            "total_price",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "total_amount",
            "shipping_amount",
            "tax_amount",
            "grand_total",
            "shipping_address",
            "billing_address",
            "payment_method",
            "payment_status",
            "tracking_number",
            "notes",
            "created_at",
            "updated_at",
            "items",
        ]


class OrderCreateSerializer(serializers.Serializer):
    shipping_address = serializers.DictField()
    billing_address = serializers.DictField(required=False)
    payment_method = serializers.CharField(default="mock")
    notes = serializers.CharField(required=False, allow_blank=True)
    guest_email = serializers.EmailField(required=False)
