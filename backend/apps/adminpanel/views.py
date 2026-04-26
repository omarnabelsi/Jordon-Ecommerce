import csv
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDay, TruncMonth
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.adminpanel.serializers import (
    AdminBrandSerializer,
    AdminCategorySerializer,
    AdminOrderDetailSerializer,
    AdminOrderListSerializer,
    AdminOrderStatusUpdateSerializer,
    AdminProductDetailSerializer,
    AdminProductListSerializer,
    AdminProductVariantSerializer,
    AdminProductWriteSerializer,
    AdminUserListSerializer,
    AdminUserDetailSerializer,
    AdminUserUpdateSerializer,
)
from apps.core.models import ContactMessage
from apps.orders.models import Order, OrderItem
from apps.products.models import Brand, Category, Product, ProductImage, ProductVariant

User = get_user_model()


class StaffOnlyMixin:
    permission_classes = [permissions.IsAdminUser]


def _decimal_to_float(value: Decimal | None) -> float:
    if value is None:
        return 0.0
    return float(value)


def _orders_queryset(request):
    queryset = Order.objects.select_related("user").prefetch_related("items").order_by("-created_at")

    status_filter = request.query_params.get("status")
    payment_status_filter = request.query_params.get("payment_status")
    search = request.query_params.get("search")

    if status_filter:
        queryset = queryset.filter(status=status_filter)

    if payment_status_filter:
        queryset = queryset.filter(payment_status=payment_status_filter)

    if search:
        queryset = queryset.filter(Q(order_number__icontains=search) | Q(user__email__icontains=search))

    return queryset


def _products_queryset(request):
    queryset = Product.objects.select_related("category", "brand").prefetch_related("images", "variants").order_by("-created_at")

    search = request.query_params.get("search")
    category_id = request.query_params.get("category")
    brand_id = request.query_params.get("brand")
    status_filter = request.query_params.get("is_active")

    if category_id:
        queryset = queryset.filter(category_id=category_id)

    if brand_id:
        queryset = queryset.filter(brand_id=brand_id)

    if status_filter in {"true", "false"}:
        queryset = queryset.filter(is_active=status_filter == "true")

    if search:
        queryset = queryset.filter(Q(name__icontains=search) | Q(sku__icontains=search))

    return queryset


class AdminLookupView(StaffOnlyMixin, APIView):
    def get(self, request):
        categories = Category.objects.filter(is_active=True).order_by("name")
        brands = Brand.objects.filter(is_active=True).order_by("name")
        return Response(
            {
                "categories": AdminCategorySerializer(categories, many=True).data,
                "brands": AdminBrandSerializer(brands, many=True).data,
                "order_statuses": [value for value, _ in Order.STATUS_CHOICES],
                "payment_statuses": [value for value, _ in Order.PAYMENT_STATUS_CHOICES],
            },
            status=status.HTTP_200_OK,
        )


