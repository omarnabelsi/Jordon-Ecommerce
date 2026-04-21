from django_filters.rest_framework import DjangoFilterBackend
from django.core.cache import cache
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from rest_framework.filters import SearchFilter
from rest_framework import generics, permissions

from apps.products.filters import ProductFilter
from apps.products.models import Brand, Category, Product
from apps.products.serializers import (
    BrandSerializer,
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


class ProductListAPIView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    # Keep custom `sort` query param behavior deterministic.
    # Global OrderingFilter can override queryset.order_by(...) and break this.
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = ProductFilter
    search_fields = ["name", "description", "short_description", "sku", "brand__name", "category__name"]

    def get_queryset(self):
        queryset = (
            Product.objects.filter(is_active=True)
            .select_related("category", "brand")
            .prefetch_related("images", "variants")
            .annotate(effective_price=Coalesce("sale_price", "price"))
        )
        sort = self.request.query_params.get("sort")
        if sort == "price_low_high":
            queryset = queryset.order_by("effective_price", "name")
        elif sort == "price_high_low":
            queryset = queryset.order_by("-effective_price", "name")
        elif sort == "newest":
            queryset = queryset.order_by("-created_at", "name")
        elif sort == "best_sellers":
            queryset = queryset.order_by("-is_featured", "-created_at", "name")
        return queryset


class FeaturedProductsAPIView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        cache_key = "featured_products"
        product_ids = cache.get(cache_key)

        if product_ids is None:
            product_ids = list(Product.objects.filter(is_active=True, is_featured=True).values_list("id", flat=True)[:12])
            cache.set(cache_key, product_ids, 300)

        return Product.objects.filter(id__in=product_ids).select_related("category", "brand").prefetch_related("images")


class CategoryListAPIView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Category.objects.filter(is_active=True).order_by("name")


class BrandListAPIView(generics.ListAPIView):
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Brand.objects.filter(is_active=True).order_by("name")


class ProductBySlugAPIView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        slug = self.kwargs["slug"]
        return get_object_or_404(
            Product.objects.filter(is_active=True).select_related("category", "brand").prefetch_related("images", "variants"),
            slug=slug,
        )
