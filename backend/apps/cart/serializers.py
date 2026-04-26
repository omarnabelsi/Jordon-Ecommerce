from rest_framework import serializers

from apps.cart.models import Cart, CartItem
from apps.products.serializers import _normalize_image_url


class CartItemSerializer(serializers.ModelSerializer):
    variant_id = serializers.IntegerField(source="product_variant.id", read_only=True)
    product_name = serializers.CharField(source="product_variant.product.name", read_only=True)
    product_slug = serializers.CharField(source="product_variant.product.slug", read_only=True)
    product_image = serializers.SerializerMethodField()
    size = serializers.CharField(source="product_variant.size", read_only=True)
    color_name = serializers.CharField(source="product_variant.color_name", read_only=True)
    color_hex = serializers.CharField(source="product_variant.color_hex", read_only=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    stock_quantity = serializers.IntegerField(source="product_variant.stock_quantity", read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "variant_id",
            "product_name",
            "product_slug",
            "product_image",
            "size",
            "color_name",
            "color_hex",
            "quantity",
            "unit_price",
            "total_price",
            "stock_quantity",
            "added_at",
        ]

    def get_product_image(self, obj):
        product = obj.product_variant.product
        image = product.images.filter(is_primary=True).first() or product.images.first()
        if not image:
            return None
        return _normalize_image_url(image.image.url)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "subtotal", "created_at", "updated_at", "stock_reserved_until"]


class AddToCartSerializer(serializers.Serializer):
    product_variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
