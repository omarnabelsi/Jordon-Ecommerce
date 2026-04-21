from django.contrib import admin

from apps.core.models import ContactMessage

admin.site.site_header = "Jumpman Ops Control"
admin.site.site_title = "Jumpman Admin"
admin.site.index_title = "Operations Console"


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("subject", "email", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("subject", "email", "name")
    readonly_fields = ("name", "email", "subject", "message", "created_at")
