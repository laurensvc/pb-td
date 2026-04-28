import {
  spriteMetadata,
  type SpriteAnimationMeta,
  type SpriteMetadata,
  type SpriteRect,
} from './spriteMetadata';

export interface SpriteAtlasRuntime {
  metadata: SpriteMetadata;
  images: Partial<Record<keyof SpriteMetadata['sheets'], HTMLImageElement>>;
}

let runtime: SpriteAtlasRuntime | null = null;

export function getSpriteAtlas(): SpriteAtlasRuntime {
  if (runtime) return runtime;
  const images: SpriteAtlasRuntime['images'] = {};
  if (typeof Image !== 'undefined') {
    for (const sheetId of Object.keys(spriteMetadata.sheets) as Array<
      keyof SpriteMetadata['sheets']
    >) {
      const image = new Image();
      image.decoding = 'async';
      image.src = spriteMetadata.sheets[sheetId].src;
      images[sheetId] = image;
    }
  }
  runtime = { metadata: spriteMetadata, images };
  return runtime;
}

export function getAnimationFrame(animation: SpriteAnimationMeta, timeMs: number): SpriteRect {
  const frameCount = animation.frames.length;
  const index = Math.floor(timeMs / animation.frameDurationMs) % frameCount;
  return animation.frames[index];
}

export function canDrawImage(image: HTMLImageElement | undefined): image is HTMLImageElement {
  return Boolean(image && image.complete && image.naturalWidth > 0);
}