class AdminDashboardView(StaffOnlyMixin, APIView):
    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)

        paid_orders = Order.objects.exclude(status=Order.STATUS_CANCELLED)
        total_revenue = _decimal_to_float(paid_orders.aggregate(total=Sum("grand_total"))["total"])
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status=Order.STATUS_PENDING).count()
        total_customers = User.objects.count()
        new_customers = User.objects.filter(date_joined__gte=thirty_days_ago).count()
        low_stock_count = ProductVariant.objects.filter(stock_quantity__lte=8).count()
        unread_messages = ContactMessage.objects.filter(is_read=False).count()

        revenue_current_window = _decimal_to_float(
            paid_orders.filter(created_at__gte=thirty_days_ago).aggregate(total=Sum("grand_total"))["total"]
        )
        revenue_previous_window = _decimal_to_float(
            paid_orders.filter(created_at__gte=sixty_days_ago, created_at__lt=thirty_days_ago).aggregate(total=Sum("grand_total"))["total"]
        )
        if revenue_previous_window > 0:
            revenue_growth = ((revenue_current_window - revenue_previous_window) / revenue_previous_window) * 100
        else:
            revenue_growth = 100.0 if revenue_current_window > 0 else 0.0

        orders_today = Order.objects.filter(created_at__gte=today_start).count()
        avg_order_value = total_revenue / total_orders if total_orders else 0.0

        raw_days = request.query_params.get("days", "30")
        try:
            days = int(raw_days)
        except (TypeError, ValueError):
            days = 30
        days = max(7, min(days, 180))
        trend_start = now - timedelta(days=days - 1)

        revenue_points = (
            paid_orders.filter(created_at__gte=trend_start)
            .annotate(bucket=TruncDay("created_at"))
            .values("bucket")
            .annotate(total=Sum("grand_total"), orders=Count("id"))
            .order_by("bucket")
        )

        revenue_map = {point["bucket"].date().isoformat(): point for point in revenue_points}
        revenue_series = []
        for day_offset in range(days):
            day = (trend_start + timedelta(days=day_offset)).date().isoformat()
            point = revenue_map.get(day)
            revenue_series.append(
                {
                    "date": day,
                    "revenue": _decimal_to_float(point["total"]) if point else 0.0,
                    "orders": point["orders"] if point else 0,
                }
            )

        category_sales = (
            OrderItem.objects.exclude(order__status=Order.STATUS_CANCELLED)
            .filter(order__created_at__gte=thirty_days_ago)
            .values("product_variant__product__category__name")
            .annotate(revenue=Sum("total_price"), units=Sum("quantity"))
            .order_by("-revenue")[:6]
        )

        top_products = (
            OrderItem.objects.exclude(order__status=Order.STATUS_CANCELLED)
            .filter(order__created_at__gte=thirty_days_ago)
            .values(
                "product_variant__product__id",
                "product_variant__product__name",
                "product_variant__product__sku",
            )
            .annotate(units=Sum("quantity"), revenue=Sum("total_price"))
            .order_by("-revenue")[:8]
        )

        recent_orders = Order.objects.select_related("user").prefetch_related("items__product_variant__product__images").order_by("-created_at")[:10]
        recent_order_data = []
        for order in recent_orders:
            product_image = None
            first_item = order.items.first()
            if first_item and first_item.product_variant:
                product = first_item.product_variant.product
                primary_img = product.images.filter(is_primary=True).first() or product.images.first()
                if primary_img and primary_img.image:
                    from apps.products.serializers import _normalize_image_url
                    product_image = _normalize_image_url(primary_img.image.url)

            recent_order_data.append({
                "id": order.id,
                "order_number": order.order_number,
                "customer_email": order.user.email,
                "status": order.status,
                "payment_status": order.payment_status,
                "grand_total": str(order.grand_total),
                "created_at": order.created_at,
                "product_image": product_image,
            })

        low_stock_variants = ProductVariant.objects.select_related("product").filter(stock_quantity__lte=8).order_by("stock_quantity")[:12]
        inventory_alerts = [
            {
                "id": variant.id,
                "product_id": variant.product_id,
                "product_name": variant.product.name,
                "sku": variant.sku,
                "size": variant.size,
                "color_name": variant.color_name,
                "stock_quantity": variant.stock_quantity,
            }
            for variant in low_stock_variants
        ]

        status_distribution = (
            Order.objects.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )

        monthly_revenue = (
            paid_orders.filter(created_at__gte=now - timedelta(days=365))
            .annotate(bucket=TruncMonth("created_at"))
            .values("bucket")
            .annotate(total=Sum("grand_total"))
            .order_by("bucket")
        )

        # Get product images for top products
        top_product_data = []
        for row in top_products:
            product_image = None
            try:
                product = Product.objects.prefetch_related("images").get(id=row["product_variant__product__id"])
                primary_img = product.images.filter(is_primary=True).first() or product.images.first()
                if primary_img and primary_img.image:
                    from apps.products.serializers import _normalize_image_url
                    product_image = _normalize_image_url(primary_img.image.url)
            except Product.DoesNotExist:
                pass
            top_product_data.append({
                "product_id": row["product_variant__product__id"],
                "product_name": row["product_variant__product__name"],
                "sku": row["product_variant__product__sku"],
                "units": row["units"],
                "revenue": round(_decimal_to_float(row["revenue"]), 2),
                "product_image": product_image,
            })

        return Response(
            {
                "kpis": {
                    "total_revenue": round(total_revenue, 2),
                    "revenue_growth": round(revenue_growth, 2),
                    "total_orders": total_orders,
                    "orders_today": orders_today,
                    "avg_order_value": round(avg_order_value, 2),
                    "pending_orders": pending_orders,
                    "total_customers": total_customers,
                    "new_customers_30d": new_customers,
                    "low_stock_count": low_stock_count,
                    "unread_messages": unread_messages,
                },
                "revenue_series": revenue_series,
                "status_distribution": list(status_distribution),
                "top_products": top_product_data,
                "category_sales": [
                    {
                        "category": row["product_variant__product__category__name"] or "Uncategorized",
                        "revenue": round(_decimal_to_float(row["revenue"]), 2),
                        "units": row["units"],
                    }
                    for row in category_sales
                ],
                "recent_orders": recent_order_data,
                "inventory_alerts": inventory_alerts,
                "monthly_revenue": [
                    {
                        "month": row["bucket"].strftime("%Y-%m"),
                        "revenue": round(_decimal_to_float(row["total"]), 2),
                    }
                    for row in monthly_revenue
                ],
            },
            status=status.HTTP_200_OK,
        )


