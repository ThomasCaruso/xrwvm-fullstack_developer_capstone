from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="CarMake",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100, unique=True)),
                ("description", models.TextField(blank=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="CarModel",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("SEDAN", "Sedan"),
                            ("SUV", "SUV"),
                            ("WAGON", "Wagon"),
                            ("COUPE", "Coupe"),
                            ("CONVERTIBLE", "Convertible"),
                            ("HATCHBACK", "Hatchback"),
                            ("MINIVAN", "Minivan"),
                            ("PICKUP", "Pickup Truck"),
                            ("SPORTS", "Sports Car"),
                            ("ELECTRIC", "Electric"),
                        ],
                        default="SUV",
                        max_length=15,
                    ),
                ),
                (
                    "year",
                    models.IntegerField(
                        default=2023,
                        validators=[
                            MinValueValidator(2015),
                            MaxValueValidator(2023),
                        ],
                    ),
                ),
                (
                    "car_make",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="models",
                        to="djangoapp.carmake",
                    ),
                ),
            ],
            options={"ordering": ["car_make__name", "name"]},
        ),
        migrations.AddConstraint(
            model_name="carmodel",
            constraint=models.UniqueConstraint(
                fields=("car_make", "name", "year"),
                name="unique_car_model_for_make_and_year",
            ),
        ),
    ]
