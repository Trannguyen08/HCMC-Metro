export function resolveMediaUrl(url?: string | null) {
  if (!url) return "";

  const value = url.trim();
  if (!value) return "";

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const publicOrigin = (() => {
    if (!apiBase) return "";
    try {
      return new URL(apiBase).origin;
    } catch {
      return "";
    }
  })();

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      // Backend may return internal Docker URL (e.g. http://backend:8000/media/...)
      // which is unreachable from browser. Replace by public API origin when possible.
      if (parsed.hostname === "backend" && publicOrigin) {
        return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, publicOrigin).toString();
      }
      return parsed.toString();
    } catch {
      return value;
    }
  }

  if (value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (apiBase) {
    try {
      return new URL(value, apiBase).toString();
    } catch {
      return value;
    }
  }

  return value;
}
