/// <reference types="vite/client" />
import { canDrawImage } from './spriteAtlas';

function towerBasePublicUrl(family: string, fileStem: string): string {
  const path = `assets/towers/base/${family}/${fileStem}.png`;
  return `${import.meta.env.BASE_URL}${path}`;
}

/** One image per gem id; tries `{gemId}.png` first, then `{family}.png` on error. */
const imageByGemId = new Map<string, HTMLImageElement>();

/**
 * Base gem portraits from `public/assets/towers/base/{family}/` (URLs like `/assets/towers/base/...`).
 * Tries `{gemId}.png` first, then `{family}.png`.
 */
export function getTowerBaseImage(gemId: string): HTMLImageElement | undefined {
  const m = /^([a-z]+)-([1-6])$/.exec(gemId);
  if (!m) return undefined;
  const family = m[1];
  let img = imageByGemId.get(gemId);
  if (!img) {
    const el = new Image();
    img = el;
    el.decoding = 'async';
    const exactUrl = towerBasePublicUrl(family, gemId);
    const familyUrl = towerBasePublicUrl(family, family);
    const onError = (): void => {
      if (el.dataset.pbTowerBaseFallback === '1') {
        el.removeEventListener('error', onError);
        return;
      }
      el.dataset.pbTowerBaseFallback = '1';
      el.src = familyUrl;
    };
    el.addEventListener('error', onError);
    el.src = exactUrl;
    imageByGemId.set(gemId, el);
  }
  return canDrawImage(img) ? img : undefined;
}

export function drawTowerBaseImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cx: number,
  cy: number,
  size: number,
): void {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    cx - size / 2,
    cy - size / 2,
    size,
    size,
  );
}
