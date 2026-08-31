// Resizes + re-encodes an image File to WebP entirely in the browser via
// <canvas> before it's uploaded — keeps manually-picked product photos
// (often multi-megabyte straight out of a camera or a Google Images
// download) from landing in Supabase Storage at full size.
const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

export function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Image compression failed.")); return; }
          const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
          resolve(new File([blob], name, { type: "image/webp" }));
        },
        "image/webp",
        QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not read image file.")); };
    img.src = objectUrl;
  });
}
