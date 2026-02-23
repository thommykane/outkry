"use client";

import { useState } from "react";

const PLACEHOLDER = "https://placehold.co/400x300/1a1a1a/666?text=—";

type Props = {
  src: string;
  alt?: string;
  style?: React.CSSProperties;
};

export default function FeaturedImage({ src, alt = "", style }: Props) {
  const [failed, setFailed] = useState(false);
  const url = failed ? PLACEHOLDER : src;

  return (
    <img
      src={url}
      alt={alt}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
