from rest_framework import serializers

from .models import Participant, ParticipantRequirement, TripRequirement


class TripRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripRequirement
        fields = ["id", "trip", "name", "description", "applies_to", "required", "order"]


class ParticipantRequirementSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="requirement.name", read_only=True)
    required = serializers.BooleanField(source="requirement.required", read_only=True)

    class Meta:
        model = ParticipantRequirement
        fields = ["id", "participant", "requirement", "name", "required", "delivered",
                  "delivered_at", "notes"]
        read_only_fields = ["participant", "requirement", "delivered_at"]


class ParticipantSerializer(serializers.ModelSerializer):
    """Uso interno do organizador (leitura/edição completa)."""

    class Meta:
        model = Participant
        fields = [
            "id", "trip", "name", "email", "phone", "document", "birth_date", "status",
            "is_minor", "guardian_name", "guardian_phone", "guardian_document",
            "emergency_contact", "health_insurance", "dietary_restrictions",
            "medical_notes", "shirt_size", "boarding_point", "room_group", "notes",
            "consent_accepted", "created_at",
        ]
        read_only_fields = ["trip", "created_at"]


class PublicEnrollmentSerializer(serializers.Serializer):
    """Formulário público de inscrição.

    Pede o essencial e o que excursões de igreja/escola costumam exigir.
    """

    name = serializers.CharField(max_length=140)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True)
    document = serializers.CharField(max_length=40, required=False, allow_blank=True)
    birth_date = serializers.DateField(required=False, allow_null=True)

    is_minor = serializers.BooleanField(default=False)
    guardian_name = serializers.CharField(max_length=140, required=False, allow_blank=True)
    guardian_phone = serializers.CharField(max_length=32, required=False, allow_blank=True)
    guardian_document = serializers.CharField(max_length=40, required=False, allow_blank=True)

    emergency_contact = serializers.CharField(max_length=140, required=False, allow_blank=True)
    health_insurance = serializers.CharField(max_length=140, required=False, allow_blank=True)
    dietary_restrictions = serializers.CharField(
        max_length=200, required=False, allow_blank=True
    )
    medical_notes = serializers.CharField(required=False, allow_blank=True)
    shirt_size = serializers.ChoiceField(
        choices=Participant.ShirtSize.choices, required=False, allow_blank=True
    )
    boarding_point = serializers.CharField(max_length=140, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    consent_accepted = serializers.BooleanField()
    installments = serializers.IntegerField(min_value=1, max_value=12, default=1)

    def validate_consent_accepted(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError("É necessário aceitar os termos para se inscrever.")
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs.get("is_minor") and not attrs.get("guardian_name"):
            raise serializers.ValidationError(
                {"guardian_name": "Informe o responsável para participantes menores de idade."}
            )
        return attrs
