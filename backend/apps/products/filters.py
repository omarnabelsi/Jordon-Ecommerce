import django_filters
from django.db.models.functions import Coalesce

from apps.products.models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug", lookup_expr="iexact")
    brand = django_filters.CharFilter(field_name="brand__slug", lookup_expr="iexact")
    min_price = django_filters.NumberFilter(method="filter_min_price")
    max_price = django_filters.NumberFilter(method="filter_max_price")
    size = django_filters.CharFilter(field_name="variants__size", lookup_expr="iexact")
    color = django_filters.CharFilter(field_name="variants__color_name", lookup_expr="icontains")
    available = django_filters.BooleanFilter(method="filter_available")

    class Meta:
        model = Product
        fields = ["category", "brand", "min_price", "max_price", "size", "color", "available"]

    def filter_available(self, queryset, name, value):
        if value:
            return queryset.filter(variants__stock_quantity__gt=0).distinct()
        return queryset

    def filter_min_price(self, queryset, name, value):
        return queryset.annotate(effective_price=Coalesce("sale_price", "price")).filter(effective_price__gte=value)

    def filter_max_price(self, queryset, name, value):
        return queryset.annotate(effective_price=Coalesce("sale_price", "price")).filter(effective_price__lte=value)
