"use client";

import { useModal } from "@/components/providers/ModalProvider";

interface AppImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  /** When true, clicking the image opens it fullsize in a modal */
  expandable?: boolean;
}

function ExpandedImage({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="max-h-[80vh] w-auto max-w-full rounded-md object-contain"
    />
  );
}

/**
 * Simple image component for externally-hosted images.
 * Use this instead of next/image to avoid remotePatterns config.
 * Images are already optimized server-side (resized + WebP via Sharp).
 *
 * @prop expandable - clicking opens the image fullsize in a modal
 */
export function AppImage({
  src,
  alt,
  className,
  expandable = false,
  ...props
}: AppImageProps) {
  const { openModal } = useModal();

  function handleClick(e: React.MouseEvent<HTMLImageElement>) {
    if (expandable) {
      e.stopPropagation();
      openModal({
        title: alt,
        content: <ExpandedImage src={src} alt={alt} />,
        variant: "naked",
      });
    }
    props.onClick?.(e);
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`${className ?? ""} ${expandable ? "cursor-zoom-in" : ""}`.trim()}
      onClick={handleClick}
      {...props}
    />
  );
}
