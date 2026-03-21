from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from infrastructure.third_party.cloudinary_storage import upload_image
from core.permissions import IsAdminUser

@api_view(["POST"])
@permission_classes([IsAdminUser])
def upload_media(request):
    """Upload an image to Cloudinary and return the URL."""
    if "file" not in request.FILES:
        return Response({"detail": "Không có tệp tin được gửi."}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES["file"]
    url = upload_image(file)
    
    if url:
        return Response({"url": url}, status=status.HTTP_200_OK)
    return Response({"detail": "Upload thất bại."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
