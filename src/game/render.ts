import { canPlaceWithoutBlocking, isBuildable, toIndex } from './pathfinding';
import { canDrawImage, getAnimationFrame, getSpriteAtlas } from './spriteAtlas';
import type { GameState, GridPoint, RenderViewState } from './types';

const GRID_LINE = 'rgba(243, 229, 189, 0.16)';

export function getRenderView(canvas: HTMLCanvasElement, state: GameState): RenderViewState {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const map = state.config.map;
  const cellSize = Math.floor(Math.min(width / map.width, height / map.height));
  return {
    width,
    height,
    cellSize,
    offsetX: Math.floor((width - cellSize * map.width) / 2),
    offsetY: Math.floor((height - cellSize * map.height) / 2),
  };
}

export function screenToTile(
  view: RenderViewState,
  state: GameState,
  clientX: number,
  clientY: number,
  rect: DOMRect,
): GridPoint | null {
  const dpr = window.devicePixelRatio || 1;
  const x = (clientX - rect.left) * dpr - view.offsetX;
  const y = (clientY - rect.top) * dpr - view.offsetY;
  const tileX = Math.floor(x / view.cellSize);
  const tileY = Math.floor(y / view.cellSize);
  if (tileX < 0 || tileY < 0 || tileX >= state.config.map.width || tileY >= state.config.map.height)
    return null;
  return { x: tileX, y: tileY };
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: RenderViewState,
): void {
  ctx.clearRect(0, 0, view.width, view.height);
  drawBackdrop(ctx, view);
  drawBoard(ctx, state, view);
  drawPath(ctx, state, view);
  drawPlacementPreview(ctx, state, view);
  drawStones(ctx, state, view);
  drawDraftCandidates(ctx, state, view);
  drawTowers(ctx, state, view);
  drawEnemies(ctx, state, view);
  drawProjectiles(ctx, state, view);
  drawFloatingText(ctx, state, view);
  drawOverlay(ctx, state, view);
}

function drawBackdrop(ctx: CanvasRenderingContext2D, view: RenderViewState): void {
  const gradient = ctx.createLinearGradient(0, 0, view.width, view.height);
  gradient.addColorStop(0, '#251e17');
  gradient.addColorStop(0.5, '#16120f');
  gradient.addColorStop(1, '#0e0c0a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.width, view.height);
}

function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, view: RenderViewState): void {
  const map = state.config.map;
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.fillStyle = '#2a241c';
  ctx.fillRect(0, 0, map.width * view.cellSize, map.height * view.cellSize);
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const index = toIndex(x, y, map.width);
      const px = x * view.cellSize;
      const py = y * view.cellSize;
      if (state.occupied[index] === -1) {
        drawBlockedTile(ctx, px, py, view.cellSize);
      } else if ((x + y) % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 246, 215, 0.035)';
        ctx.fillRect(px, py, view.cellSize, view.cellSize);
      }
    }
  }
  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = Math.max(1, view.cellSize * 0.018);
  for (let x = 0; x <= map.width; x++) {
    ctx.beginPath();
    ctx.moveTo(x * view.cellSize, 0);
    ctx.lineTo(x * view.cellSize, map.height * view.cellSize);
    ctx.stroke();
  }
  for (let y = 0; y <= map.height; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * view.cellSize);
    ctx.lineTo(map.width * view.cellSize, y * view.cellSize);
    ctx.stroke();
  }
  drawGate(ctx, map.entrance.x, map.entrance.y, view.cellSize, '#55b8a9');
  drawGate(ctx, map.exit.x, map.exit.y, view.cellSize, '#c87932');
  ctx.restore();
}

function drawBlockedTile(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cellSize: number,
): void {
  const inset = Math.max(3, cellSize * 0.08);
  const radius = Math.max(4, cellSize * 0.1);
  const x = px + inset;
  const y = py + inset;
  const size = cellSize - inset * 2;
  const gradient = ctx.createLinearGradient(x, y, x, y + size);
  gradient.addColorStop(0, '#6a5741');
  gradient.addColorStop(0.55, '#42382d');
  gradient.addColorStop(1, '#28231d');
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.roundRect(x + cellSize * 0.04, y + cellSize * 0.06, size, size, radius);
  ctx.fill();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.fill();
  ctx.strokeStyle = 'rgba(215, 174, 100, 0.72)';
  ctx.lineWidth = Math.max(2, cellSize * 0.045);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 246, 215, 0.18)';
  ctx.lineWidth = Math.max(1, cellSize * 0.018);
  ctx.beginPath();
  ctx.moveTo(x + size * 0.22, y + size * 0.28);
  ctx.lineTo(x + size * 0.78, y + size * 0.72);
  ctx.moveTo(x + size * 0.72, y + size * 0.24);
  ctx.lineTo(x + size * 0.28, y + size * 0.78);
  ctx.stroke();
}

function drawGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  color: string,
): void {
  const cx = x * cellSize + cellSize / 2;
  const cy = y * cellSize + cellSize / 2;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, cellSize * 0.06);
  ctx.stroke();
}

function drawPath(ctx: CanvasRenderingContext2D, state: GameState, view: RenderViewState): void {
  if (state.path.length <= 1) return;
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.strokeStyle = 'rgba(215, 174, 100, 0.48)';
  ctx.lineWidth = Math.max(3, view.cellSize * 0.13);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(
    state.path[0].x * view.cellSize + view.cellSize / 2,
    state.path[0].y * view.cellSize + view.cellSize / 2,
  );
  for (let i = 1; i < state.path.length; i++) {
    ctx.lineTo(
      state.path[i].x * view.cellSize + view.cellSize / 2,
      state.path[i].y * view.cellSize + view.cellSize / 2,
    );
  }
  ctx.stroke();
  ctx.restore();
}

function drawPlacementPreview(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: RenderViewState,
): void {
  const tile = state.hoverTile;
  if (!tile) return;
  const enemyCells: GridPoint[] = [];
  for (let i = 0; i < state.enemies.length; i++) {
    const enemy = state.enemies[i];
    if (enemy.alive) enemyCells.push({ x: Math.round(enemy.x), y: Math.round(enemy.y) });
  }
  const canPlace =
    state.pendingGemId !== null &&
    canPlaceWithoutBlocking(state.config.map, state.occupied, tile.x, tile.y, enemyCells);
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.fillStyle = canPlace ? 'rgba(87, 196, 180, 0.24)' : 'rgba(225, 92, 101, 0.22)';
  ctx.fillRect(tile.x * view.cellSize, tile.y * view.cellSize, view.cellSize, view.cellSize);
  ctx.strokeStyle = canPlace ? '#57c4b4' : '#e15c65';
  ctx.lineWidth = Math.max(2, view.cellSize * 0.05);
  ctx.strokeRect(
    tile.x * view.cellSize + 2,
    tile.y * view.cellSize + 2,
    view.cellSize - 4,
    view.cellSize - 4,
  );
  ctx.restore();
}

