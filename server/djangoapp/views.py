import json
import logging

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from .models import CarMake, CarModel
from .populate import initiate
from .restapis import analyze_review_sentiments, get_request, post_review

logger = logging.getLogger(__name__)


def _json_body(request):
    if not request.body:
        return {}
    return json.loads(request.body.decode("utf-8"))


@csrf_exempt
@require_POST
def login_user(request):
    try:
        data = _json_body(request)
        username = data.get("userName", "").strip()
        password = data.get("password", "")
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse(
            {"userName": username, "error": "Invalid credentials"},
            status=401,
        )

    login(request, user)
    return JsonResponse(
        {
            "userName": user.username,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "status": "Authenticated",
        }
    )


@require_GET
def logout_request(request):
    logout(request)
    return JsonResponse({"userName": "", "status": "Logged out"})


@csrf_exempt
@require_POST
def registration(request):
    try:
        data = _json_body(request)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    username = data.get("userName", "").strip()
    password = data.get("password", "")
    first_name = data.get("firstName", "").strip()
    last_name = data.get("lastName", "").strip()
    email = data.get("email", "").strip()

    if not username or not password or not email:
        return JsonResponse(
            {"error": "Username, password, and email are required"},
            status=400,
        )

    if User.objects.filter(username=username).exists():
        return JsonResponse(
            {"userName": username, "error": "Already Registered"},
            status=409,
        )

    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse({"error": "Email already registered"}, status=409)

    user = User.objects.create_user(
        username=username,
        password=password,
        first_name=first_name,
        last_name=last_name,
        email=email,
    )
    login(request, user)

    return JsonResponse(
        {
            "userName": user.username,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "status": "Authenticated",
        },
        status=201,
    )


@require_GET
def get_cars(request):
    if not CarMake.objects.exists():
        initiate()

    cars = [
        {
            "CarModel": car_model.name,
            "CarMake": car_model.car_make.name,
            "CarType": car_model.get_type_display(),
            "CarYear": car_model.year,
        }
        for car_model in CarModel.objects.select_related("car_make")
    ]
    return JsonResponse({"CarModels": cars})


@require_GET
def get_dealerships(request, state="All"):
    endpoint = "/fetchDealers" if state.lower() == "all" else f"/fetchDealers/{state}"
    try:
        dealerships = get_request(endpoint)
        return JsonResponse({"status": 200, "dealers": dealerships})
    except Exception as error:
        logger.exception("Unable to retrieve dealerships: %s", error)
        return JsonResponse(
            {"status": 502, "dealers": [], "message": "Backend service unavailable"},
            status=502,
        )


@require_GET
def get_dealer_details(request, dealer_id):
    try:
        dealership = get_request(f"/fetchDealer/{dealer_id}")
        return JsonResponse({"status": 200, "dealer": dealership})
    except Exception as error:
        logger.exception("Unable to retrieve dealership %s: %s", dealer_id, error)
        return JsonResponse(
            {"status": 502, "dealer": [], "message": "Backend service unavailable"},
            status=502,
        )


@require_GET
def get_dealer_reviews(request, dealer_id):
    try:
        reviews = get_request(f"/fetchReviews/dealer/{dealer_id}")
        for review in reviews:
            result = analyze_review_sentiments(review.get("review", ""))
            review["sentiment"] = result.get("sentiment", "neutral")
        return JsonResponse({"status": 200, "reviews": reviews})
    except Exception as error:
        logger.exception("Unable to retrieve reviews for dealer %s: %s", dealer_id, error)
        return JsonResponse(
            {"status": 502, "reviews": [], "message": "Backend service unavailable"},
            status=502,
        )


@csrf_exempt
@require_http_methods(["POST"])
def add_review(request):
    if request.user.is_anonymous:
        return JsonResponse({"status": 403, "message": "Unauthorized"}, status=403)

    try:
        data = _json_body(request)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"status": 400, "message": "Invalid JSON payload"}, status=400)

    required_fields = (
        "dealership",
        "review",
        "purchase_date",
        "car_make",
        "car_model",
        "car_year",
    )
    missing = [field for field in required_fields if not data.get(field)]
    if missing:
        return JsonResponse(
            {"status": 400, "message": f"Missing fields: {', '.join(missing)}"},
            status=400,
        )

    full_name = request.user.get_full_name().strip()
    data["name"] = full_name or request.user.username
    data["purchase"] = bool(data.get("purchase", True))

    try:
        saved_review = post_review(data)
        return JsonResponse({"status": 200, "review": saved_review})
    except Exception as error:
        logger.exception("Unable to post review: %s", error)
        return JsonResponse(
            {"status": 502, "message": "Error posting review"},
            status=502,
        )
