/** Animation metadata contract — matches docs/PIXELLAB-ASSET-GENERATION.md §10. */
export interface AssetManifestEntry {
  key: string
  /** Export path under `public/` for future PixelLab drop-in. */
  path: string
  frameWidth: number
  frameHeight: number
  frames: number
  fps: number
  repeat: -1 | 0
  origin: [number, number]
}
