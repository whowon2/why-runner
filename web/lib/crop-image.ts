import type { Area } from "react-easy-crop";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

export async function getCroppedImageBlob(
  imageSrc: string,
  croppedAreaPixels: Area,
  maxWidth?: number,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  // Downscale large crops (e.g. phone photos) so the upload stays small;
  // the server resizes to its final dimensions anyway.
  const scale = maxWidth ? Math.min(1, maxWidth / croppedAreaPixels.width) : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(croppedAreaPixels.width * scale);
  canvas.height = Math.round(croppedAreaPixels.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      },
      "image/webp",
      0.9,
    );
  });
}
