from django.urls import path

from apps.orders.views import OrderCancelView, OrderCreateView, OrderDetailView, OrderListView

urlpatterns = [
    path("create/", OrderCreateView.as_view(), name="orders-create"),
    path("", OrderListView.as_view(), name="orders-list"),
    path("<int:id>/", OrderDetailView.as_view(), name="orders-detail"),
    path("<int:id>/cancel/", OrderCancelView.as_view(), name="orders-cancel"),
]