class AdminBulkOrderStatusView(StaffOnlyMixin, APIView):
    """Update status for multiple orders at once."""
    def post(self, request):
        order_ids = request.data.get("order_ids", [])
        new_status = request.data.get("status")

        if not order_ids or not new_status:
            return Response(
                {"detail": "order_ids and status are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"detail": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = Order.objects.filter(id__in=order_ids).update(status=new_status)
        return Response(
            {"detail": f"Updated {updated} orders to '{new_status}'."},
            status=status.HTTP_200_OK,
        )


class AdminProductListCreateView(StaffOnlyMixin, generics.ListCreateAPIView):
    serializer_class = AdminProductListSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return _products_queryset(self.request)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AdminProductWriteSerializer
        return AdminProductListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        image_file = request.FILES.get("image")
        if image_file:
            ProductImage.objects.create(
                product=product,
                image=image_file,
                alt_text=request.data.get("image_alt", "") or product.name,
                is_primary=True,
                order=0,
            )

        read_serializer = AdminProductDetailSerializer(product)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class AdminProductDetailView(StaffOnlyMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related("category", "brand").prefetch_related("variants", "images")
    lookup_field = "id"
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.method in {"PUT", "PATCH"}:
            return AdminProductWriteSerializer
        return AdminProductDetailSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        image_file = request.FILES.get("image")
        if image_file:
            ProductImage.objects.filter(product=product, is_primary=True).update(is_primary=False)
            ProductImage.objects.create(
                product=product,
                image=image_file,
                alt_text=request.data.get("image_alt", "") or product.name,
                is_primary=True,
                order=0,
            )

        read_serializer = AdminProductDetailSerializer(product)
        return Response(read_serializer.data, status=status.HTTP_200_OK)


class AdminProductVariantListCreateView(StaffOnlyMixin, generics.ListCreateAPIView):
    serializer_class = AdminProductVariantSerializer

    def get_queryset(self):
        product_id = self.kwargs["product_id"]
        return ProductVariant.objects.filter(product_id=product_id).order_by("size", "color_name")

    def perform_create(self, serializer):
        product_id = self.kwargs["product_id"]
        product = get_object_or_404(Product, id=product_id)
        serializer.save(product=product)


class AdminProductVariantDetailView(StaffOnlyMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductVariant.objects.select_related("product")
    serializer_class = AdminProductVariantSerializer
    lookup_field = "id"


class AdminOrderListView(StaffOnlyMixin, generics.ListAPIView):
    serializer_class = AdminOrderListSerializer

    def get_queryset(self):
        return _orders_queryset(self.request)


class AdminOrderDetailView(StaffOnlyMixin, generics.RetrieveAPIView):
    serializer_class = AdminOrderDetailSerializer
    queryset = Order.objects.select_related("user").prefetch_related("items", "items__product_variant")
    lookup_field = "id"


class AdminOrderStatusUpdateView(StaffOnlyMixin, generics.UpdateAPIView):
    serializer_class = AdminOrderStatusUpdateSerializer
    queryset = Order.objects.all()
    lookup_field = "id"


class AdminUserListView(StaffOnlyMixin, generics.ListAPIView):
    serializer_class = AdminUserListSerializer

    def get_queryset(self):
        queryset = User.objects.prefetch_related("orders").order_by("-date_joined")
        search = self.request.query_params.get("search")
        role = self.request.query_params.get("role")

        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )

        if role == "admin":
            queryset = queryset.filter(is_staff=True)
        elif role == "customer":
            queryset = queryset.filter(is_staff=False)

        return queryset


class AdminUserDetailView(StaffOnlyMixin, generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    lookup_field = "id"

    def get_serializer_class(self):
        if self.request.method in {"PUT", "PATCH"}:
            return AdminUserUpdateSerializer
        return AdminUserDetailSerializer


class AdminOrdersExportView(StaffOnlyMixin, APIView):
    def get(self, request):
        queryset = _orders_queryset(request)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=orders_export.csv"

        writer = csv.writer(response)
        writer.writerow([
            "Order Number",
            "Customer Email",
            "Status",
            "Payment Status",
            "Grand Total",
            "Tracking Number",
            "Created At",
        ])

        for order in queryset:
            writer.writerow(
                [
                    order.order_number,
                    order.user.email,
                    order.status,
                    order.payment_status,
                    str(order.grand_total),
                    order.tracking_number,
                    order.created_at.isoformat(),
                ]
            )

        return response


class AdminProductsExportView(StaffOnlyMixin, APIView):
    def get(self, request):
        queryset = _products_queryset(request)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=products_export.csv"

        writer = csv.writer(response)
        writer.writerow([
            "Name",
            "SKU",
            "Category",
            "Brand",
            "Price",
            "Sale Price",
            "Total Stock",
            "Active",
            "Featured",
            "Updated At",
        ])

        for product in queryset:
            writer.writerow(
                [
                    product.name,
                    product.sku,
                    product.category.name,
                    product.brand.name,
                    str(product.price),
                    str(product.sale_price or ""),
                    sum(variant.stock_quantity for variant in product.variants.all()),
                    product.is_active,
                    product.is_featured,
                    product.updated_at.isoformat(),
                ]
            )

        return response


class AdminUsersExportView(StaffOnlyMixin, APIView):
    def get(self, request):
        users = User.objects.prefetch_related("orders").order_by("-date_joined")

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=users_export.csv"

        writer = csv.writer(response)
        writer.writerow([
            "Email",
            "First Name",
            "Last Name",
            "Phone",
            "Is Active",
            "Is Staff",
            "Orders",
            "Date Joined",
        ])

        for user in users:
            writer.writerow(
                [
                    user.email,
                    user.first_name,
                    user.last_name,
                    user.phone,
                    user.is_active,
                    user.is_staff,
                    user.orders.count(),
                    user.date_joined.isoformat(),
                ]
            )

        return response
