"""
Django management command to seed the database with real Nepal tourism data.
Usage: python manage.py seed_db
"""
from django.core.management.base import BaseCommand
import subprocess, sys, os

class Command(BaseCommand):
    help = "Seed database with real Nepal tourism data and Unsplash images"

    def handle(self, *args, **options):
        seed_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "seed_real.py")
        self.stdout.write("🌱 Running seed script...")
        exec(open(seed_path, encoding="utf-8").read())
