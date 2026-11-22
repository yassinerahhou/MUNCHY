'use client';
import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import placeholders from '@/lib/image-placeholders.json';
const blur = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIyNCI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjI0IiBmaWxsPSIjNzI1NzQzIi8+PC9zdmc+';
export default function FoodImage(props: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const preview = typeof props.src === 'string' ? (placeholders as Record<string, string>)[props.src] : undefined;
  return <><Image {...props} placeholder="blur" blurDataURL={props.blurDataURL || preview || blur} onLoad={event => { setLoaded(true); props.onLoad?.(event); }} onError={event => { setLoaded(true); props.onError?.(event); }} />{!loaded && <span className="food-shimmer" aria-hidden="true" />}</>;
}
