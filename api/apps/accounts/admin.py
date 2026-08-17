from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class NaviGoUserAdmin(UserAdmin):
    list_display = ("username", "email", "first_name", "last_name", "is_staff")
    fieldsets = UserAdmin.fieldsets + (
        ("NaviGo", {"fields": ("phone", "pix_key", "avatar_url")}),
    )
