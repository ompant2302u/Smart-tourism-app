from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Category, Destination, Hotel, Guide, Review,
    SafetyAlert, EmergencyContact, Favorite, TripPlan,
    NewsletterSubscriber, BookingLog, Payment, Refund, VisitHistory, Notification,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "is_staff", "is_superuser"]
        read_only_fields = ["id", "is_staff", "is_superuser"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon"]


class DestinationSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True, required=False, allow_null=True,
    )
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Destination
        fields = [
            "id","name","slug","city","country","category","category_id","rating","entry_fee",
            "currency","best_time_to_visit","short_description","description","latitude","longitude",
            "image","image_credit_name","image_credit_link","altitude","difficulty","review_count","created_at",
        ]
        read_only_fields = ["id", "review_count", "created_at"]

    def get_review_count(self, obj):
        return obj.reviews.count()


class HotelSerializer(serializers.ModelSerializer):
    destination = DestinationSerializer(read_only=True)
    destination_id = serializers.PrimaryKeyRelatedField(
        queryset=Destination.objects.all(), source="destination", write_only=True, required=False, allow_null=True,
    )

    class Meta:
        model = Hotel
        fields = "__all__"
        read_only_fields = ["id"]


class GuideSerializer(serializers.ModelSerializer):
    destinations = DestinationSerializer(read_only=True, many=True)
    destination_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Destination.objects.all(), source="destinations", write_only=True, required=False,
    )

    class Meta:
        model = Guide
        fields = "__all__"
        read_only_fields = ["id"]


class SafetyAlertSerializer(serializers.ModelSerializer):
    destination = DestinationSerializer(read_only=True)
    destination_id = serializers.PrimaryKeyRelatedField(
        queryset=Destination.objects.all(), source="destination", write_only=True, required=False, allow_null=True,
    )

    class Meta:
        model = SafetyAlert
        fields = "__all__"
        read_only_fields = ["id", "created_at"]


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = "__all__"
        read_only_fields = ["id"]


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    destination_id = serializers.PrimaryKeyRelatedField(
        queryset=Destination.objects.all(), source="destination", write_only=True, required=False, allow_null=True,
    )
    hotel_id = serializers.PrimaryKeyRelatedField(
        queryset=Hotel.objects.all(), source="hotel", write_only=True, required=False, allow_null=True,
    )
    guide_id = serializers.PrimaryKeyRelatedField(
        queryset=Guide.objects.all(), source="guide", write_only=True, required=False, allow_null=True,
    )

    class Meta:
        model = Review
        fields = ["id","user","content_type","destination","hotel","guide","destination_id","hotel_id","guide_id","rating","comment","created_at"]
        read_only_fields = ["id", "user", "created_at", "destination", "hotel", "guide"]

    def validate(self, attrs):
        filled = [bool(attrs.get("destination")), bool(attrs.get("hotel")), bool(attrs.get("guide"))]
        if sum(filled) != 1:
            raise serializers.ValidationError("Provide exactly one of: destination_id, hotel_id, or guide_id.")
        return attrs


class FavoriteSerializer(serializers.ModelSerializer):
    destination = DestinationSerializer(read_only=True)
    hotel = HotelSerializer(read_only=True)
    guide = GuideSerializer(read_only=True)
    destination_id = serializers.PrimaryKeyRelatedField(
        queryset=Destination.objects.all(), source="destination", write_only=True, required=False, allow_null=True,
    )
    hotel_id = serializers.PrimaryKeyRelatedField(
        queryset=Hotel.objects.all(), source="hotel", write_only=True, required=False, allow_null=True,
    )
    guide_id = serializers.PrimaryKeyRelatedField(
        queryset=Guide.objects.all(), source="guide", write_only=True, required=False, allow_null=True,
    )

    class Meta:
        model = Favorite
        fields = "__all__"
        read_only_fields = ["id", "user", "created_at"]

    def validate(self, attrs):
        ct = attrs.get("content_type")
        if ct == "transport":
            return attrs
        filled = [bool(attrs.get("destination")), bool(attrs.get("hotel")), bool(attrs.get("guide"))]
        if sum(filled) != 1:
            raise serializers.ValidationError("Provide exactly one target.")
        return attrs


class TripPlanSerializer(serializers.ModelSerializer):
    destinations = DestinationSerializer(read_only=True, many=True)
    destination_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Destination.objects.all(), source="destinations", write_only=True, required=False,
    )

    class Meta:
        model = TripPlan
        fields = "__all__"
        read_only_fields = ["id", "created_at"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True, default="")
    last_name  = serializers.CharField(required=False, allow_blank=True, default="")
    email      = serializers.EmailField(required=False, allow_blank=True, default="")

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2", "first_name", "last_name"]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        if User.objects.filter(username=data["username"]).exists():
            raise serializers.ValidationError({"username": "Username already taken."})
        email = data.get("email", "").strip()
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email already in use."})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        # Remove blank email so it doesn't trigger uniqueness issues
        if not validated_data.get("email"):
            validated_data.pop("email", None)
        return User.objects.create_user(password=password, **validated_data)


class NewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ["id", "email", "subscribed_at"]
        read_only_fields = ["id", "subscribed_at"]


class BookingLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = BookingLog
        fields = "__all__"
        read_only_fields = ["id", "created_at"]


class PaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    booking = BookingLogSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ["id", "created_at", "user"]


class RefundSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Refund
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "user", "admin_note", "status"]


class VisitHistorySerializer(serializers.ModelSerializer):
    destination = DestinationSerializer(read_only=True)
    hotel = HotelSerializer(read_only=True)
    guide = GuideSerializer(read_only=True)
    destination_id = serializers.PrimaryKeyRelatedField(
        queryset=Destination.objects.all(), source="destination", write_only=True, required=False, allow_null=True,
    )
    hotel_id = serializers.PrimaryKeyRelatedField(
        queryset=Hotel.objects.all(), source="hotel", write_only=True, required=False, allow_null=True,
    )
    guide_id = serializers.PrimaryKeyRelatedField(
        queryset=Guide.objects.all(), source="guide", write_only=True, required=False, allow_null=True,
    )

    class Meta:
        model = VisitHistory
        fields = "__all__"
        read_only_fields = ["id", "visited_at"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "is_admin", "type", "title", "message", "booking_id", "is_read", "created_at"]
        read_only_fields = ["id", "created_at"]
