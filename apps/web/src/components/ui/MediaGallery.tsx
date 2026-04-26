"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModal } from "@/components/providers/ModalProvider";

export interface GalleryImage {
  src: string;
  alt?: string;
}

interface MediaGalleryProps {
  images: GalleryImage[];
  /** Applied to the main image wrapper div */
  className?: string;
  /** Show clickable thumbnail strip below the main image */
  thumbnails?: boolean;
  /** Clicking the main image opens a modal carousel (default: true) */
  expandable?: boolean;
  /** Which image is active on first render */
  initialIndex?: number;
}

// --- Modal carousel (self-contained, manages own index) ---
function ModalCarousel({
  images,
  initialIndex,
}: {
  images: GalleryImage[];
  initialIndex: number;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const { closeModal } = useModal();

  const prev = useCallback(
    () => setIdx((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setIdx((i) => (i + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    if (images.length < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, images.length]);

  const image = images[idx];

  return (
    <div className="relative flex flex-col items-center gap-3 select-none">
      {/* Close button above the image */}
      <button
        onClick={closeModal}
        aria-label="Close"
        className="absolute -top-10 right-0 cursor-pointer text-white/70 hover:text-white transition-colors"
      >
        <X className="h-6 w-6 drop-shadow" />
      </button>

      {/* Arrows + image in a row so nothing shifts the center */}
      <div className="flex items-center gap-4">
        {images.length > 1 ? (
          <button
            onClick={prev}
            aria-label="Previous image"
            className="cursor-pointer text-white/80 hover:text-white transition-colors p-1 shrink-0"
          >
            <ChevronLeft className="h-8 w-8 drop-shadow" />
          </button>
        ) : (
          <div className="w-10 shrink-0" />
        )}

        <img
          key={image.src}
          src={image.src}
          alt={image.alt ?? ""}
          loading="lazy"
          decoding="async"
          className="max-h-[80vh] max-w-[70vw] w-auto rounded-md object-contain"
        />

        {images.length > 1 ? (
          <button
            onClick={next}
            aria-label="Next image"
            className="cursor-pointer text-white/80 hover:text-white transition-colors p-1 shrink-0"
          >
            <ChevronRight className="h-8 w-8 drop-shadow" />
          </button>
        ) : (
          <div className="w-10 shrink-0" />
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex flex-col gap-2 items-center">
          <div className="flex gap-1.5 overflow-x-auto max-w-[70vw] justify-center px-2">
            {images.map((img, i) => (
              <button
                key={img.src}
                onClick={() => setIdx(i)}
                aria-label={`Go to image ${i + 1}`}
                className={cn(
                  "cursor-pointer h-12 w-12 shrink-0 overflow-hidden rounded border-2 transition-all",
                  i === idx
                    ? "border-white opacity-100 ring-1 ring-white"
                    : "border-white/30 opacity-60 hover:opacity-90",
                )}
              >
                <img
                  src={img.src}
                  alt={img.alt ?? ""}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-white/50">
            {idx + 1} / {images.length}
          </p>
        </div>
      )}
    </div>
  );
}

// --- Main component ---
export function MediaGallery({
  images,
  className,
  thumbnails = false,
  expandable = true,
  initialIndex = 0,
}: MediaGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(
    Math.max(0, Math.min(initialIndex, images.length - 1)),
  );
  const { openModal } = useModal();

  if (!images.length) return null;

  // Keep activeIdx in bounds if images array changes (e.g. after a delete)
  const clampedIdx = Math.min(activeIdx, Math.max(0, images.length - 1));
  const active = images[clampedIdx];

  function handleImageClick() {
    if (!expandable) return;
    openModal({
      title: active.alt ?? "",
      variant: "naked",
      content: <ModalCarousel images={images} initialIndex={clampedIdx} />,
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Main image */}
      <div className={cn("overflow-hidden", className)}>
        <img
          src={active.src}
          alt={active.alt ?? ""}
          loading="lazy"
          decoding="async"
          className={cn(
            "h-full w-full object-cover transition-opacity duration-200",
            expandable && "cursor-zoom-in",
          )}
          onClick={handleImageClick}
        />
      </div>

      {/* Thumbnail strip */}
      {thumbnails && images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.src}
              onClick={() => setActiveIdx(i)}
              aria-label={img.alt ?? `Image ${i + 1}`}
              className={cn(
                "cursor-pointer h-14 w-14 shrink-0 overflow-hidden rounded border-2 transition-all",
                i === clampedIdx
                  ? "border-primary opacity-100"
                  : "border-transparent opacity-60 hover:opacity-90",
              )}
            >
              <img
                src={img.src}
                alt={img.alt ?? ""}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
