import { useEffect, useState } from "react";

interface TrimmedThumbnailProps {
  src: string;
  alt: string;
  className?: string;
}

const WHITE_THRESHOLD = 245;
const ALPHA_THRESHOLD = 12;
const PADDING_PX = 8;

function isBackgroundPixel(r: number, g: number, b: number, a: number) {
  return a <= ALPHA_THRESHOLD || (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD);
}

function cropWhitespace(src: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          resolve(src);
          return;
        }

        context.drawImage(image, 0, 0);
        const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);

        let top = height;
        let left = width;
        let right = -1;
        let bottom = -1;

        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];

            if (!isBackgroundPixel(r, g, b, a)) {
              if (x < left) left = x;
              if (x > right) right = x;
              if (y < top) top = y;
              if (y > bottom) bottom = y;
            }
          }
        }

        if (right < left || bottom < top) {
          resolve(src);
          return;
        }

        const cropLeft = Math.max(0, left - PADDING_PX);
        const cropTop = Math.max(0, top - PADDING_PX);
        const cropWidth = Math.min(width - cropLeft, right - left + 1 + PADDING_PX * 2);
        const cropHeight = Math.min(height - cropTop, bottom - top + 1 + PADDING_PX * 2);

        const trimmedCanvas = document.createElement("canvas");
        trimmedCanvas.width = cropWidth;
        trimmedCanvas.height = cropHeight;
        const trimmedContext = trimmedCanvas.getContext("2d");
        if (!trimmedContext) {
          resolve(src);
          return;
        }

        trimmedContext.drawImage(
          image,
          cropLeft,
          cropTop,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );
        resolve(trimmedCanvas.toDataURL("image/png"));
      } catch {
        resolve(src);
      }
    };
    image.onerror = () => resolve(src);
    image.src = src;
  });
}

export function TrimmedThumbnail({ src, alt, className }: TrimmedThumbnailProps) {
  const [displaySrc, setDisplaySrc] = useState(src);

  useEffect(() => {
    let cancelled = false;

    cropWhitespace(src).then((nextSrc) => {
      if (!cancelled) {
        setDisplaySrc(nextSrc);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return <img src={displaySrc} alt={alt} className={className} />;
}
