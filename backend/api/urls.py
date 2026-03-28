from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register("destinations", views.DestinationViewSet, basename="destination")
router.register("hotels", views.HotelViewSet, basename="hotel")
router.register("guides", views.GuideViewSet, basename="guide")
router.register("categories", views.CategoryViewSet, basename="category")
router.register("safety-alerts", views.SafetyAlertViewSet, basename="safety-alert")
router.register("emergency-contacts", views.EmergencyContactViewSet, basename="emergency-contact")
router.register("trip-plans", views.TripPlanViewSet, basename="tripplan")

urlpatterns = [
    path("", include(router.urls)),

    # Auth
    path("auth/register/", views.register),
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/profile/", views.profile),

    # Reviews
    path("reviews/", views.submit_review),
    path("reviews/<int:pk>/", views.delete_review),
    path("my-reviews/", views.my_reviews),

    # Favorites
    path("favorites/", views.favorites),
    path("favorites/check/", views.check_favorite),

    # Visit History
    path("visit-history/", views.visit_history),

    # Payments & Refunds
    path("payments/", views.payments),
    path("refunds/", views.refunds),

    # Admin endpoints
    path("admin/booking-logs/", views.booking_logs),
    path("admin/payments/", views.all_payments),
    path("admin/refunds/", views.admin_refunds),
    path("admin/refunds/<int:pk>/", views.admin_refunds),
    path("admin/user-activity/", views.user_activity),

    # Search
    path("search/", views.search),

    # Utility
    path("weather/", views.weather),
    path("estimate-cost/", views.estimate_trip_cost),
    path("stats/", views.stats),

    # Newsletter & Contact
    path("newsletter/", views.newsletter_subscribe),
    path("contact/", views.contact),

    # Unsplash proxy
    path("unsplash/", views.unsplash_image),
]
