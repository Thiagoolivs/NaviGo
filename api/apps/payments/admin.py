from django.contrib import admin

from .models import Installment, Payment


class InstallmentInline(admin.TabularInline):
    model = Installment
    extra = 0


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("participant", "trip", "total_amount", "status")
    list_filter = ("status", "method")
    inlines = [InstallmentInline]


@admin.register(Installment)
class InstallmentAdmin(admin.ModelAdmin):
    list_display = ("payment", "amount", "due_date", "status", "paid_at")
    list_filter = ("status",)
