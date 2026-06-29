import { useCallback } from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement>;

/**
 * <img> that fades in once the image has decoded. Handles cached images
 * (which never fire onLoad after mount) via the ref check.
 */
export function RevealImage({ className = "", ...props }: Props) {
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete) img.classList.add("is-loaded");
  }, []);

  return (
    <img
      {...props}
      ref={ref}
      className={`img-reveal ${className}`}
      onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
    />
  );
}
