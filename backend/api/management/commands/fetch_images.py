from django.core.management.base import BaseCommand
from api.views import populate_images


class Command(BaseCommand):
    help = "Fetch Unsplash images for all Destinations and Hotels with empty image fields"

    def handle(self, *args, **kwargs):
        self.stdout.write("Fetching images...")
        populate_images()
        self.stdout.write(self.style.SUCCESS("Done."))
