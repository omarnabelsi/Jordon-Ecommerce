from django.urls import path

from apps.products.views import (
    BrandListAPIView,
    CategoryListAPIView,
    FeaturedProductsAPIView,
    ProductBySlugAPIView,
    ProductListAPIView,
)

urlpatterns = [
    path("", ProductListAPIView.as_view(), name="products-list"),
    path("featured/", FeaturedProductsAPIView.as_view(), name="products-featured"),
    path("categories/", CategoryListAPIView.as_view(), name="products-categories"),
    path("brands/", BrandListAPIView.as_view(), name="products-brands"),
    path("<slug:slug>/", ProductBySlugAPIView.as_view(), name="products-detail"),
]
