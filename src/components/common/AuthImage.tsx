import type { ImgHTMLAttributes, ReactNode } from "react";
import { useAuthImage } from "../../hooks/useAuthImage";

interface AuthImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  /** Stored path from the API (PhotoUrl, SignUrl, LogoUrl, BannerUrl, ...), or a blob:/data: URL. */
  src?: string | null;
  /** Rendered while loading, when there is no image, or when it cannot be loaded. */
  fallback?: ReactNode;
}

/**
 * <img> for files served by the authorised GET /api/Files endpoint: student photos/signatures and
 * college logos/banners. Loads through the authenticated axios client, so the bearer token is sent.
 */
const AuthImage = ({ src, fallback = null, alt = "", ...imgProps }: AuthImageProps) => {
  const { url } = useAuthImage(src);

  if (!url) return <>{fallback}</>;
  return <img {...imgProps} src={url} alt={alt} />;
};

export default AuthImage;
