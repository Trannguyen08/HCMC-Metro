import cloudinary
import cloudinary.uploader
import os
from django.conf import settings

# Configure Cloudinary
# It will first look for individual CLOUD_ settings, then CLOUDINARY_URL
cloud_name = os.environ.get("CLOUD_NAME", "do6dsh88f") # Extracted from the provided URL
api_key = os.environ.get("CLOUD_API_KEY")
api_secret = os.environ.get("CLOUD_SECRET_KEY")

if api_key and api_secret and cloud_name:
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )
else:
    # Fallback to CLOUDINARY_URL if available
    # Note: user's .env had a weird CLOUD_URL=CLOUDINARY_URL=... format
    cloud_url = os.environ.get("CLOUD_URL")
    if cloud_url and "CLOUDINARY_URL=" in cloud_url:
        cloud_url = cloud_url.replace("CLOUDINARY_URL=", "")
    
    if cloud_url:
        os.environ["CLOUDINARY_URL"] = cloud_url

def upload_image(file_object, folder="hcmc_metro"):
    """
    Uploads a file to Cloudinary and returns the secure URL.
    """
    try:
        result = cloudinary.uploader.upload(
            file_object,
            folder=folder,
            resource_type="image"
        )
        return result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary Upload Error: {str(e)}")
        return None
