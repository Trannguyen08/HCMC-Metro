import os
from urllib.parse import urlparse

import cloudinary
import cloudinary.api
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()


def _get_env(*names):
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return None


def _parse_cloudinary_url(raw_url):
    if not raw_url:
        return {}

    normalized_url = raw_url.strip()
    if normalized_url.startswith("CLOUDINARY_URL="):
        normalized_url = normalized_url.split("=", 1)[1].strip()

    parsed_url = urlparse(normalized_url)
    if parsed_url.scheme != "cloudinary":
        return {}

    return {
        "cloud_name": parsed_url.hostname,
        "api_key": parsed_url.username,
        "api_secret": parsed_url.password,
    }


cloudinary_url_config = _parse_cloudinary_url(_get_env("CLOUDINARY_URL", "CLOUD_URL"))

cloudinary.config(
    cloud_name=_get_env("CLOUDINARY_CLOUD_NAME") or cloudinary_url_config.get("cloud_name"),
    api_key=_get_env("CLOUDINARY_API_KEY", "CLOUD_API_KEY") or cloudinary_url_config.get("api_key"),
    api_secret=_get_env("CLOUDINARY_API_SECRET", "CLOUD_SECRET_KEY") or cloudinary_url_config.get("api_secret"),
)


def upload_image(file_obj):
    """
    Uploads an image to Cloudinary and returns the URL.
    Returns None if upload fails.
    """
    try:
        config = cloudinary.config()
        if not config.cloud_name or not config.api_key or not config.api_secret:
            print("Cloudinary upload error: missing Cloudinary credentials.")
            return None

        response = cloudinary.uploader.upload(
            file_obj,
            folder="hcmc_metro",
            resource_type="auto",
        )
        return response.get("secure_url")
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        return None
