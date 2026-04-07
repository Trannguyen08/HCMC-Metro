import cloudinary
import cloudinary.uploader
import cloudinary.api
from django.conf import settings
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config( 
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'), 
  api_key = os.getenv('CLOUDINARY_API_KEY'), 
  api_secret = os.getenv('CLOUDINARY_API_SECRET') 
)

def upload_image(file_obj):
    """
    Uploads an image to Cloudinary and returns the URL.
    Returns None if upload fails.
    """
    try:
        response = cloudinary.uploader.upload(
            file_obj,
            folder="hcmc_metro",
            resource_type="auto"
        )
        return response.get("secure_url")
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        return None