function drawStones(ctx: CanvasRenderingContext2D, state: GameState, view: RenderViewState): void {
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  for (let i = 0; i < state.stones.length; i++) {
    const stone = state.stones[i];
    const px = stone.x * view.cellSize;
    const py = stone.y * view.cellSize;
    ctx.fillStyle = '#514537';
    ctx.beginPath();
    ctx.roundRect(
      px + view.cellSize * 0.16,
      py + view.cellSize * 0.16,
      view.cellSize * 0.68,
      view.cellSize * 0.68,
      Math.max(3, view.cellSize * 0.08),
    );
    ctx.fill();
    ctx.strokeStyle = 'rgba(215, 174, 100, 0.42)';
    ctx.lineWidth = Math.max(1, view.cellSize * 0.025);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDraftCandidates(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: RenderViewState,
): void {
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  const atlas = getSpriteAtlas();
  const gemImage = atlas.images.gems;
  for (let i = 0; i < state.draft.length; i++) {
    const candidate = state.draft[i];
    const color = getGemColor(state, candidate.gemId);
    const cx = candidate.x * view.cellSize + view.cellSize / 2;
    const cy = candidate.y * view.cellSize + view.cellSize / 2;
    if (canDrawImage(gemImage)) {
      const sprite = atlas.metadata.gems[candidate.gemId];
      if (sprite) {
        ctx.globalAlpha = state.pendingGemId ? 0.78 : 1;
        drawSprite(ctx, gemImage, sprite.frame, cx, cy, view.cellSize * 0.9);
        ctx.globalAlpha = 1;
        continue;
      }
    }
    drawGemFallback(ctx, cx, cy, view.cellSize, color, state.pendingGemId ? 0.72 : 1);
  }
  ctx.restore();
}

function getGemColor(state: GameState, gemId: string): string {
  for (let i = 0; i < state.config.gems.length; i++) {
    const gem = state.config.gems[i];
    if (gem.id === gemId) return gem.color;
  }
  return '#d7ae64';
}

function drawTowers(ctx: CanvasRenderingContext2D, state: GameState, view: RenderViewState): void {
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  const atlas = getSpriteAtlas();
  const gemImage = atlas.images.gems;
  for (let i = 0; i < state.towers.length; i++) {
    const tower = state.towers[i];
    const cx = tower.x * view.cellSize + view.cellSize / 2;
    const cy = tower.y * view.cellSize + view.cellSize / 2;
    const radius = view.cellSize * (0.2 + tower.tier * 0.025);
    if (state.selectedTile?.x === tower.x && state.selectedTile.y === tower.y) {
      ctx.strokeStyle = 'rgba(87, 196, 180, 0.42)';
      ctx.lineWidth = Math.max(1, view.cellSize * 0.025);
      ctx.beginPath();
      ctx.arc(cx, cy, tower.range * view.cellSize, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (canDrawImage(gemImage)) {
      const sprite = atlas.metadata.gems[tower.gemId];
      if (sprite) {
        drawSprite(ctx, gemImage, sprite.frame, cx, cy, view.cellSize);
        continue;
      }
    }
    drawTowerFallback(ctx, cx, cy, radius, tower.color);
  }
  ctx.restore();
}

function drawEnemies(ctx: CanvasRenderingContext2D, state: GameState, view: RenderViewState): void {
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  const atlas = getSpriteAtlas();
  const monsterImage = atlas.images.monsters;
  for (let i = 0; i < state.enemies.length; i++) {
    const enemy = state.enemies[i];
    if (!enemy.alive) continue;
    const cx = enemy.x * view.cellSize + view.cellSize / 2;
    const cy = enemy.y * view.cellSize + view.cellSize / 2;
    if (canDrawImage(monsterImage)) {
      const sprite = atlas.metadata.monsters[enemy.definitionId];
      const animation = sprite?.animations.walk;
      if (sprite && animation) {
        drawSprite(
          ctx,
          monsterImage,
          getAnimationFrame(animation, state.time * 1000 + enemy.id * 37),
          cx,
          cy,
          view.cellSize * 0.92,
        );
        drawHealthBar(ctx, cx, cy, view.cellSize, enemy.hp / enemy.maxHp);
        continue;
      }
    }
    const radius = view.cellSize * 0.23;
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 246, 215, 0.5)';
    ctx.lineWidth = Math.max(1, view.cellSize * 0.025);
    ctx.stroke();
    drawHealthBar(ctx, cx, cy - radius * 0.55, view.cellSize, enemy.hp / enemy.maxHp);
  }
  ctx.restore();
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  frame: { x: number; y: number; w: number; h: number },
  cx: number,
  cy: number,
  size: number,
): void {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    cx - size / 2,
    cy - size / 2,
    size,
    size,
  );
}

function drawGemFallback(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
  color: string,
  alpha: number,
): void {
  const radius = cellSize * 0.24;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius * 1.3);
  ctx.lineTo(cx + radius * 1.05, cy);
  ctx.lineTo(cx, cy + radius * 1.3);
  ctx.lineTo(cx - radius * 1.05, cy);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = alpha < 1 ? 'rgba(255, 246, 215, 0.34)' : '#fff6d7';
  ctx.lineWidth = Math.max(1, cellSize * 0.03);
  ctx.stroke();
}

function drawTowerFallback(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.8, radius * 1.2, radius * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#17130f';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius * 1.25);
  ctx.lineTo(cx + radius, cy);
  ctx.lineTo(cx, cy + radius * 1.25);
  ctx.lineTo(cx - radius, cy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 246, 215, 0.62)';
  ctx.lineWidth = Math.max(1, radius * 0.12);
  ctx.stroke();
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
  healthRatio: number,
): void {
  const hpWidth = cellSize * 0.72;
  const hpHeight = Math.max(3, cellSize * 0.055);
  const hpY = cy - cellSize * 0.32;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(cx - hpWidth / 2, hpY, hpWidth, hpHeight);
  ctx.fillStyle = '#55c980';
  ctx.fillRect(cx - hpWidth / 2, hpY, hpWidth * Math.max(0, healthRatio), hpHeight);
}

function drawProjectiles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: RenderViewState,
): void {
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  for (let i = 0; i < state.projectiles.length; i++) {
    const projectile = state.projectiles[i];
    if (!projectile.active) continue;
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(
      projectile.x * view.cellSize,
      projectile.y * view.cellSize,
      Math.max(3, view.cellSize * 0.07),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

function drawFloatingText(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: RenderViewState,
): void {
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.font = `${Math.max(11, view.cellSize * 0.22)}px Alegreya Sans`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < state.floatingTexts.length; i++) {
    const text = state.floatingTexts[i];
    if (!text.active) continue;
    ctx.globalAlpha = Math.max(0, text.life / 0.6);
    ctx.fillStyle = text.color;
    ctx.fillText(
      String(text.value),
      text.x * view.cellSize + view.cellSize / 2,
      text.y * view.cellSize,
    );
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawOverlay(ctx: CanvasRenderingContext2D, state: GameState, view: RenderViewState): void {
  if (state.status !== 'paused' && state.status !== 'won' && state.status !== 'lost') return;
  ctx.fillStyle = 'rgba(12, 10, 8, 0.62)';
  ctx.fillRect(0, 0, view.width, view.height);
  ctx.fillStyle = '#f3e5bd';
  ctx.font = `${Math.max(26, view.cellSize * 0.62)}px Cinzel`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label =
    state.status === 'paused' ? 'PAUSED' : state.status === 'won' ? 'VICTORY' : 'DEFEAT';
  ctx.fillText(label, view.width / 2, view.height / 2);
}

export function tileIsBuildableForPointer(state: GameState, tile: GridPoint): boolean {
  return isBuildable(state.config.map, state.occupied, tile.x, tile.y);
}
