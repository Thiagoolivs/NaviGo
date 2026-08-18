from django.utils.text import slugify
from rest_framework import serializers

from .models import BudgetItem, Task, Trip, TripConfig


class TripConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripConfig
        fields = [
            "has_lodging",
            "has_meals",
            "has_chartered_transport",
            "has_rooms",
            "has_groups",
            "has_capacity_limit",
            "safety_margin_percent",
        ]


class BudgetItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetItem
        fields = ["id", "trip", "category", "description", "amount", "cost_type"]


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "trip", "title", "description", "done", "due_date", "source"]
        read_only_fields = ["source"]


class TripSerializer(serializers.ModelSerializer):
    config = TripConfigSerializer(required=False)
    participants_count = serializers.SerializerMethodField()
    tasks_pending = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            "id",
            "name",
            "destination",
            "type",
            "start_date",
            "end_date",
            "duration_days",
            "capacity",
            "slug",
            "status",
            "cover_image_url",
            "config",
            "participants_count",
            "tasks_pending",
            "created_at",
        ]
        read_only_fields = ["slug", "created_at"]

    def get_participants_count(self, trip: Trip) -> int:
        return trip.participants.count()

    def get_tasks_pending(self, trip: Trip) -> int:
        return trip.tasks.filter(done=False).count()

    def create(self, validated_data: dict) -> Trip:
        config_data = validated_data.pop("config", None)
        validated_data["organizer"] = self.context["request"].user
        validated_data["slug"] = self._unique_slug(validated_data["name"])
        trip = Trip.objects.create(**validated_data)
        TripConfig.objects.create(trip=trip, **(config_data or {}))
        return trip

    def update(self, instance: Trip, validated_data: dict) -> Trip:
        config_data = validated_data.pop("config", None)
        trip = super().update(instance, validated_data)
        if config_data is not None:
            config, _ = TripConfig.objects.get_or_create(trip=trip)
            for field, value in config_data.items():
                setattr(config, field, value)
            config.save()
        return trip

    @staticmethod
    def _unique_slug(name: str) -> str:
        base = slugify(name)[:140] or "viagem"
        slug = base
        counter = 2
        while Trip.objects.filter(slug=slug).exists():
            slug = f"{base}-{counter}"
            counter += 1
        return slug


class PublicTripSerializer(serializers.ModelSerializer):
    """Dados expostos na página pública da viagem (sem informação sensível)."""

    spots_left = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            "name",
            "destination",
            "type",
            "start_date",
            "end_date",
            "duration_days",
            "capacity",
            "slug",
            "cover_image_url",
            "spots_left",
        ]

    def get_spots_left(self, trip: Trip) -> int | None:
        if trip.capacity is None:
            return None
        return max(trip.capacity - trip.participants.count(), 0)


class AssistantSuggestionSerializer(serializers.Serializer):
    """Resposta do assistente de IA."""

    checklist = serializers.ListField(child=serializers.CharField())
    budget_categories = serializers.ListField(child=serializers.CharField())
    notes = serializers.CharField(allow_blank=True)
    tasks_created = serializers.IntegerField()
