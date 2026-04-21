from rest_framework import serializers
from urllib.parse import unquote

from apps.products.models import Brand, Category, Product, ProductImage, ProductVariant


DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"
BROKEN_UNSPLASH_IDS = {
    "photo-1595777712821-d303827a81da",
    "photo-1608231387042-ec098aae1b86",
    "photo-1552820728-8ac41f1ce891",
    "photo-1580902394734-0e0f6d8b5c8f",
    "photo-1562183241-b937e95585b6",
    "photo-1600185365483-26d7a4cc7519",
}


def _normalize_image_url(raw_value):
    if not raw_value:
        return None

    value = str(raw_value)

    # Handle mis-seeded values stored in ImageField like
    # /media/https%3A/images.unsplash.com/... or /media/http%3A//...
    if value.startswith("/media/"):
        value = value[len("/media/") :]

    decoded = unquote(value)

    if "images.unsplash.com" in decoded and any(image_id in decoded for image_id in BROKEN_UNSPLASH_IDS):
        return DEFAULT_PRODUCT_IMAGE

    if decoded.startswith(("http://", "https://")):
        return decoded

    if decoded.startswith("https:/") and not decoded.startswith("https://"):
        return decoded.replace("https:/", "https://", 1)

    if decoded.startswith("http:/") and not decoded.startswith("http://"):
        return decoded.replace("http:/", "http://", 1)

    return raw_value


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "parent", "is_active"]


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "description", "is_active"]


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary", "order"]

    def get_image(self, obj):
        if not obj.image:
            return None
        return _normalize_image_url(obj.image.url)


class ProductVariantSerializer(serializers.ModelSerializer):
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "size",
            "color_name",
            "color_hex",
            "sku",
            "stock_quantity",
            "price_adjustment",
            "final_price",
            "is_in_stock",
        ]


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "short_description",
            "price",
            "sale_price",
            "current_price",
            "category",
            "brand",
            "is_featured",
            "primary_image",
        ]

    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first() or obj.images.first()
        if not image:
            return None
        return _normalize_image_url(image.image.url)


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "short_description",
            "price",
            "sale_price",
            "current_price",
            "category",
            "brand",
            "sku",
            "weight",
            "is_featured",
            "images",
            "variants",
            "created_at",
            "updated_at",
        ]
