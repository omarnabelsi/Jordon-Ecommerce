from django.contrib.auth import get_user_model
from django.db.models import Sum
from rest_framework import serializers

from apps.orders.models import Order, OrderItem
from apps.products.models import Brand, Category, Product, ProductImage, ProductVariant
from apps.products.serializers import _normalize_image_url

User = get_user_model()


class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class AdminBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name"]


class AdminProductVariantSerializer(serializers.ModelSerializer):
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "product",
            "size",
            "color_name",
            "color_hex",
            "sku",
            "stock_quantity",
            "price_adjustment",
            "final_price",
        ]
        read_only_fields = ["id", "final_price", "product"]


class AdminProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary", "order"]

    def get_image(self, obj):
        if not obj.image:
            return None
        return _normalize_image_url(obj.image.url)


class AdminProductListSerializer(serializers.ModelSerializer):
    category = AdminCategorySerializer(read_only=True)
    brand = AdminBrandSerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    total_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "price",
            "sale_price",
            "is_active",
            "is_featured",
            "category",
            "brand",
            "primary_image",
            "total_stock",
            "created_at",
            "updated_at",
        ]

    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first() or obj.images.first()
        if not image:
            return None
        return _normalize_image_url(image.image.url)

    def get_total_stock(self, obj):
        return sum(variant.stock_quantity for variant in obj.variants.all())


class AdminProductDetailSerializer(serializers.ModelSerializer):
    category = AdminCategorySerializer(read_only=True)
    brand = AdminBrandSerializer(read_only=True)
    variants = AdminProductVariantSerializer(many=True, read_only=True)
    images = AdminProductImageSerializer(many=True, read_only=True)

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
            "category",
            "brand",
            "sku",
            "weight",
            "is_active",
            "is_featured",
            "variants",
            "images",
            "created_at",
            "updated_at",
        ]


class AdminProductWriteSerializer(serializers.ModelSerializer):
    def to_internal_value(self, data):
        mutable_data = data.copy()
        for field in ("sale_price", "weight"):
            if mutable_data.get(field) == "":
                mutable_data[field] = None
        return super().to_internal_value(mutable_data)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "short_description",
            "price",
            "sale_price",
            "category",
            "brand",
            "sku",
            "weight",
            "is_active",
            "is_featured",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        price = attrs.get("price", getattr(self.instance, "price", None))
        sale_price = attrs.get("sale_price", getattr(self.instance, "sale_price", None))
        if price is not None and sale_price is not None and sale_price > price:
            raise serializers.ValidationError({"sale_price": "Sale price cannot be greater than base price."})
        return attrs


class AdminOrderItemSerializer(serializers.ModelSerializer):
    variant_sku = serializers.CharField(source="product_variant.sku", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product_name", "quantity", "unit_price", "total_price", "variant_sku"]


class AdminOrderListSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source="user.email", read_only=True)
    customer_name = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer_email",
            "customer_name",
            "status",
            "payment_status",
            "grand_total",
            "tracking_number",
            "item_count",
            "created_at",
            "updated_at",
        ]

    def get_customer_name(self, obj):
        first_name = (obj.user.first_name or "").strip()
        last_name = (obj.user.last_name or "").strip()
        full_name = f"{first_name} {last_name}".strip()
        return full_name or obj.user.email

    def get_item_count(self, obj):
        return obj.items.count()


class AdminOrderDetailSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source="user.email", read_only=True)
    customer_name = serializers.SerializerMethodField()
    items = AdminOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer_email",
            "customer_name",
            "status",
            "payment_status",
            "payment_method",
            "tracking_number",
            "notes",
            "total_amount",
            "shipping_amount",
            "tax_amount",
            "grand_total",
            "shipping_address",
            "billing_address",
            "items",
            "created_at",
            "updated_at",
        ]

    def get_customer_name(self, obj):
        first_name = (obj.user.first_name or "").strip()
        last_name = (obj.user.last_name or "").strip()
        full_name = f"{first_name} {last_name}".strip()
        return full_name or obj.user.email


class AdminOrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status", "payment_status", "tracking_number", "notes"]


class AdminUserListSerializer(serializers.ModelSerializer):
    order_count = serializers.SerializerMethodField()
    lifetime_value = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "is_active",
            "is_staff",
            "date_joined",
            "last_login",
            "order_count",
            "lifetime_value",
        ]

    def get_order_count(self, obj):
        return obj.orders.count()

    def get_lifetime_value(self, obj):
        total = obj.orders.exclude(status=Order.STATUS_CANCELLED).aggregate(total=Sum("grand_total"))["total"]
        if total is None:
            return "0.00"
        return str(total)


class AdminUserDetailSerializer(AdminUserListSerializer):
    class Meta(AdminUserListSerializer.Meta):
        fields = AdminUserListSerializer.Meta.fields


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone", "is_active", "is_staff"]
