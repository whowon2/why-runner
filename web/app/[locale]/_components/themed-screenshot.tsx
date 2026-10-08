import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

interface ThemedScreenshotProps {
  light: StaticImageData;
  dark: StaticImageData;
  alt: string;
  sizes: string;
  className?: string;
}

// Renders both theme variants and lets the `.dark` class pick one, so the
// server markup never depends on the client's theme (no hydration mismatch).
export function ThemedScreenshot({
  light,
  dark,
  alt,
  sizes,
  className,
}: ThemedScreenshotProps) {
  return (
    <>
      <Image
        src={light}
        alt={alt}
        sizes={sizes}
        placeholder="blur"
        className={cn("block h-auto w-full dark:hidden", className)}
      />
      <Image
        src={dark}
        alt={alt}
        sizes={sizes}
        placeholder="blur"
        className={cn("hidden h-auto w-full dark:block", className)}
      />
    </>
  );
}
