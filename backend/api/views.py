from django.db.models import Q, Sum
from django.db import models as db_models
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
import random, uuid, requests
from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse

from .models import (
    Category, Destination, Hotel, Guide, Review,
    SafetyAlert, EmergencyContact, Favorite, TripPlan,
    NewsletterSubscriber, BookingLog, Payment, Refund, VisitHistory, Notification
)
from .serializers import (
    CategorySerializer, DestinationSerializer, HotelSerializer, GuideSerializer,
    ReviewSerializer, SafetyAlertSerializer, EmergencyContactSerializer,
    FavoriteSerializer, TripPlanSerializer, RegisterSerializer,
    UserSerializer, NewsletterSerializer, BookingLogSerializer,
    PaymentSerializer, RefundSerializer, VisitHistorySerializer, NotificationSerializer
)


def get_ip(request):
    x = request.META.get("HTTP_X_FORWARDED_FOR")
    return x.split(",")[0] if x else request.META.get("REMOTE_ADDR")


# ================= AUTH =================

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    s = RegisterSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    user = s.save()
    refresh = RefreshToken.for_user(user)
    return Response({
        "user": UserSerializer(user).data,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }, status=201)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method == "GET":
        return Response(UserSerializer(request.user).data)
    safe_fields = ["first_name", "last_name", "email"]
    data = {k: v for k, v in request.data.items() if k in safe_fields}
    s = UserSerializer(request.user, data=data, partial=True)
    s.is_valid(raise_exception=True)
    s.save()
    return Response(s.data)


# ================= DESTINATIONS =================

class DestinationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Destination.objects.select_related("category")
    serializer_class = DestinationSerializer
    lookup_field = "slug"

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params
        if q.get("category"):
            qs = qs.filter(category__slug=q["category"])
        if q.get("country"):
            qs = qs.filter(country=q["country"])
        if q.get("search"):
            qs = qs.filter(Q(name__icontains=q["search"]) | Q(city__icontains=q["search"]))
        return qs.order_by(q.get("sort", "-rating"))

    @action(detail=True, methods=["get"])
    def reviews(self, request, slug=None):
        dest = self.get_object()
        return Response(ReviewSerializer(dest.reviews.select_related("user"), many=True).data)

    @action(detail=True, methods=["get"])
    def hotels(self, request, slug=None):
        dest = self.get_object()
        return Response(HotelSerializer(dest.hotels.all(), many=True).data)


# ================= HOTELS =================

class HotelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Hotel.objects.select_related("destination")
    serializer_class = HotelSerializer
    lookup_field = "slug"

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params
        if q.get("destination"):
            qs = qs.filter(destination__slug=q["destination"])
        if q.get("max_price"):
            qs = qs.filter(price_per_night__lte=q["max_price"])
        if q.get("search"):
            qs = qs.filter(Q(name__icontains=q["search"]))
        return qs.order_by(q.get("sort", "-rating"))

    @action(detail=True, methods=["get"])
    def reviews(self, request, slug=None):
        hotel = self.get_object()
        return Response(ReviewSerializer(hotel.reviews.select_related("user"), many=True).data)


# ================= GUIDES =================

class GuideViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Guide.objects.prefetch_related("destinations")
    serializer_class = GuideSerializer
    lookup_field = "slug"

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params
        if q.get("language"):
            qs = qs.filter(languages__icontains=q["language"])
        if q.get("max_price"):
            qs = qs.filter(price_per_day__lte=q["max_price"])
        return qs.order_by(q.get("sort", "-rating"))

    @action(detail=True, methods=["get"])
    def reviews(self, request, slug=None):
        guide = self.get_object()
        return Response(ReviewSerializer(guide.reviews.select_related("user"), many=True).data)


# ================= CATEGORIES =================

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


# ================= SAFETY =================

class SafetyAlertViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SafetyAlert.objects.select_related("destination")
    serializer_class = SafetyAlertSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params
        if q.get("destination"):
            qs = qs.filter(destination__slug=q["destination"])
        if q.get("level"):
            qs = qs.filter(level=q["level"])
        return qs.order_by("-created_at")


class EmergencyContactViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmergencyContact.objects.all()
    serializer_class = EmergencyContactSerializer


