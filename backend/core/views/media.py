from pathlib import Path

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.permissions import IsAdminUser
from infrastructure.third_party.cloudinary_storage import upload_image


ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}
MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024


@api_view(["POST"])
@permission_classes([IsAdminUser])
def upload_media(request):
    """Validate and upload an image to Cloudinary, then return the public URL."""
    if "file" not in request.FILES:
        return Response(
            {"detail": "Khong co tep tin duoc gui."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    file = request.FILES["file"]
    extension = Path(file.name).suffix.lower()
    content_type = getattr(file, "content_type", "")
    file_size = getattr(file, "size", 0)

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        return Response(
            {"detail": "Dinh dang tep khong hop le. Chi ho tro JPG, PNG, WEBP hoac GIF."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if content_type not in ALLOWED_IMAGE_MIME_TYPES:
        return Response(
            {"detail": "Loai tep khong hop le. Vui long chon anh JPG, PNG, WEBP hoac GIF."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if file_size > MAX_UPLOAD_SIZE_BYTES:
        return Response(
            {"detail": "Kich thuoc tep vuot qua 5MB."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    url = upload_image(file)
    if url:
        return Response({"url": url}, status=status.HTTP_200_OK)

    return Response(
        {"detail": "Upload that bai."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
