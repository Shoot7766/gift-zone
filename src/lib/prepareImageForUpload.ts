"use client";

type PrepareImageOptions = {
  aspectRatio: number;
  maxWidth: number;
  maxHeight: number;
  quality?: number;
};

export async function prepareImageForUpload(file: File, options: PrepareImageOptions): Promise<File> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(imageUrl);
    const crop = getCenteredCrop(image.width, image.height, options.aspectRatio);
    const targetSize = scaleToFit(crop.width, crop.height, options.maxWidth, options.maxHeight);

    const canvas = document.createElement("canvas");
    canvas.width = targetSize.width;
    canvas.height = targetSize.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context yaratilmagan");
    }

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      targetSize.width,
      targetSize.height
    );

    const blob = await canvasToBlob(canvas, "image/webp", options.quality ?? 0.86);
    return new File([blob], replaceExtension(file.name, "webp"), { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Rasm yuklanmadi"));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Rasm tayyorlanmadi"));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

function getCenteredCrop(width: number, height: number, ratio: number) {
  const currentRatio = width / height;

  if (currentRatio > ratio) {
    const cropWidth = Math.round(height * ratio);
    return {
      x: Math.floor((width - cropWidth) / 2),
      y: 0,
      width: cropWidth,
      height,
    };
  }

  const cropHeight = Math.round(width / ratio);
  return {
    x: 0,
    y: Math.floor((height - cropHeight) / 2),
    width,
    height: cropHeight,
  };
}

function scaleToFit(width: number, height: number, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function replaceExtension(filename: string, nextExt: string) {
  const base = filename.replace(/\.[^.]+$/, "");
  return `${base}.${nextExt}`;
}
