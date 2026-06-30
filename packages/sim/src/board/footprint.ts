import { GEM_FOOTPRINT } from '../constants.js'
import type { GridCoord } from './coordinates.js'

export function footprintCells(gx: number, gy: number, size = GEM_FOOTPRINT): GridCoord[] {
  const cells: GridCoord[] = []
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      cells.push({ gx: gx + dx, gy: gy + dy })
    }
  }
  return cells
}

export function isEvenAlignedFootprint(gx: number, gy: number): boolean {
  return gx % 2 === 0 && gy % 2 === 0
}

export function footprintInBounds(
  gx: number,
  gy: number,
  width: number,
  height: number,
  size = GEM_FOOTPRINT,
): boolean {
  return gx >= 0 && gy >= 0 && gx + size <= width && gy + size <= height
}

export function footprintsOverlap(
  aGx: number,
  aGy: number,
  bGx: number,
  bGy: number,
  size = GEM_FOOTPRINT,
): boolean {
  return !(aGx + size <= bGx || bGx + size <= aGx || aGy + size <= bGy || bGy + size <= aGy)
}
