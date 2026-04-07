export const IMAGE_UPLOAD_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension ? `.${extension}` : "";
}

export function validateImageFile(file: File): string | null {
  const extension = getFileExtension(file.name);

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Chi chap nhan anh JPG, PNG, WEBP hoac GIF.";
  }

  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    return "Dinh dang file khong hop le. Hay chon JPG, PNG, WEBP hoac GIF.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Anh vuot qua 5MB. Hay chon file nho hon.";
  }

  return null;
}
