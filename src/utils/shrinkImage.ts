/**
 * Shrinks a picture in the browser before upload: phone photos are 3-8 MB, the API takes a photo up to 1 MB and a
 * signature up to 500 KB. Turned the right way up (camera orientation), drawn on white (transparent signatures stay
 * readable), saved as JPEG at the highest quality that fits `maxBytes`; the location and camera data inside the
 * original are not carried over. Answers a data URL.
 */
export async function shrinkImage(file: File, maxSide: number, maxBytes = 1.8 * 1024 * 1024): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a picture (JPG or PNG).");
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("That picture can't be opened. Try a JPG or PNG."));
      img.src = URL.createObjectURL(file);
    });
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't prepare the picture.");

  // Highest quality first; if even the lowest is too big, try again a size smaller.
  for (let side = maxSide; side >= maxSide / 2; side = Math.round(side * 0.75)) {
    const scale = Math.min(1, side / Math.max(source.width, source.height));
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.88, 0.8, 0.7, 0.6]) {
      const url = canvas.toDataURL("image/jpeg", quality);
      if (url.length * 0.75 < maxBytes) {
        if ("close" in source) source.close();
        return url;
      }
    }
  }
  if ("close" in source) source.close();
  throw new Error("That picture is too large. Try a smaller one.");
}

/**
 * Student photo and signature: the hall ticket prints them about 3 cm wide, so 800 px (photo) and 600 px (signature)
 * are plenty; the byte targets stay well under the API's limits.
 */
export const STUDENT_PICTURE = {
  photo: { maxSide: 800, maxBytes: 300 * 1024 },
  signature: { maxSide: 600, maxBytes: 100 * 1024 },
} as const;
