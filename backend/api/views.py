from django.db.models import Q, Sum
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
    NewsletterSubscriber, BookingLog, Payment, Refund, VisitHistory
)
from .serializers import (
    CategorySerializer, DestinationSerializer, HotelSerializer, GuideSerializer,
    ReviewSerializer, SafetyAlertSerializer, EmergencyContactSerializer,
    FavoriteSerializer, TripPlanSerializer, RegisterSerializer,
    UserSerializer, NewsletterSerializer, BookingLogSerializer,
    PaymentSerializer, RefundSerializer, VisitHistorySerializer
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

    if request.method == "POST":
        s = FavoriteSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        fav = s.save(user=request.user)
        item = fav.destination or fav.hotel or fav.guide
        BookingLog.objects.create(
            action="save_dest",
            user=request.user,
            email=request.user.email,
            item_name=item.name if item else "Favourite",
            ip_address=get_ip(request),
            extra_data={"favourite_id": fav.id, "type": fav.content_type},
        )
        return Response(FavoriteSerializer(fav).data, status=201)

    ct = request.data.get("content_type")
    item_id = request.data.get("id")
    filter_data = {"user": request.user, "content_type": ct}
    if ct == "destination" and item_id:
        filter_data["destination_id"] = item_id
    elif ct == "hotel" and item_id:
        filter_data["hotel_id"] = item_id
    elif ct == "guide" and item_id:
        filter_data["guide_id"] = item_id
    deleted, _ = Favorite.objects.filter(**filter_data).delete()
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

    # Create booking log
    booking = BookingLog.objects.create(
        action=action_type,
        status="confirmed",
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

    # Create payment record
    payment = Payment.objects.create(
        user=request.user,
        booking=booking,
        method=method,
        amount=amount,
        currency=data.get("currency", "USD"),
        status="completed",
        transaction_id=str(uuid.uuid4())[:16].upper(),
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
