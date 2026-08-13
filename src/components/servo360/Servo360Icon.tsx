import Image from "next/image";
import manifest from "./servo360-icons.manifest.json";

type Props = { iconKey: string; size?: number; alt?: string; className?: string };

export function Servo360Icon({ iconKey, size = 64, alt = "", className = "" }: Props) {
  const icon = manifest.icons.find((item) => item.key === iconKey);
  if (!icon) return <span className={`s360-icon-fallback ${className}`} aria-hidden={!alt} aria-label={alt || undefined} style={{width:size,height:size}} />;
  return <Image src={icon.asset} alt={alt} width={size} height={size} className={`s360-icon ${className}`} draggable={false} />;
}
