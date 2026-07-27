from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class CarMake(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class CarModel(models.Model):
    SEDAN = "SEDAN"
    SUV = "SUV"
    WAGON = "WAGON"
    COUPE = "COUPE"
    CONVERTIBLE = "CONVERTIBLE"
    HATCHBACK = "HATCHBACK"
    MINIVAN = "MINIVAN"
    PICKUP = "PICKUP"
    SPORTS = "SPORTS"
    ELECTRIC = "ELECTRIC"

    CAR_TYPES = [
        (SEDAN, "Sedan"),
        (SUV, "SUV"),
        (WAGON, "Wagon"),
        (COUPE, "Coupe"),
        (CONVERTIBLE, "Convertible"),
        (HATCHBACK, "Hatchback"),
        (MINIVAN, "Minivan"),
        (PICKUP, "Pickup Truck"),
        (SPORTS, "Sports Car"),
        (ELECTRIC, "Electric"),
    ]

    car_make = models.ForeignKey(
        CarMake,
        on_delete=models.CASCADE,
        related_name="models",
    )
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=15, choices=CAR_TYPES, default=SUV)
    year = models.IntegerField(
        default=2023,
        validators=[MinValueValidator(2015), MaxValueValidator(2023)],
    )

    class Meta:
        ordering = ["car_make__name", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["car_make", "name", "year"],
                name="unique_car_model_for_make_and_year",
            )
        ]

    def __str__(self):
        return f"{self.car_make.name} {self.name} ({self.year})"
