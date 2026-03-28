from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_visithistory_guide'),
    ]

    operations = [
        migrations.AddField(
            model_name='favorite',
            name='item_name',
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.AlterField(
            model_name='favorite',
            name='content_type',
            field=models.CharField(choices=[('destination', 'Destination'), ('hotel', 'Hotel'), ('guide', 'Guide'), ('transport', 'Transport')], max_length=20),
        ),
    ]
