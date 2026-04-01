from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=10, default="🏔️")

    def __str__(self): return self.name


class Destination(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default="Nepal")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="destinations")
    rating = models.FloatField(default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    entry_fee = models.FloatField(default=0)
    currency = models.CharField(max_length=10, default="USD")
    best_time_to_visit = models.CharField(max_length=100, blank=True)
    short_description = models.TextField(blank=True)
    description = models.TextField(blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    image = models.URLField(max_length=500, blank=True)
    image_credit_name = models.CharField(max_length=255, blank=True)
    image_credit_link = models.URLField(max_length=500, blank=True)
    altitude = models.CharField(max_length=50, blank=True)
    difficulty = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self): return self.name

    def update_rating(self):
        reviews = self.reviews.all()
        if reviews.exists():
            self.rating = round(sum(r.rating for r in reviews) / reviews.count(), 1)
            self.save(update_fields=["rating"])


class Hotel(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name="hotels")
    description = models.TextField(blank=True)
    rating = models.FloatField(default=0)
    stars = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    price_per_night = models.FloatField()
    has_wifi = models.BooleanField(default=True)
    has_pool = models.BooleanField(default=False)
    has_gym = models.BooleanField(default=False)
    has_restaurant = models.BooleanField(default=True)
    has_parking = models.BooleanField(default=False)
    has_spa = models.BooleanField(default=False)
    address = models.CharField(max_length=300, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    image = models.URLField(max_length=500, blank=True)
    image_credit_name = models.CharField(max_length=255, blank=True)
    image_credit_link = models.URLField(max_length=500, blank=True)

    def __str__(self): return self.name


class Guide(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    rating = models.FloatField(default=0)
    years_experience = models.IntegerField(default=1)
    price_per_day = models.FloatField()
    specialties = models.TextField(blank=True)
    languages = models.CharField(max_length=300, blank=True)
    is_certified = models.BooleanField(default=False)
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    image = models.URLField(max_length=500, blank=True)
    destinations = models.ManyToManyField(Destination, blank=True, related_name="guides")

    def __str__(self): return self.name


class Review(models.Model):
    CONTENT_TYPES = [("destination", "Destination"), ("hotel", "Hotel"), ("guide", "Guide")]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES)
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, null=True, blank=True, related_name="reviews")
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, null=True, blank=True, related_name="reviews")
    guide = models.ForeignKey(Guide, on_delete=models.CASCADE, null=True, blank=True, related_name="reviews")
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self): return f"{self.user.username} — {self.rating}★"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.destination:
            self.destination.update_rating()


class SafetyAlert(models.Model):
    LEVELS = [("low", "Low"), ("medium", "Medium"), ("high", "High"), ("critical", "Critical")]
    title = models.CharField(max_length=200)
    level = models.CharField(max_length=20, choices=LEVELS, default="medium")
    description = models.TextField()
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name="alerts", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self): return self.title


class EmergencyContact(models.Model):
    SERVICE_TYPES = [("police","Police"),("tourist_police","Tourist Police"),("ambulance","Ambulance"),("fire","Fire"),("hospital","Hospital")]
    name = models.CharField(max_length=200)
    service_type = models.CharField(max_length=30, choices=SERVICE_TYPES)
    phone = models.CharField(max_length=30)
    address = models.CharField(max_length=300, blank=True)
    available_24h = models.BooleanField(default=True)

    def __str__(self): return self.name


class Favorite(models.Model):
    TYPES = [("destination","Destination"),("hotel","Hotel"),("guide","Guide"),("transport","Transport")]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    content_type = models.CharField(max_length=20, choices=TYPES)
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, null=True, blank=True)
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, null=True, blank=True)
    guide = models.ForeignKey(Guide, on_delete=models.CASCADE, null=True, blank=True)
    item_name = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [
            ("user","content_type","destination"),
            ("user","content_type","hotel"),
            ("user","content_type","guide"),
        ]


