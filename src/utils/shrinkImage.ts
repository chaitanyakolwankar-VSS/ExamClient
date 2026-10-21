/**
 * Shrinks a picture in the browser before upload: phone photos are 3-8 MB, the API takes up to 2 MB. Turned the
 * right way up (camera orientation), drawn on white (transparent signatures stay readable), saved as JPEG; the
 * location and camera data inside the original are not carried over. Answers a data URL.
 */
export async function shrinkImage(file: File, maxSide: number): Promise<string> {
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
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't prepare the picture.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();

  for (const quality of [0.88, 0.8, 0.7, 0.6]) {
    const url = canvas.toDataURL("image/jpeg", quality);
    if (url.length * 0.75 < 1.8 * 1024 * 1024) return url;
  }
  throw new Error("That picture is too large. Try a smaller one.");
}
