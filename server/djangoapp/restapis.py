import os
from urllib.parse import quote, urljoin

import requests
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv("backend_url", "http://localhost:3030").rstrip("/") + "/"
SENTIMENT_ANALYZER_URL = os.getenv(
    "sentiment_analyzer_url",
    "http://localhost:5050/",
).rstrip("/") + "/"
REQUEST_TIMEOUT = float(os.getenv("request_timeout", "10"))


def get_request(endpoint, **kwargs):
    request_url = urljoin(BACKEND_URL, endpoint.lstrip("/"))
    response = requests.get(
        request_url,
        params=kwargs or None,
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def analyze_review_sentiments(text):
    request_url = urljoin(
        SENTIMENT_ANALYZER_URL,
        f"analyze/{quote(text, safe='')}",
    )

    try:
        response = requests.get(request_url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.RequestException:
        return {"sentiment": "neutral"}


def post_review(data_dict):
    request_url = urljoin(BACKEND_URL, "insert_review")
    response = requests.post(
        request_url,
        json=data_dict,
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()