class TripPlan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="trip_plans")
    title = models.CharField(max_length=200)
    mood = models.CharField(max_length=50, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    destinations = models.ManyToManyField(Destination, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self): return f"{self.user.username} — {self.title}"


class WeatherCache(models.Model):
    city = models.CharField(max_length=100, unique=True)
    data = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): return self.city


class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self): return self.email


class BookingLog(models.Model):
    ACTION_TYPES = [
        ("book_hotel",  "Book Hotel"),
        ("book_guide",  "Book Guide"),
        ("book_transport", "Book Transport"),
        ("save_dest",   "Save Destination"),
        ("subscribe",   "Newsletter Subscribe"),
        ("contact",     "Contact Form"),
    ]
    STATUS_CHOICES = [
        ("pending",   "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
        ("refunded",  "Refunded"),
    ]
    action      = models.CharField(max_length=30, choices=ACTION_TYPES)
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    user        = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="booking_logs")
    email       = models.EmailField(blank=True)
    item_name   = models.CharField(max_length=300, blank=True)
    item_id     = models.IntegerField(null=True, blank=True)
    amount      = models.FloatField(default=0)
    currency    = models.CharField(max_length=10, default="USD")
    payment_method = models.CharField(max_length=30, blank=True)
    extra_data  = models.JSONField(default=dict, blank=True)
    ip_address  = models.GenericIPAddressField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        who = self.user.username if self.user else self.email or "anonymous"
        return f"{self.action} — {who} — {self.item_name}"


class Payment(models.Model):
    METHOD_CHOICES = [
        ("visa",       "Visa Card"),
        ("mastercard", "Mastercard"),
        ("esewa",      "eSewa"),
        ("khalti",     "Khalti"),
    ]
    STATUS_CHOICES = [
        ("pending",   "Pending"),
        ("completed", "Completed"),
        ("failed",    "Failed"),
        ("refunded",  "Refunded"),
    ]
    user           = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    booking        = models.OneToOneField(BookingLog, on_delete=models.CASCADE, related_name="payment", null=True, blank=True)
    method         = models.CharField(max_length=20, choices=METHOD_CHOICES)
    amount         = models.FloatField()
    currency       = models.CharField(max_length=10, default="USD")
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default="completed")
    transaction_id = models.CharField(max_length=100, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} — {self.method} — {self.amount} {self.currency}"


class Refund(models.Model):
    STATUS_CHOICES = [
        ("requested", "Requested"),
        ("approved",  "Approved"),
        ("rejected",  "Rejected"),
        ("processed", "Processed"),
    ]
    payment    = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="refunds")
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="refunds")
    reason     = models.TextField()
    amount     = models.FloatField()
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default="requested")
    admin_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Refund #{self.id} — {self.user.username} — {self.status}"


class VisitHistory(models.Model):
    TYPES = [("destination","Destination"),("hotel","Hotel"),("guide","Guide"),("transport","Transport")]
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name="visit_history")
    content_type = models.CharField(max_length=20, choices=TYPES)
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, null=True, blank=True)
    hotel       = models.ForeignKey(Hotel, on_delete=models.CASCADE, null=True, blank=True)
    guide       = models.ForeignKey(Guide, on_delete=models.CASCADE, null=True, blank=True)
    item_name   = models.CharField(max_length=300, blank=True)
    visited_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-visited_at"]

    def __str__(self):
        return f"{self.user.username} visited {self.item_name}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ("booking_pending",   "Booking Pending"),
        ("booking_confirmed", "Booking Confirmed"),
        ("booking_cancelled", "Booking Cancelled"),
        ("booking_refunded",  "Booking Refunded"),
        ("new_booking",       "New Booking (Admin)"),
        ("refund_requested",  "Refund Requested (Admin)"),
        ("general",           "General"),
    ]
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    is_admin   = models.BooleanField(default=False)  # True = shown to all admins
    type       = models.CharField(max_length=30, choices=TYPE_CHOICES, default="general")
    title      = models.CharField(max_length=300)
    message    = models.TextField()
    booking    = models.ForeignKey(BookingLog, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{'[ADMIN] ' if self.is_admin else ''}{self.title}"
