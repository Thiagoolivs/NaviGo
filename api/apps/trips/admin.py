from django.contrib import admin

from .models import BudgetItem, Task, Trip, TripConfig


class BudgetItemInline(admin.TabularInline):
    model = BudgetItem
    extra = 0


class TripConfigInline(admin.StackedInline):
    model = TripConfig
    extra = 0


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("name", "destination", "type", "status", "organizer", "start_date")
    list_filter = ("type", "status")
    search_fields = ("name", "destination", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [TripConfigInline, BudgetItemInline]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "trip", "done", "due_date", "source")
    list_filter = ("done", "source")
