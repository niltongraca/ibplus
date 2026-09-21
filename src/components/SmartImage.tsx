import Image from "next/image";
import type { ImageProps } from "next/image";
import { isDataUrl } from "@/lib/upload";

type SmartImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
};

/**
 * Renderiza imagens otimizadas com o next/image quando o src é um URL http(s)
 * (ex.: Vercel Blob — auditoria #18). Para valores legados "data:image/..."
 * (base64 em BD, anteriores à migração) cai para <img> nativo, porque o
 * next/image não suporta data-URLs.
 */
export function SmartImage({ src, alt, ...rest }: SmartImageProps) {
  if (!isDataUrl(src)) {
    return <Image src={src} alt={alt} {...rest} />;
  }
  // Props específicas do next/image não são atributos <img> válidos.
  const { fill, priority, quality, ...imgRest } = rest;
  void fill;
  void priority;
  void quality;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} {...imgRest} />;
}