export const BOARD_LANDMARKS: Array<{ id: string; gx: number; gy: number }> = [
  { id: 'spawn', gx: 8, gy: 124 },
  { id: 'checkpoint-1', gx: 68, gy: 68 },
  { id: 'checkpoint-2', gx: 108, gy: 48 },
  { id: 'checkpoint-3', gx: 48, gy: 48 },
  { id: 'checkpoint-4', gx: 108, gy: 88 },
  { id: 'checkpoint-5', gx: 48, gy: 88 },
  { id: 'goal', gx: 124, gy: 8 },
]

export function landmarkWorldCenter(
  landmarkId: string,
  tileSize: number,
): { x: number; y: number } | null {
  const landmark = BOARD_LANDMARKS.find((entry) => entry.id === landmarkId)
  if (!landmark) return null
  return {
    x: landmark.gx * tileSize + tileSize * 1.5,
    y: landmark.gy * tileSize + tileSize * 3,
  }
}
