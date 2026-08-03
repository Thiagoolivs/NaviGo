from django.contrib import admin

from .models import Invite, Participant


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ("name", "trip", "status", "email", "phone")
    list_filter = ("status",)
    search_fields = ("name", "email", "document")


@admin.register(Invite)
class InviteAdmin(admin.ModelAdmin):
    list_display = ("trip", "token", "expires_at")
