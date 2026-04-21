from django.urls import path

from apps.adminpanel.views import (
    AdminDashboardView,
    AdminLookupView,
    AdminOrderDetailView,
    AdminOrderListView,
    AdminOrderStatusUpdateView,
    AdminOrdersExportView,
    AdminProductDetailView,
    AdminProductListCreateView,
    AdminProductVariantDetailView,
    AdminProductVariantListCreateView,
    AdminProductsExportView,
    AdminUserDetailView,
    AdminUserListView,
    AdminUsersExportView,
)

urlpatterns = [
    path("dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("lookups/", AdminLookupView.as_view(), name="admin-lookups"),
    path("products/", AdminProductListCreateView.as_view(), name="admin-products"),
    path("products/<int:id>/", AdminProductDetailView.as_view(), name="admin-product-detail"),
    path("products/<int:product_id>/variants/", AdminProductVariantListCreateView.as_view(), name="admin-product-variants"),
    path("products/variants/<int:id>/", AdminProductVariantDetailView.as_view(), name="admin-product-variant-detail"),
    path("products/export/", AdminProductsExportView.as_view(), name="admin-products-export"),
    path("orders/", AdminOrderListView.as_view(), name="admin-orders"),
    path("orders/<int:id>/", AdminOrderDetailView.as_view(), name="admin-order-detail"),
    path("orders/<int:id>/status/", AdminOrderStatusUpdateView.as_view(), name="admin-order-status-update"),
    path("orders/export/", AdminOrdersExportView.as_view(), name="admin-orders-export"),
    path("users/", AdminUserListView.as_view(), name="admin-users"),
    path("users/<int:id>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("users/export/", AdminUsersExportView.as_view(), name="admin-users-export"),
]