# ================= REVIEWS =================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_review(request):
    s = ReviewSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    review = s.save(user=request.user)
    # Determine item name for the log
    if review.destination:
        item_name = review.destination.name
    elif review.hotel:
        item_name = review.hotel.name
    elif review.guide:
        item_name = review.guide.name
    else:
        item_name = "Review"
    BookingLog.objects.create(
        action="save_dest",
        user=request.user,
        email=request.user.email,
        item_name=item_name,
        ip_address=get_ip(request),
        extra_data={"review_id": review.id, "rating": review.rating, "type": review.content_type},
    )
    return Response(ReviewSerializer(review).data, status=201)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_review(request, pk):
    try:
        review = Review.objects.get(pk=pk, user=request.user)
    except Review.DoesNotExist:
        return Response(status=404)
    review.delete()
    return Response(status=204)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_reviews(request):
    reviews = Review.objects.filter(user=request.user).select_related("destination", "hotel", "guide")
    return Response(ReviewSerializer(reviews, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_favorite(request):
    """Returns {is_favourite: bool} for a given content_type + id."""
    ct = request.query_params.get("content_type")
    item_id = request.query_params.get("id")
    if not ct or not item_id:
        return Response({"is_favourite": False})
    filter_data = {"user": request.user, "content_type": ct}
    if ct == "destination":
        filter_data["destination_id"] = item_id
    elif ct == "hotel":
        filter_data["hotel_id"] = item_id
    elif ct == "guide":
        filter_data["guide_id"] = item_id
    return Response({"is_favourite": Favorite.objects.filter(**filter_data).exists()})


# ================= FAVORITES =================

@api_view(["GET", "POST", "DELETE"])
@permission_classes([IsAuthenticated])
def favorites(request):
    if request.method == "GET":
        favs = Favorite.objects.filter(user=request.user)
        return Response(FavoriteSerializer(favs, many=True).data)

    ct = request.data.get("content_type")
    item_id = request.data.get(f"{ct}_id") or request.data.get("id")
    item_name = request.data.get("item_name", "")

    if request.method == "POST":
        # Build lookup kwargs
        lookup = {"user": request.user, "content_type": ct}
        defaults = {"item_name": item_name}
        if ct == "destination" and item_id:
            lookup["destination_id"] = item_id
        elif ct == "hotel" and item_id:
            lookup["hotel_id"] = item_id
        elif ct == "guide" and item_id:
            lookup["guide_id"] = item_id

        fav, created = Favorite.objects.get_or_create(**lookup, defaults=defaults)
        if not created:
            # Already exists — treat POST as toggle → delete it
            fav.delete()
            return Response({"removed": True}, status=200)

        item = fav.destination or fav.hotel or fav.guide
        BookingLog.objects.create(
            action="save_dest", user=request.user, email=request.user.email,
            item_name=item.name if item else item_name,
            ip_address=get_ip(request),
            extra_data={"favourite_id": fav.id, "type": ct},
        )
        return Response(FavoriteSerializer(fav).data, status=201)

    # DELETE
    filter_data = {"user": request.user, "content_type": ct}
    if ct == "destination" and item_id:
        filter_data["destination_id"] = item_id
    elif ct == "hotel" and item_id:
        filter_data["hotel_id"] = item_id
    elif ct == "guide" and item_id:
        filter_data["guide_id"] = item_id
    Favorite.objects.filter(**filter_data).delete()
    return Response(status=204)


# ================= VISIT HISTORY =================

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def visit_history(request):
    if request.method == "GET":
        history = VisitHistory.objects.filter(user=request.user).select_related("destination", "hotel", "guide")[:100]
        return Response(VisitHistorySerializer(history, many=True).data)

    s = VisitHistorySerializer(data=request.data)
    s.is_valid(raise_exception=True)
    visit = s.save(user=request.user)
    return Response(VisitHistorySerializer(visit).data, status=201)


# ================= PAYMENTS =================

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def payments(request):
    if request.method == "GET":
        pays = Payment.objects.filter(user=request.user)
        return Response(PaymentSerializer(pays, many=True).data)

    data = request.data
    method = data.get("method")
    amount = float(data.get("amount", 0))
    item_name = data.get("item_name", "")
    action_type = data.get("action", "book_hotel")
    item_id = data.get("item_id")
    extra = data.get("extra_data", {})
    if not isinstance(extra, dict):
        extra = {}

    # Create booking log — starts as PENDING, awaiting admin confirmation
    booking = BookingLog.objects.create(
        action=action_type,
        status="pending",
        user=request.user,
        email=request.user.email,
        item_name=item_name,
        item_id=item_id,
        amount=amount,
        currency=data.get("currency", "USD"),
        payment_method=method,
        ip_address=get_ip(request),
        extra_data=extra,
    )

    # Create payment record (pending until admin confirms booking)
    payment = Payment.objects.create(
        user=request.user,
        booking=booking,
        method=method,
        amount=amount,
        currency=data.get("currency", "USD"),
        status="pending",
        transaction_id=str(uuid.uuid4())[:16].upper(),
    )

    # Notify the user that their booking is pending
    Notification.objects.create(
        user=request.user,
        is_admin=False,
        type="booking_pending",
        title="Booking Pending Confirmation",
        message=f"Your booking for '{item_name}' is pending admin confirmation. You'll be notified once it's approved.",
        booking=booking,
    )
    # Notify all admins about the new booking
    Notification.objects.create(
        is_admin=True,
        type="new_booking",
        title=f"New Booking: {item_name}",
        message=f"{request.user.username} booked '{item_name}' for ${amount}. Awaiting your confirmation.",
        booking=booking,
    )

    return Response(PaymentSerializer(payment).data, status=201)


# ================= REFUNDS =================

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def refunds(request):
    if request.method == "GET":
        user_refunds = Refund.objects.filter(user=request.user)
        return Response(RefundSerializer(user_refunds, many=True).data)

    payment_id = request.data.get("payment_id")
    reason = request.data.get("reason", "")

    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
    except Payment.DoesNotExist:
        return Response({"error": "Payment not found"}, status=404)

    # Allow refund only within 7 days
    refund_window = timezone.now() - timedelta(days=7)
    if payment.created_at < refund_window:
        return Response({"error": "Refund window of 7 days has passed"}, status=400)

    if payment.status == "refunded":
        return Response({"error": "Already refunded"}, status=400)

    refund = Refund.objects.create(
        payment=payment,
        user=request.user,
        reason=reason,
        amount=payment.amount,
        status="requested",
    )
    return Response(RefundSerializer(refund).data, status=201)


# ================= TRIP =================

class TripPlanViewSet(viewsets.ModelViewSet):
    serializer_class = TripPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TripPlan.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ================= SEARCH =================

@api_view(["GET"])
@permission_classes([AllowAny])
def search(request):
    q = request.query_params.get("q", "").strip()
    if not q:
        return Response({"destinations": [], "hotels": [], "guides": []})
    return Response({
        "destinations": DestinationSerializer(Destination.objects.filter(Q(name__icontains=q))[:10], many=True).data,
        "hotels": HotelSerializer(Hotel.objects.filter(Q(name__icontains=q))[:10], many=True).data,
        "guides": GuideSerializer(Guide.objects.filter(Q(name__icontains=q))[:10], many=True).data,
    })


# ================= WEATHER =================

@api_view(["GET"])
@permission_classes([AllowAny])
def weather(request):
    return Response({"temp": random.randint(10, 30), "condition": "Sunny"})


# ================= COST =================

@api_view(["POST"])
@permission_classes([AllowAny])
def estimate_trip_cost(request):
    try:
        days = int(request.data.get("days", 7))
    except Exception:
        return Response({"error": "Invalid days"}, status=400)
    return Response({"total": days * 100})


# ================= NEWSLETTER =================

@api_view(["POST"])
@permission_classes([AllowAny])
def newsletter_subscribe(request):
    s = NewsletterSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    subscriber = s.save()
    BookingLog.objects.create(
        action="subscribe",
        email=subscriber.email,
        item_name="Newsletter",
        ip_address=get_ip(request),
    )
    return Response({"subscribed": True})


# ================= CONTACT =================

@api_view(["POST"])
@permission_classes([AllowAny])
def contact(request):
    BookingLog.objects.create(
        action="contact",
        email=request.data.get("email", ""),
        item_name=request.data.get("subject", "Contact Form"),
        ip_address=get_ip(request),
        extra_data={"name": request.data.get("name", ""), "message": request.data.get("message", "")},
    )
    return Response({"sent": True})


# ================= STATS =================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stats(request):
    base = {
        "destinations": Destination.objects.count(),
        "hotels": Hotel.objects.count(),
        "guides": Guide.objects.count(),
    }
    if request.user.is_staff or request.user.is_superuser:
        from django.contrib.auth.models import User as DjangoUser
        total_revenue = Payment.objects.filter(status="completed").aggregate(t=Sum("amount"))["t"] or 0
        base.update({
            "users": DjangoUser.objects.count(),
            "bookings": BookingLog.objects.count(),
            "reviews": Review.objects.count(),
            "newsletter_subscribers": NewsletterSubscriber.objects.filter(is_active=True).count(),
            "favorites": Favorite.objects.count(),
            "total_revenue": round(total_revenue, 2),
            "pending_refunds": Refund.objects.filter(status="requested").count(),
        })
    return Response(base)


# ================= ADMIN USER ACTIVITY =================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_activity(request):
    """Full activity for a specific user or all users — admin only."""
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(status=403)

    from django.contrib.auth.models import User as DjangoUser
    uid = request.query_params.get("user_id")

    if uid:
        try:
            target = DjangoUser.objects.get(pk=uid)
        except DjangoUser.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        return Response({
            "user": UserSerializer(target).data,
            "bookings": BookingLogSerializer(
                BookingLog.objects.filter(user=target).order_by("-created_at"), many=True
            ).data,
            "payments": PaymentSerializer(
                Payment.objects.filter(user=target).order_by("-created_at"), many=True
            ).data,
            "reviews": ReviewSerializer(
                Review.objects.filter(user=target).select_related("destination","hotel","guide"), many=True
            ).data,
            "favorites": FavoriteSerializer(
                Favorite.objects.filter(user=target), many=True
            ).data,
            "visit_history": VisitHistorySerializer(
                VisitHistory.objects.filter(user=target).select_related("destination","hotel","guide"), many=True
            ).data,
            "refunds": RefundSerializer(
                Refund.objects.filter(user=target), many=True
            ).data,
        })

    # All users summary
    users = DjangoUser.objects.all().order_by("-date_joined")
    result = []
    for u in users:
        result.append({
            "user": UserSerializer(u).data,
            "booking_count": BookingLog.objects.filter(user=u).count(),
            "payment_total": Payment.objects.filter(user=u, status="completed").aggregate(t=Sum("amount"))["t"] or 0,
            "review_count": Review.objects.filter(user=u).count(),
            "favorite_count": Favorite.objects.filter(user=u).count(),
            "visit_count": VisitHistory.objects.filter(user=u).count(),
            "last_active": BookingLog.objects.filter(user=u).values_list("created_at", flat=True).first(),
        })
    return Response(result)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def booking_logs(request):
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(status=403)
    logs = BookingLog.objects.select_related("user").all()
    return Response(BookingLogSerializer(logs, many=True).data)


# ================= ADMIN PAYMENTS =================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def all_payments(request):
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(status=403)
    pays = Payment.objects.select_related("user", "booking").all()
    return Response(PaymentSerializer(pays, many=True).data)


# ================= ADMIN REFUNDS =================

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def admin_refunds(request, pk=None):
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(status=403)

    if request.method == "GET":
        all_refunds = Refund.objects.select_related("user", "payment").all()
        return Response(RefundSerializer(all_refunds, many=True).data)

    # PATCH — approve/reject
    try:
        refund = Refund.objects.get(pk=pk)
    except Refund.DoesNotExist:
        return Response(status=404)

    new_status = request.data.get("status")
    admin_note = request.data.get("admin_note", "")
    if new_status in ["approved", "rejected", "processed"]:
        refund.status = new_status
        refund.admin_note = admin_note
        refund.save()
        if new_status == "processed":
            refund.payment.status = "refunded"
            refund.payment.save()
            if refund.payment.booking:
                refund.payment.booking.status = "refunded"
                refund.payment.booking.save()
    return Response(RefundSerializer(refund).data)


# ================= ADMIN BOOKING CONFIRMATION =================

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def admin_confirm_booking(request, pk):
    """Admin confirms or cancels a pending booking."""
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(status=403)
    try:
        booking = BookingLog.objects.get(pk=pk)
    except BookingLog.DoesNotExist:
        return Response(status=404)

    new_status = request.data.get("status")
    if new_status not in ["confirmed", "cancelled"]:
        return Response({"error": "status must be confirmed or cancelled"}, status=400)

    booking.status = new_status
    booking.save()

    # Update linked payment status
    if hasattr(booking, "payment"):
        if new_status == "confirmed":
            booking.payment.status = "completed"
        elif new_status == "cancelled":
            booking.payment.status = "failed"
        booking.payment.save()

    # Notify the user
    if booking.user:
        notif_type = "booking_confirmed" if new_status == "confirmed" else "booking_cancelled"
        notif_msg = (
            f"Your booking for '{booking.item_name}' has been confirmed! Enjoy your trip."
            if new_status == "confirmed"
            else f"Your booking for '{booking.item_name}' has been cancelled by the admin."
        )
        Notification.objects.create(
            user=booking.user,
            is_admin=False,
            type=notif_type,
            title=f"Booking {new_status.title()}: {booking.item_name}",
            message=notif_msg,
            booking=booking,
        )

    return Response(BookingLogSerializer(booking).data)


# ================= ADMIN REVIEWS MANAGEMENT =================

@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def admin_reviews(request, pk=None):
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(status=403)

    if request.method == "GET":
        reviews = Review.objects.select_related("user", "destination", "hotel", "guide").all()
        return Response(ReviewSerializer(reviews, many=True).data)

    try:
        review = Review.objects.get(pk=pk)
    except Review.DoesNotExist:
        return Response(status=404)

    if request.method == "DELETE":
        review.delete()
        return Response(status=204)

    # PATCH — edit comment/rating
    if "rating" in request.data:
        review.rating = request.data["rating"]
    if "comment" in request.data:
        review.comment = request.data["comment"]
    review.save()
    if review.destination:
        review.destination.update_rating()
    return Response(ReviewSerializer(review).data)


# ================= ADMIN FAVOURITES MANAGEMENT =================

@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def admin_favourites(request, pk=None):
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(status=403)

    if request.method == "GET":
        favs = Favorite.objects.select_related("user", "destination", "hotel", "guide").all()
        return Response(FavoriteSerializer(favs, many=True).data)

    try:
        fav = Favorite.objects.get(pk=pk)
    except Favorite.DoesNotExist:
        return Response(status=404)

    fav.delete()
    return Response(status=204)


# ================= NOTIFICATIONS =================

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def notifications(request):
    if request.method == "GET":
        if request.user.is_staff or request.user.is_superuser:
            # Admins see admin notifications + their own
            notifs = Notification.objects.filter(
                db_models.Q(is_admin=True) | db_models.Q(user=request.user)
            )
        else:
            notifs = Notification.objects.filter(user=request.user, is_admin=False)
        return Response(NotificationSerializer(notifs, many=True).data)

    # PATCH — mark all as read
    if request.user.is_staff or request.user.is_superuser:
        Notification.objects.filter(
            db_models.Q(is_admin=True) | db_models.Q(user=request.user)
        ).update(is_read=True)
    else:
        Notification.objects.filter(user=request.user, is_admin=False).update(is_read=True)
    return Response({"marked_read": True})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    try:
        notif = Notification.objects.get(pk=pk)
    except Notification.DoesNotExist:
        return Response(status=404)
    # Only owner or admin can mark
    if notif.user != request.user and not (request.user.is_staff or request.user.is_superuser):
        return Response(status=403)
    notif.is_read = True
    notif.save()
    return Response({"ok": True})


# ================= UNSPLASH PROXY =================

UNSPLASH_QUERIES = {
    # destinations
    "Everest Base Camp": "Everest Base Camp Nepal",
    "Pokhara": "Pokhara lake Nepal",
    "Annapurna": "Annapurna Circuit Nepal",
    "Kathmandu": "Kathmandu Durbar Square Nepal",
    "Chitwan": "Chitwan National Park Nepal",
    "Lumbini": "Lumbini Nepal Buddhist",
    "Mustang": "Upper Mustang Nepal desert",
    "Langtang": "Langtang Valley Nepal",
    "Manaslu": "Manaslu Circuit Nepal",
    "Bhaktapur": "Bhaktapur Durbar Square Nepal",
    "Patan": "Patan Durbar Square Nepal",
    "Nagarkot": "Nagarkot Nepal Himalaya sunrise",
    "Bandipur": "Bandipur Nepal village",
    "Ilam": "Ilam tea garden Nepal",
    "Rara Lake": "Rara Lake Nepal",
    # transport types
    "helicopter": "helicopter Nepal Himalaya mountains",
    "bus": "tourist bus Nepal mountain road",
    "jeep": "jeep Nepal mountain off-road",
    "flight": "Nepal domestic flight mountain",
    "bike": "motorbike Nepal mountain highway",
    "cable_car": "cable car Nepal Manakamana",
    "boat": "boat Phewa Lake Pokhara Nepal",
    "trekking": "trekking Nepal Himalaya trail",
}

UNSPLASH_FALLBACK = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800"


def _fetch_unsplash(query, cache_key):
    cached = cache.get(cache_key)
    if cached:
        return cached
    key = getattr(settings, "UNSPLASH_ACCESS_KEY", "")
    if not key:
        return {"url": UNSPLASH_FALLBACK, "alt": query, "credit": None}
    try:
        r = requests.get(
            "https://api.unsplash.com/search/photos",
            params={"query": query, "per_page": 1, "orientation": "landscape", "content_filter": "high"},
            headers={"Authorization": f"Client-ID {key}"},
            timeout=5,
        )
        if r.status_code == 200:
            results = r.json().get("results", [])
            if results:
                p = results[0]
                result = {
                    "url": p["urls"]["regular"],
                    "alt": p.get("alt_description") or query,
                    "credit": {"name": p["user"]["name"], "link": p["user"]["links"]["html"]},
                }
                cache.set(cache_key, result, timeout=86400)
                return result
    except Exception:
        pass
    return {"url": UNSPLASH_FALLBACK, "alt": query, "credit": None}


@api_view(["GET"])
@permission_classes([AllowAny])
def unsplash_image(request):
    """Proxy Unsplash search — keeps API key server-side."""
    name = request.query_params.get("name", "").strip()
    entity_type = request.query_params.get("type", "destination")
    if not name:
        return Response({"error": "name required"}, status=400)
    query = UNSPLASH_QUERIES.get(name, f"{name} Nepal {entity_type}")
    cache_key = f"unsplash_{entity_type}_{name.lower().replace(' ', '_')}"
    return Response(_fetch_unsplash(query, cache_key))


def populate_images():
    """Call once after seeding: fills image field for all Destinations and Hotels."""
    for dest in Destination.objects.filter(image=""):
        data = _fetch_unsplash(
            UNSPLASH_QUERIES.get(dest.name, f"{dest.name} Nepal"),
            f"unsplash_destination_{dest.name.lower().replace(' ', '_')}",
        )
        dest.image = data["url"]
        dest.image_credit_name = (data["credit"] or {}).get("name", "")
        dest.image_credit_link = (data["credit"] or {}).get("link", "")
        dest.save(update_fields=["image", "image_credit_name", "image_credit_link"])

    for hotel in Hotel.objects.filter(image=""):
        data = _fetch_unsplash(
            f"{hotel.name} hotel Nepal",
            f"unsplash_hotel_{hotel.name.lower().replace(' ', '_')}",
        )
        hotel.image = data["url"]
        hotel.image_credit_name = (data["credit"] or {}).get("name", "")
        hotel.image_credit_link = (data["credit"] or {}).get("link", "")
        hotel.save(update_fields=["image", "image_credit_name", "image_credit_link"])



# ── ELEVENLABS AI CHATBOT ──

@api_view(["GET"])
@permission_classes([AllowAny])
def get_signed_url(request):
    try:
        agent_id = getattr(settings, "AGENT_ID", None)
        api_key = getattr(settings, "ELEVENLABS_API_KEY", None)
        branch_id = getattr(settings, "BRANCH_ID", None)

        if not agent_id or not api_key:
            return Response({"error": "ElevenLabs config missing"}, status=500)

        url = "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url"
        params = {"agent_id": agent_id}
        if branch_id:
            params["branch_id"] = branch_id

        response = requests.get(url, headers={"xi-api-key": api_key}, params=params, timeout=20)

        if response.status_code != 200:
            return Response({"error": "ElevenLabs request failed", "details": response.text}, status=500)

        data = response.json()
        signed_url = data.get("signed_url")
        if not signed_url:
            return Response({"error": "Signed URL missing", "details": data}, status=500)

        return Response({"signedUrl": signed_url})

    except requests.exceptions.RequestException as e:
        return Response({"error": "Request error", "details": str(e)}, status=500)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# ================= NEPAL AI CHAT =================

# ── Static website data for direct answers ──────────────────────────────────
HOTELS = {
    "kathmandu": [
        {"name": "Dwarika's Hotel", "stars": 5, "price": 350, "rating": 4.9, "amenities": "pool, spa, gym"},
        {"name": "Hyatt Regency Kathmandu", "stars": 5, "price": 280, "rating": 4.8, "amenities": "pool, spa, gym"},
        {"name": "Hotel Yak & Yeti", "stars": 5, "price": 220, "rating": 4.7, "amenities": "pool, spa"},
        {"name": "Thamel Eco Resort", "stars": 3, "price": 45, "rating": 4.3, "amenities": "wifi"},
    ],
    "pokhara": [
        {"name": "Fish Tail Lodge", "stars": 4, "price": 180, "rating": 4.8, "amenities": "spa, lake view"},
        {"name": "Temple Tree Resort & Spa", "stars": 4, "price": 145, "rating": 4.7, "amenities": "pool, spa"},
        {"name": "Pokhara Grande", "stars": 4, "price": 110, "rating": 4.6, "amenities": "pool"},
    ],
    "chitwan": [
        {"name": "Meghauli Serai (Taj Safari)", "stars": 5, "price": 450, "rating": 4.9, "amenities": "pool, spa, river view"},
        {"name": "Barahi Jungle Lodge", "stars": 4, "price": 120, "rating": 4.6, "amenities": "jungle setting"},
    ],
    "everest": [
        {"name": "Everest View Hotel", "stars": 3, "price": 95, "rating": 4.5, "amenities": "world's highest hotel at 3880m"},
    ],
    "annapurna": [
        {"name": "Sanctuary Lodge Annapurna", "stars": 4, "price": 160, "rating": 4.7, "amenities": "mountain views"},
    ],
    "lumbini": [
        {"name": "Lumbini Buddha Hotel", "stars": 3, "price": 65, "rating": 4.4, "amenities": "wifi"},
    ],
    "patan": [
        {"name": "Inn Patan", "stars": 3, "price": 85, "rating": 4.6, "amenities": "heritage building"},
    ],
    "bhaktapur": [
        {"name": "Bhaktapur Heritage Hotel", "stars": 3, "price": 75, "rating": 4.5, "amenities": "Durbar Square views"},
    ],
}

GUIDES = [
    {"name": "Pemba Sherpa", "rating": 4.9, "exp": 15, "price": 80, "spec": "Everest/high altitude trekking", "langs": "English, Nepali, Tibetan, Hindi"},
    {"name": "Sita Gurung", "rating": 4.8, "exp": 10, "price": 65, "spec": "Cultural tours, Kathmandu Valley", "langs": "English, Nepali, French, German"},
    {"name": "Bikram Rai", "rating": 4.7, "exp": 8, "price": 60, "spec": "Annapurna trekking, birdwatching", "langs": "English, Nepali, Spanish"},
    {"name": "Maya Thapa", "rating": 4.6, "exp": 6, "price": 55, "spec": "Chitwan wildlife safaris", "langs": "English, Nepali, Hindi"},
    {"name": "Dawa Lama", "rating": 4.8, "exp": 12, "price": 75, "spec": "Buddhist pilgrimages, meditation", "langs": "English, Nepali, Tibetan, Chinese"},
    {"name": "Hari Bahadur Magar", "rating": 4.7, "exp": 9, "price": 65, "spec": "Langtang, Tamang heritage", "langs": "English, Nepali, Tamang"},
]

DESTINATIONS = [
    {"name": "Everest Base Camp", "city": "Solukhumbu", "cat": "Trekking", "rating": 4.9, "fee": "Free", "best": "Mar-May, Sep-Nov", "alt": "5364m", "diff": "Strenuous", "duration": "12-14 days"},
    {"name": "Pokhara Lakeside", "city": "Pokhara", "cat": "City", "rating": 4.8, "fee": "Free", "best": "Sep-Nov, Feb-Apr", "alt": "827m", "diff": "Easy"},
    {"name": "Chitwan National Park", "city": "Chitwan", "cat": "Wildlife", "rating": 4.7, "fee": "$25", "best": "Oct-Mar", "diff": "Easy"},
    {"name": "Pashupatinath Temple", "city": "Kathmandu", "cat": "Spiritual", "rating": 4.6, "fee": "$10", "best": "Year Round"},
    {"name": "Annapurna Circuit", "city": "Manang", "cat": "Trekking", "rating": 4.8, "fee": "Free", "best": "Oct-Nov, Mar-May", "alt": "5416m", "diff": "Challenging", "duration": "14-21 days"},
    {"name": "Boudhanath Stupa", "city": "Kathmandu", "cat": "Cultural", "rating": 4.7, "fee": "$5", "best": "Year Round"},
    {"name": "Nagarkot Sunrise", "city": "Bhaktapur", "cat": "Scenic", "rating": 4.5, "fee": "Free", "best": "Oct-Apr", "alt": "2195m"},
    {"name": "Lumbini", "city": "Rupandehi", "cat": "Spiritual", "rating": 4.6, "fee": "$3", "best": "Oct-Mar"},
    {"name": "Rara Lake", "city": "Mugu", "cat": "Scenic", "rating": 4.9, "fee": "$5", "best": "Apr-Jun, Sep-Nov", "alt": "2990m", "diff": "Challenging"},
    {"name": "Patan Durbar Square", "city": "Lalitpur", "cat": "Cultural", "rating": 4.7, "fee": "$5", "best": "Year Round"},
    {"name": "Langtang Valley", "city": "Rasuwa", "cat": "Trekking", "rating": 4.7, "fee": "Free", "best": "Mar-May, Sep-Nov", "alt": "3430m", "diff": "Moderate", "duration": "7-10 days"},
    {"name": "Poon Hill", "city": "Myagdi", "cat": "Trekking", "rating": 4.8, "fee": "Free", "best": "Oct-Nov, Mar-May", "alt": "3210m", "diff": "Easy", "duration": "4-5 days"},
    {"name": "Bhaktapur Durbar Square", "city": "Bhaktapur", "cat": "Cultural", "rating": 4.8, "fee": "$15", "best": "Year Round"},
    {"name": "Upper Mustang", "city": "Mustang", "cat": "Cultural", "rating": 4.9, "fee": "$500 permit", "best": "May-Oct", "diff": "Challenging"},
    {"name": "Bardia National Park", "city": "Bardiya", "cat": "Wildlife", "rating": 4.8, "fee": "$15", "best": "Oct-Mar"},
]


def _nepal_chat_engine(message, history=None):
    """Direct, specific Nepal tourism chatbot using website data."""
    msg = message.lower().strip()
    action = None

    # ── Navigation intents ──────────────────────────────────────────────────
    if any(w in msg for w in ["open itinerary", "ai itinerary", "itinerary planner", "generate itinerary", "create plan", "plan my trip"]):
        return {"reply": "Opening AI Itinerary Planner.", "action": {"type": "navigate", "page": "ai-itinerary", "params": {}}}
    if any(w in msg for w in ["cost estimator", "estimate cost", "trip cost", "open estimator"]):
        return {"reply": "Opening Trip Cost Estimator.", "action": {"type": "navigate", "page": "estimator", "params": {}}}
    if any(w in msg for w in ["open map", "interactive map", "show map"]):
        return {"reply": "Opening Interactive Map.", "action": {"type": "navigate", "page": "interactive-map", "params": {}}}
    if any(w in msg for w in ["open destinations", "show destinations", "all destinations"]):
        return {"reply": "Opening Destinations page.", "action": {"type": "navigate", "page": "destinations", "params": {}}}
    if any(w in msg for w in ["open hotels", "show hotels", "all hotels"]):
        return {"reply": "Opening Hotels page.", "action": {"type": "navigate", "page": "hotels", "params": {}}}
    if any(w in msg for w in ["open guides", "show guides", "all guides", "find guide"]):
        return {"reply": "Opening Guides page.", "action": {"type": "navigate", "page": "guides", "params": {}}}
    if any(w in msg for w in ["open transport", "show transport", "transportation"]):
        return {"reply": "Opening Transport page.", "action": {"type": "navigate", "page": "transport", "params": {}}}
    if any(w in msg for w in ["safety", "emergency", "alert"]):
        return {"reply": "Opening Safety & Alerts page.", "action": {"type": "navigate", "page": "safety", "params": {}}}
    if any(w in msg for w in ["go home", "main page", "homepage"]):
        return {"reply": "Going to Home page.", "action": {"type": "navigate", "page": "home", "params": {}}}

    # ── Hotel queries ────────────────────────────────────────────────────────
    hotel_city = None
    for city in ["kathmandu", "pokhara", "chitwan", "everest", "annapurna", "lumbini", "patan", "bhaktapur"]:
        if city in msg:
            hotel_city = city
            break

    if hotel_city and any(w in msg for w in ["hotel", "stay", "accommodation", "lodge", "resort", "where to stay"]):
        hotels = HOTELS.get(hotel_city, [])
        if not hotels:
            return {"reply": f"No hotels listed for {hotel_city.title()} on this website.", "action": None}
        # Budget filter
        if any(w in msg for w in ["cheap", "budget", "affordable", "low cost"]):
            hotels = sorted(hotels, key=lambda h: h["price"])[:2]
        elif any(w in msg for w in ["luxury", "best", "top", "5 star", "five star"]):
            hotels = sorted(hotels, key=lambda h: -h["rating"])[:2]
        else:
            hotels = sorted(hotels, key=lambda h: -h["rating"])[:3]
        lines = [f"**{h['name']}** — ★{h['rating']}, {h['stars']}★, ${h['price']}/night ({h['amenities']})" for h in hotels]
        return {"reply": f"Hotels in {hotel_city.title()}:\n" + "\n".join(lines), "action": None}

    # Generic hotel query
    if any(w in msg for w in ["best hotel", "top hotel", "recommend hotel", "hotel recommendation"]):
        top = [
            "**Dwarika's Hotel** (Kathmandu) — ★4.9, 5★, $350/night",
            "**Meghauli Serai Taj** (Chitwan) — ★4.9, 5★, $450/night",
            "**Fish Tail Lodge** (Pokhara) — ★4.8, 4★, $180/night",
        ]
        return {"reply": "Top rated hotels on this website:\n" + "\n".join(top), "action": None}

    # ── Guide queries ────────────────────────────────────────────────────────
    if any(w in msg for w in ["guide", "trekking guide", "local guide", "hire guide", "best guide"]):
        # Specialty filter
        if any(w in msg for w in ["everest", "high altitude", "khumbu"]):
            g = next((x for x in GUIDES if "Everest" in x["spec"]), GUIDES[0])
        elif any(w in msg for w in ["cultural", "kathmandu", "temple", "heritage"]):
            g = next((x for x in GUIDES if "Cultural" in x["spec"]), GUIDES[1])
        elif any(w in msg for w in ["annapurna", "pokhara", "bird"]):
            g = next((x for x in GUIDES if "Annapurna" in x["spec"]), GUIDES[2])
        elif any(w in msg for w in ["chitwan", "wildlife", "safari"]):
            g = next((x for x in GUIDES if "wildlife" in x["spec"]), GUIDES[3])
        elif any(w in msg for w in ["buddhist", "meditation", "pilgrimage"]):
            g = next((x for x in GUIDES if "Buddhist" in x["spec"]), GUIDES[4])
        elif any(w in msg for w in ["langtang", "tamang"]):
            g = next((x for x in GUIDES if "Langtang" in x["spec"]), GUIDES[5])
        elif any(w in msg for w in ["french", "german"]):
            g = next((x for x in GUIDES if "French" in x["langs"]), GUIDES[1])
        elif any(w in msg for w in ["spanish"]):
            g = next((x for x in GUIDES if "Spanish" in x["langs"]), GUIDES[2])
        elif any(w in msg for w in ["chinese", "tibetan"]):
            g = next((x for x in GUIDES if "Chinese" in x["langs"]), GUIDES[4])
        else:
            g = max(GUIDES, key=lambda x: x["rating"])
        return {"reply": f"**{g['name']}** — ★{g['rating']}, {g['exp']} yrs exp, ${g['price']}/day\nSpecialty: {g['spec']}\nLanguages: {g['langs']}", "action": None}

    # ── Destination queries ──────────────────────────────────────────────────
    # Specific destination lookups
    dest_keywords = {
        "everest": "Everest Base Camp", "ebc": "Everest Base Camp", "base camp": "Everest Base Camp",
        "annapurna circuit": "Annapurna Circuit", "annapurna": "Annapurna Circuit",
        "poon hill": "Poon Hill", "ghorepani": "Poon Hill",
        "langtang": "Langtang Valley",
        "pokhara": "Pokhara Lakeside",
        "chitwan": "Chitwan National Park",
        "rara": "Rara Lake", "rara lake": "Rara Lake",
        "upper mustang": "Upper Mustang", "mustang": "Upper Mustang",
        "lumbini": "Lumbini",
        "boudhanath": "Boudhanath Stupa", "bouddha": "Boudhanath Stupa",
        "pashupatinath": "Pashupatinath Temple",
        "nagarkot": "Nagarkot Sunrise",
        "patan": "Patan Durbar Square",
        "bhaktapur": "Bhaktapur Durbar Square",
        "bardia": "Bardia National Park",
    }
    matched_dest = None
    for kw, dname in dest_keywords.items():
        if kw in msg:
            matched_dest = next((d for d in DESTINATIONS if d["name"] == dname), None)
            break

    if matched_dest:
        d = matched_dest
        parts = [f"**{d['name']}** — ★{d['rating']}, {d['cat']}"]
        if d.get("duration"): parts.append(f"Duration: {d['duration']}")
        if d.get("diff"): parts.append(f"Difficulty: {d['diff']}")
        if d.get("alt"): parts.append(f"Altitude: {d['alt']}")
        parts.append(f"Entry: {d['fee']} | Best time: {d['best']}")
        return {"reply": "\n".join(parts), "action": None}

    # ── Trek recommendations ─────────────────────────────────────────────────
    if any(w in msg for w in ["easy trek", "beginner trek", "short trek"]):
        return {"reply": "Best easy treks on this website:\n• **Poon Hill** — 4-5 days, 3210m, ★4.8\n• **Langtang Valley** — 7-10 days, 3430m, ★4.7\n• **Chitwan** — wildlife safari, no trekking required", "action": None}

    if any(w in msg for w in ["hard trek", "challenging trek", "difficult trek", "strenuous"]):
        return {"reply": "Challenging treks on this website:\n• **Everest Base Camp** — 12-14 days, 5364m, ★4.9\n• **Annapurna Circuit** — 14-21 days, 5416m, ★4.8\n• **Upper Mustang** — 10-14 days, $500 permit, ★4.9\n• **Rara Lake** — 6-8 days, 2990m, remote, ★4.9", "action": None}

    if any(w in msg for w in ["trek", "trekking", "hiking", "trail"]):
        treks = [d for d in DESTINATIONS if d["cat"] == "Trekking"]
        lines = [f"• **{t['name']}** — {t.get('duration','')}, {t.get('diff','')}, ★{t['rating']}, Best: {t['best']}" for t in treks]
        return {"reply": "Treks available on this website:\n" + "\n".join(lines), "action": None}

    # ── Wildlife ─────────────────────────────────────────────────────────────
    if any(w in msg for w in ["wildlife", "safari", "rhino", "tiger", "elephant", "jungle"]):
        return {"reply": "Wildlife destinations:\n• **Chitwan National Park** — ★4.7, $25 entry, Best: Oct-Mar. One-horned rhinos, Bengal tigers, elephants.\n• **Bardia National Park** — ★4.8, $15 entry, Best: Oct-Mar. Less crowded, high tiger density.", "action": None}

    # ── Best time ────────────────────────────────────────────────────────────
    if any(w in msg for w in ["best time", "when to visit", "season", "weather", "when should"]):
        return {"reply": "Best times to visit Nepal:\n• **Oct-Nov** — Best overall. Clear skies, perfect for all treks.\n• **Mar-May** — Spring. Rhododendrons bloom, great for EBC.\n• **Dec-Feb** — Cold, uncrowded, good for Chitwan & cultural tours.\n• **Jun-Sep** — Monsoon. Avoid trekking.", "action": None}

    # ── Visa ─────────────────────────────────────────────────────────────────
    if any(w in msg for w in ["visa", "permit", "entry"]):
        return {"reply": "Nepal visa on arrival: 15-day $30, 30-day $50, 90-day $125.\nTrekking permits: TIMS card ~$20. Everest region: Sagarmatha NP permit. Upper Mustang: $500/10 days.", "action": None}

    # ── Cost / Budget ────────────────────────────────────────────────────────
    if any(w in msg for w in ["how much", "cost", "price", "budget", "expensive", "cheap"]):
        return {"reply": "Nepal trip costs (per day):\n• Budget: $30-50/day (guesthouses, dal bhat)\n• Mid-range: $75-120/day (3-4★ hotels, guided tours)\n• Luxury: $200+/day (5★ hotels, private guides)\n\nUse the Trip Cost Estimator for exact figures.", "action": None}

    # ── Greetings ────────────────────────────────────────────────────────────
    if any(w in msg for w in ["hello", "hi", "hey", "namaste"]):
        return {"reply": "Namaste! Ask me about destinations, hotels, guides, treks, or costs — I'll give you direct answers from our website.", "action": None}

    if any(w in msg for w in ["thank", "thanks"]):
        return {"reply": "You're welcome! Safe travels in Nepal.", "action": None}

    # ── Top recommendations ──────────────────────────────────────────────────
    if any(w in msg for w in ["recommend", "best", "top", "popular", "must visit", "must see"]):
        return {"reply": "Top picks on this website:\n• **Everest Base Camp** ★4.9 — ultimate trek\n• **Rara Lake** ★4.9 — hidden gem\n• **Upper Mustang** ★4.9 — forbidden kingdom\n• **Dwarika's Hotel** ★4.9 — best hotel\n• **Pemba Sherpa** ★4.9 — best guide ($80/day)", "action": None}

    # ── Fallback ─────────────────────────────────────────────────────────────
    return {
        "reply": "I can answer about: destinations, hotels (with prices), guides (with rates), treks, best time to visit, visa, and costs. What do you need?",
        "action": None
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def ai_chat(request):
    message = request.data.get("message", "").strip()
    history = request.data.get("history", [])
    if not message:
        return Response({"error": "Message is required"}, status=400)
    try:
        result = _nepal_chat_engine(message, history)
        return Response(result)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    msg = message.lower().strip()
    action = None

    # ── Navigation intents ──────────────────────────────────────────────────
    if any(w in msg for w in ["ai itinerary", "itinerary planner", "ai plan", "generate itinerary", "create plan"]):
        action = {"type": "navigate", "page": "ai-itinerary", "params": {}}
        return {"reply": "Opening the AI Itinerary Planner for you! You can describe your trip and our AI will build a personalised day-by-day plan.", "action": action}

    if any(w in msg for w in ["budget", "cost estimator", "trip cost", "estimate cost", "how much will"]):
        action = {"type": "navigate", "page": "estimator", "params": {}}
        return {"reply": "Opening the Trip Cost Estimator! Enter your destination, duration and travel style to get an instant budget breakdown.", "action": action}

    if any(w in msg for w in ["interactive map", "map", "show map", "view map"]):
        action = {"type": "navigate", "page": "interactive-map", "params": {}}
        return {"reply": "Opening the Interactive Map! Explore Nepal's destinations, treks and points of interest visually.", "action": action}

    if any(w in msg for w in ["destination", "places to visit", "attractions", "sightseeing"]):
        action = {"type": "navigate", "page": "destinations", "params": {}}
        return {"reply": "Taking you to Destinations! Browse mountains, temples, national parks and hidden gems across Nepal.", "action": action}

    if any(w in msg for w in ["hotel", "accommodation", "stay", "lodge", "resort", "hostel"]):
        action = {"type": "navigate", "page": "hotels", "params": {}}
        return {"reply": "Opening Hotels & Accommodation! Find everything from budget guesthouses to luxury resorts.", "action": action}

    if any(w in msg for w in ["guide", "local guide", "trekking guide", "hire guide"]):
        action = {"type": "navigate", "page": "guides", "params": {}}
        return {"reply": "Taking you to our Local Guides! Browse certified, experienced guides for treks and city tours.", "action": action}

    if any(w in msg for w in ["transport", "bus", "flight", "jeep", "vehicle", "travel route", "how to get"]):
        action = {"type": "navigate", "page": "transport", "params": {}}
        return {"reply": "Opening Transportation! Find flights, buses and jeep routes between major destinations in Nepal.", "action": action}

    if any(w in msg for w in ["safety", "alert", "emergency", "insurance", "safe to visit"]):
        action = {"type": "navigate", "page": "safety", "params": {}}
        return {"reply": "Opening Safety & Alerts! Check current travel advisories, emergency contacts and trekking safety tips.", "action": action}

    if any(w in msg for w in ["search", "find", "look for"]):
        action = {"type": "navigate", "page": "search", "params": {}}
        return {"reply": "Opening Search! Type any destination, hotel or activity to find exactly what you need.", "action": action}

    if any(w in msg for w in ["home", "main page", "homepage", "go back", "start"]):
        action = {"type": "navigate", "page": "home", "params": {}}
        return {"reply": "Taking you back to the Home page!", "action": action}

    # ── Greetings ───────────────────────────────────────────────────────────
    if any(w in msg for w in ["hello", "hi", "hey", "namaste", "greetings", "good morning", "good evening"]):
        return {"reply": "Namaste! Welcome to NepalWander, your smart tourism guide. I can help you explore Nepal, plan trips, find hotels, guides, transport and much more. What would you like to discover today?", "action": None}

    if any(w in msg for w in ["thank", "thanks", "thank you", "dhanyabad", "shukriya"]):
        return {"reply": "You are most welcome! Enjoy your Nepal adventure. Feel free to ask anything else.", "action": None}

    if any(w in msg for w in ["bye", "goodbye", "see you", "farewell"]):
        return {"reply": "Goodbye! Have a wonderful journey through Nepal. Namaste!", "action": None}

    # ── About the platform ──────────────────────────────────────────────────
    if any(w in msg for w in ["what is nepalwander", "about this site", "about the website", "what does this site do", "who made", "about tourtech"]):
        return {"reply": "NepalWander is a smart tourism platform built to help travellers explore Nepal with ease. Features include AI-powered itinerary planning, an interactive map, hotel and guide booking, cost estimation, multilingual support and real-time safety alerts. We cover everything from Everest Base Camp to Chitwan jungle safaris.", "action": None}

    # ── Nepal overview ──────────────────────────────────────────────────────
    if any(w in msg for w in ["tell me about nepal", "what is nepal", "nepal overview", "nepal country", "nepal facts"]):
        return {"reply": "Nepal is a landlocked country in South Asia nestled between India and China. It is home to eight of the world's fourteen highest peaks, including Mount Everest (8,849 m). Nepal offers incredible trekking, rich Hindu and Buddhist culture, ancient temples, lush jungles with wildlife safaris and warm hospitality. Kathmandu is the capital city.", "action": None}

    # ── Best time to visit ──────────────────────────────────────────────────
    if any(w in msg for w in ["best time", "when to visit", "weather", "season", "when should i go"]):
        return {"reply": "The best times to visit Nepal are:\n• **Oct–Nov (Autumn)** — Clear skies, perfect for trekking and mountain views.\n• **Mar–May (Spring)** — Rhododendrons in bloom, great for Everest Base Camp.\n• **Dec–Feb (Winter)** — Cold but uncrowded; good for lower altitude tours.\n• **Jun–Sep (Monsoon)** — Lush green landscapes but heavy rain; not ideal for treks.\nOverall, October is the most popular month.", "action": None}

    # ── Visa and permits ────────────────────────────────────────────────────
    if any(w in msg for w in ["visa", "entry requirement", "permit", "tims", "nar phu permit"]):
        return {"reply": "**Visa:** Most nationalities get a Nepal visa on arrival at Tribhuvan International Airport or at land border crossings. A 15-day visa costs USD 30, 30-day USD 50, and 90-day USD 125.\n\n**Trekking Permits:**\n• TIMS Card — required for most treks (~USD 20)\n• ACAP/MCAP — Annapurna/Manaslu Conservation Area Permit\n• Sagarmatha National Park permit for Everest region\n• Restricted Area Permits for Upper Mustang, Dolpo and Nar-Phu (USD 500+ per week)", "action": None}

    # ── Everest Base Camp ───────────────────────────────────────────────────
    if any(w in msg for w in ["everest", "ebc", "base camp", "sagarmatha", "khumbu"]):
        return {"reply": "**Everest Base Camp Trek (EBC)**\n• Duration: 12–14 days from Lukla\n• Max altitude: 5,364 m at Base Camp; Kala Patthar 5,545 m\n• Start: Fly Kathmandu → Lukla (35 min)\n• Highlights: Namche Bazaar, Tengboche Monastery, Khumbu Icefall views, Sherpa culture\n• Best season: Oct–Nov, Mar–May\n• Approximate cost: USD 1,500–3,000 (guide, permits, lodge)\n\nWould you like me to open the AI Itinerary Planner to build your EBC plan?", "action": None}

    # ── Annapurna ───────────────────────────────────────────────────────────
    if any(w in msg for w in ["annapurna", "abc trek", "annapurna circuit", "poon hill"]):
        return {"reply": "**Annapurna Treks**\n• **Annapurna Base Camp (ABC):** 7–10 days, 4,130 m, stunning amphitheatre of peaks.\n• **Annapurna Circuit:** 14–21 days, crosses Thorong La Pass (5,416 m).\n• **Poon Hill:** 4–5 days, easy, amazing sunrise viewpoint at 3,210 m.\n• Start from Pokhara (most routes).\n• Best season: Oct–Nov, Mar–May\n\nShall I open the Itinerary Planner or Cost Estimator for Annapurna?", "action": None}

    # ── Pokhara ─────────────────────────────────────────────────────────────
    if any(w in msg for w in ["pokhara", "phewa lake", "sarangkot", "paragliding pokhara"]):
        return {"reply": "**Pokhara** is Nepal's adventure capital and second largest city.\n• **Phewa Lake** — rowboat rides and Tal Barahi Temple island\n• **Sarangkot** — sunrise views of Annapurna and Dhaulagiri\n• **Paragliding** — one of the world's top paragliding destinations\n• **Davis Falls & Gupteswar Cave** — unique natural attractions\n• **World Peace Pagoda** — hilltop stupa with panoramic views\nPokhara is 200 km from Kathmandu (6 hr bus or 25 min flight).", "action": None}

    # ── Kathmandu ───────────────────────────────────────────────────────────
    if any(w in msg for w in ["kathmandu", "pashupatinath", "boudhanath", "swayambhunath", "durbar square", "monkey temple"]):
        return {"reply": "**Kathmandu** — Nepal's vibrant capital with UNESCO World Heritage Sites:\n• **Pashupatinath Temple** — sacred Hindu cremation ghats on the Bagmati River\n• **Boudhanath Stupa** — massive Buddhist stupa, spiritual hub for Tibetans\n• **Swayambhunath (Monkey Temple)** — ancient stupa with city panoramas\n• **Kathmandu Durbar Square** — royal palace and medieval temples\n• **Patan & Bhaktapur** — beautifully preserved Newari cities nearby\nKathmandu also serves as the gateway for most Himalayan treks.", "action": None}

    # ── Chitwan ─────────────────────────────────────────────────────────────
    if any(w in msg for w in ["chitwan", "jungle safari", "rhino", "elephant", "national park", "wildlife"]):
        return {"reply": "**Chitwan National Park** (UNESCO World Heritage)\n• Famous for one-horned rhinoceros, Bengal tiger, gharial crocodiles and elephants\n• Activities: Jeep safari, canoe ride, elephant bathing, jungle walk, birdwatching (543+ species)\n• Location: Terai lowlands, 150 km from Kathmandu (5–6 hr bus)\n• Best time: Oct–Apr (dry season for wildlife sightings)\n• Stay in Sauraha village — many lodges at various budgets", "action": None}

    # ── Lumbini ─────────────────────────────────────────────────────────────
    if any(w in msg for w in ["lumbini", "buddha", "birthplace", "pilgrimage", "monasteries"]):
        return {"reply": "**Lumbini** is the birthplace of Siddhartha Gautama (the Buddha) and a UNESCO World Heritage Site.\n• The Sacred Garden contains the Maya Devi Temple and the exact birth spot marked by the Ashoka Pillar (249 BC)\n• Dozens of monasteries built by countries worldwide (Thailand, Japan, China, Myanmar, etc.)\n• Location: Western Terai, 22 km from Bhairahawa\n• How to get there: Fly Kathmandu → Bhairahawa (55 min) then taxi/bus", "action": None}

    # ── Langtang ────────────────────────────────────────────────────────────
    if any(w in msg for w in ["langtang", "gosaikunda", "helambu"]):
        return {"reply": "**Langtang Valley Trek**\n• Duration: 7–10 days from Syabrubesi\n• Highlights: Langtang Village, Kyanjin Gompa, Tsergo Ri (4,984 m), yak cheese farms\n• Accessible from Kathmandu by bus (7–8 hr)\n• Also connects to Gosaikunda sacred alpine lakes and Helambu circuit\n• Best season: Oct–Nov, Mar–May", "action": None}

    # ── Manaslu ─────────────────────────────────────────────────────────────
    if any(w in msg for w in ["manaslu", "manaslu circuit"]):
        return {"reply": "**Manaslu Circuit Trek**\n• Duration: 14–18 days\n• Highlights: Crosses Larkya La Pass (5,160 m), remote villages, Tibetan culture, Manaslu (8,163 m) views\n• Restricted area — requires special permit (~USD 100/week Oct–Nov)\n• Best season: Oct–Nov, Mar–May\n• Start from Soti Khola (6–7 hr drive from Kathmandu)", "action": None}

    # ── Upper Mustang ────────────────────────────────────────────────────────
    if any(w in msg for w in ["mustang", "upper mustang", "lo manthang", "forbidden kingdom"]):
        return {"reply": "**Upper Mustang — The Forbidden Kingdom**\n• Restricted area permit: USD 500 for 10 days (one of the most expensive in Nepal)\n• Highlights: Lo Manthang walled city, ancient cave monasteries, lunar landscapes, Tibetan culture\n• Duration: 10–14 days from Jomsom\n• Jomsom is accessible by flight from Pokhara (20 min) or a multi-day trek\n• Best time: May–Oct (rain shadow keeps it drier in monsoon)", "action": None}

    # ── Rara Lake ───────────────────────────────────────────────────────────
    if any(w in msg for w in ["rara", "rara lake", "mugu"]):
        return {"reply": "**Rara Lake** is Nepal's largest lake at 2,990 m altitude, set in a remote national park in Mugu district.\n• Crystal-clear blue water, pristine wilderness, red pandas and Himalayan wildlife\n• Accessible by flight from Kathmandu to Talcha Airport then 1–2 day trek\n• Duration: 6–8 day trek circuit\n• Best season: Oct–Nov, Mar–May\n• Very few tourists — a true off-the-beaten-path gem", "action": None}

    # ── Trekking general ────────────────────────────────────────────────────
    if any(w in msg for w in ["trek", "trekking", "hiking", "trail", "mountain"]):
        return {"reply": "Nepal offers some of the world's best trekking. Popular routes:\n• **Everest Base Camp** (12–14 days) — the classic Himalayan experience\n• **Annapurna Circuit** (14–21 days) — diverse landscapes and culture\n• **Annapurna Base Camp** (7–10 days) — mountain amphitheatre\n• **Langtang Valley** (7–10 days) — closest major trek to Kathmandu\n• **Poon Hill** (4–5 days) — easy sunrise trek from Pokhara\n• **Manaslu Circuit** (14–18 days) — remote and adventurous\n\nWant me to open the AI Itinerary Planner to design your trek?", "action": None}

    # ── Adventure / Paragliding ─────────────────────────────────────────────
    if any(w in msg for w in ["paragliding", "bungee", "rafting", "zip line", "adventure", "extreme sport", "skydiving"]):
        return {"reply": "Nepal is an adventure paradise!\n• **Paragliding** — Pokhara is world-renowned; 30-min flights over Phewa Lake with Himalayan backdrop\n• **White-water Rafting** — Trishuli, Seti, Kali Gandaki and Bhote Koshi rivers\n• **Bungee Jumping** — The Last Resort near the Tibet border (160 m drop!)\n• **Zip-lining** — Pokhara Zip Flyer (1.8 km long, drops 600 m)\n• **Mountain Biking** — Kathmandu Valley and Mustang trails\n• **Rock Climbing** — Nagarjun Forest and Hattiban areas", "action": None}

    # ── Budget / Cost ───────────────────────────────────────────────────────
    if any(w in msg for w in ["how much", "price", "cost", "expensive", "cheap", "money", "dollar", "rupee", "nrs"]):
        days = 10
        budget_ranges = {
            "budget": days * 30,
            "mid_range": days * 75,
            "luxury": days * 200
        }
        return {"reply": f"Approximate costs for a {days}-day Nepal trip:\n• **Budget traveller:** USD {budget_ranges['budget']} (~$30/day) — guesthouses, dal bhat, local buses\n• **Mid-range:** USD {budget_ranges['mid_range']} (~$75/day) — comfortable hotels, guided tours, domestic flights\n• **Luxury:** USD {budget_ranges['luxury']}+ (~$200/day) — boutique hotels, private guides, helicopter tours\n\nFor a precise estimate, open the Trip Cost Estimator. Want me to take you there?", "action": None}

    # ── Food and culture ────────────────────────────────────────────────────
    if any(w in msg for w in ["food", "eat", "cuisine", "dal bhat", "momo", "thakali", "restaurant", "culture", "festival", "dashain", "tihar", "holi"]):
        return {"reply": "**Nepal Food & Culture**\n\nMust-try foods:\n• **Dal Bhat** — lentil soup with rice, the national dish, eaten twice daily\n• **Momo** — steamed or fried dumplings, hugely popular\n• **Thakali Set** — buckwheat or millet dishes from Mustang region\n• **Sel Roti** — sweet rice doughnut, popular during festivals\n• **Yak cheese & butter tea** — in mountain teahouses\n\nKey festivals:\n• **Dashain** (Oct) — biggest Hindu festival, 15 days\n• **Tihar** (Oct/Nov) — festival of lights, similar to Diwali\n• **Holi** (Feb/Mar) — colourful spring festival\n• **Buddha Jayanti** (May) — Buddha birth anniversary in Lumbini\n• **Indra Jatra** (Sep) — Kathmandu chariot festival", "action": None}

    # ── Currency / Money ────────────────────────────────────────────────────
    if any(w in msg for w in ["currency", "exchange rate", "atm", "cash", "payment method"]):
        return {"reply": "**Nepal Currency:** Nepalese Rupee (NPR / NRS)\n• Approx exchange rate: 1 USD = 133 NPR (rates vary)\n• ATMs are widely available in Kathmandu, Pokhara and major towns\n• Cards accepted in larger hotels and restaurants in cities\n• **Carry cash** in rural areas and on treks — teahouses rarely accept cards\n• Currency exchange at the airport, banks and authorised money changers\n• Indian currency (except 500 and 1000 INR notes) is accepted in many places", "action": None}

