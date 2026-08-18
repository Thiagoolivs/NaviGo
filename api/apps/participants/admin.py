from django.contrib import admin

from .models import Invite, Participant, ParticipantRequirement, TripRequirement


class ParticipantRequirementInline(admin.TabularInline):
    model = ParticipantRequirement
    extra = 0


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ("name", "trip", "status", "is_minor", "phone", "email")
    list_filter = ("status", "is_minor", "trip")
    search_fields = ("name", "email", "document", "guardian_name")
    inlines = [ParticipantRequirementInline]


@admin.register(TripRequirement)
class TripRequirementAdmin(admin.ModelAdmin):
    list_display = ("name", "trip", "applies_to", "required", "order")
    list_filter = ("applies_to", "required")


@admin.register(Invite)
class InviteAdmin(admin.ModelAdmin):
    list_display = ("trip", "token", "expires_at")
