from .models import CarMake, CarModel


CAR_DATA = {
    "Audi": [
        ("A4", CarModel.SEDAN, 2022),
        ("Q5", CarModel.SUV, 2023),
    ],
    "BMW": [
        ("3 Series", CarModel.SEDAN, 2022),
        ("X5", CarModel.SUV, 2023),
    ],
    "Ford": [
        ("F-150", CarModel.PICKUP, 2023),
        ("Mustang", CarModel.SPORTS, 2022),
    ],
    "Honda": [
        ("Accord", CarModel.SEDAN, 2022),
        ("CR-V", CarModel.SUV, 2023),
    ],
    "Tesla": [
        ("Model 3", CarModel.ELECTRIC, 2023),
        ("Model Y", CarModel.ELECTRIC, 2023),
    ],
    "Toyota": [
        ("Camry", CarModel.SEDAN, 2022),
        ("RAV4", CarModel.SUV, 2023),
    ],
}


def initiate():
    """Populate a small deterministic set of makes and models."""
    for make_name, models in CAR_DATA.items():
        car_make, _ = CarMake.objects.get_or_create(
            name=make_name,
            defaults={"description": f"{make_name} vehicles"},
        )

        for model_name, car_type, year in models:
            CarModel.objects.get_or_create(
                car_make=car_make,
                name=model_name,
                year=year,
                defaults={"type": car_type},
            )
