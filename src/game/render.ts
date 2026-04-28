import { canPlaceWithoutBlocking, isBuildable, toIndex } from './pathfinding';
import { drawTowerBaseImage, getTowerBaseImage } from './towerBaseImages';
import { canDrawImage, getAnimationFrame, getSpriteAtlas } from './spriteAtlas';
import type { GameState, GridPoint, RenderViewState } from './types';

const GRID_LINE = 'rgba(139, 234, 255, 0.16)';

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

export function screenToEnemyId(
  view: RenderViewState,
  state: GameState,
  clientX: number,
  clientY: number,
  rect: DOMRect,
): number | null {
  const dpr = window.devicePixelRatio || 1;
  const x = ((clientX - rect.left) * dpr - view.offsetX) / view.cellSize;
  const y = ((clientY - rect.top) * dpr - view.offsetY) / view.cellSize;
  const hitRadiusSq = 0.42 * 0.42;
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    if (!enemy.alive) continue;
    const dx = enemy.x + 0.5 - x;
    const dy = enemy.y + 0.5 - y;
    if (dx * dx + dy * dy <= hitRadiusSq) return enemy.id;
  }
  return null;
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
  gradient.addColorStop(0, '#0f2632');
  gradient.addColorStop(0.5, '#07121a');
  gradient.addColorStop(1, '#03070b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.width, view.height);
}

function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, view: RenderViewState): void {
  const map = state.config.map;
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.fillStyle = '#071722';
  ctx.fillRect(0, 0, map.width * view.cellSize, map.height * view.cellSize);
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const index = toIndex(x, y, map.width);
      const px = x * view.cellSize;
      const py = y * view.cellSize;
      if (state.occupied[index] === -1) {
        drawBlockedTile(ctx, px, py, view.cellSize);
      } else if ((x + y) % 2 === 0) {
        ctx.fillStyle = 'rgba(139, 234, 255, 0.035)';
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
  drawGate(ctx, map.entrance.x, map.entrance.y, view.cellSize, '#8df7b0');
  for (let i = 0; i < map.checkpoints.length; i++) {
    drawCheckpoint(ctx, map.checkpoints[i].x, map.checkpoints[i].y, view.cellSize, i + 1);
  }
  drawGate(ctx, map.exit.x, map.exit.y, view.cellSize, '#ff6f86');
  ctx.restore();
}

function drawCheckpoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  label: number,
): void {
  const cx = x * cellSize + cellSize / 2;
  const cy = y * cellSize + cellSize / 2;
  ctx.fillStyle = 'rgba(139, 234, 255, 0.16)';
  ctx.beginPath();
  ctx.arc(cx, cy, cellSize * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8beaff';
  ctx.lineWidth = Math.max(2, cellSize * 0.045);
  ctx.stroke();
  ctx.fillStyle = '#d8eef4';
  ctx.font = `${Math.max(10, cellSize * 0.24)}px "Share Tech Mono"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(label), cx, cy);
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
  gradient.addColorStop(0, '#2e4650');
  gradient.addColorStop(0.55, '#1a2d36');
  gradient.addColorStop(1, '#0d171f');
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.roundRect(x + cellSize * 0.04, y + cellSize * 0.06, size, size, radius);
  ctx.fill();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.fill();
  ctx.strokeStyle = 'rgba(139, 234, 255, 0.34)';
  ctx.lineWidth = Math.max(2, cellSize * 0.045);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(216, 238, 244, 0.18)';
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
  if (state.currentPath.length <= 1) return;
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.strokeStyle = 'rgba(139, 234, 255, 0.34)';
  ctx.lineWidth = Math.max(3, view.cellSize * 0.13);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(
    state.currentPath[0].x * view.cellSize + view.cellSize / 2,
    state.currentPath[0].y * view.cellSize + view.cellSize / 2,
  );
  for (let i = 1; i < state.currentPath.length; i++) {
    ctx.lineTo(
      state.currentPath[i].x * view.cellSize + view.cellSize / 2,
      state.currentPath[i].y * view.cellSize + view.cellSize / 2,
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
  const placingTowerOnStone =
    state.buildMode === 'shopTower' &&
    state.stones.some((stone) => stone.x === tile.x && stone.y === tile.y);
  const canPlace =
    state.buildMode === 'mazeBlock'
      ? state.bankedMazeBlocks > 0 &&
        canPlaceWithoutBlocking(state.config.map, state.occupied, tile.x, tile.y, enemyCells)
      : state.buildMode === 'shopTower'
        ? Boolean(state.selectedShopGemId) &&
          (placingTowerOnStone ||
            canPlaceWithoutBlocking(state.config.map, state.occupied, tile.x, tile.y, enemyCells))
        : false;
  if (state.buildMode === 'select') return;
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.fillStyle = canPlace ? 'rgba(141, 247, 176, 0.22)' : 'rgba(255, 111, 134, 0.2)';
  ctx.fillRect(tile.x * view.cellSize, tile.y * view.cellSize, view.cellSize, view.cellSize);
  ctx.strokeStyle = canPlace ? '#8df7b0' : '#ff6f86';
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
    ctx.fillStyle = '#1c333d';
    ctx.beginPath();
    ctx.roundRect(
      px + view.cellSize * 0.16,
      py + view.cellSize * 0.16,
      view.cellSize * 0.68,
      view.cellSize * 0.68,
      Math.max(3, view.cellSize * 0.08),
    );
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 234, 255, 0.3)';
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
  if (state.draft.length === 0) return;
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
    const basePortrait = getTowerBaseImage(candidate.gemId);
    if (basePortrait) {
      ctx.globalAlpha = state.pendingGemId ? 0.78 : 1;
      drawTowerBaseImage(ctx, basePortrait, cx, cy, view.cellSize * 0.9);
      ctx.globalAlpha = 1;
      continue;
    }
    drawGemFallback(ctx, cx, cy, view.cellSize, color, state.pendingGemId ? 0.72 : 1);
  }
  const choosePhase = state.draft.length === 5 && !state.pendingGemId;
  if (choosePhase) {
    for (let i = 0; i < state.draft.length; i++) {
      const c = state.draft[i];
      const fromPanelOrCanvas = Boolean(
        state.draftRowHover && state.draftRowHover.x === c.x && state.draftRowHover.y === c.y,
      );
      const fromBoardSelect =
        state.selectedTile !== null && state.selectedTile.x === c.x && state.selectedTile.y === c.y;
      if (!fromPanelOrCanvas && !fromBoardSelect) continue;
      const px = c.x * view.cellSize;
      const py = c.y * view.cellSize;
      const pad = Math.max(2, view.cellSize * 0.04);
      ctx.save();
      if (fromPanelOrCanvas) {
        ctx.strokeStyle = 'rgba(139, 234, 255, 0.95)';
        ctx.lineWidth = Math.max(3, view.cellSize * 0.1);
        ctx.setLineDash([Math.max(4, view.cellSize * 0.1), 5]);
      } else {
        ctx.strokeStyle = 'rgba(139, 234, 255, 0.58)';
        ctx.lineWidth = Math.max(2, view.cellSize * 0.06);
      }
      ctx.strokeRect(px + pad, py + pad, view.cellSize - pad * 2, view.cellSize - pad * 2);
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
  ctx.restore();
}

function getGemColor(state: GameState, gemId: string): string {
  for (let i = 0; i < state.config.gems.length; i++) {
    const gem = state.config.gems[i];
    if (gem.id === gemId) return gem.color;
  }
  return '#8beaff';
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
    const radius = view.cellSize * (0.18 + tower.tier * 0.025);
    if (state.selectedTile?.x === tower.x && state.selectedTile.y === tower.y) {
      ctx.strokeStyle = 'rgba(139, 234, 255, 0.42)';
      ctx.lineWidth = Math.max(1, view.cellSize * 0.025);
      ctx.beginPath();
      ctx.arc(cx, cy, tower.range * view.cellSize, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (tower.mvpAwards > 0) {
      ctx.strokeStyle = 'rgba(243, 202, 114, 0.72)';
      ctx.lineWidth = Math.max(2, view.cellSize * 0.04);
      ctx.beginPath();
      ctx.arc(cx, cy, view.cellSize * (0.34 + tower.mvpAwards * 0.018), 0, Math.PI * 2);
      ctx.stroke();
    }
    if (canDrawImage(gemImage)) {
      const sprite = atlas.metadata.gems[tower.gemId];
      if (sprite) {
        drawSprite(ctx, gemImage, sprite.frame, cx, cy, view.cellSize);
      } else {
        const basePortrait = getTowerBaseImage(tower.gemId);
        if (basePortrait) {
          drawTowerBaseImage(ctx, basePortrait, cx, cy, view.cellSize);
        } else {
          drawTowerFallback(ctx, cx, cy, radius, tower.color);
        }
      }
    } else {
      const basePortrait = getTowerBaseImage(tower.gemId);
      if (basePortrait) {
        drawTowerBaseImage(ctx, basePortrait, cx, cy, view.cellSize);
      } else {
        drawTowerFallback(ctx, cx, cy, radius, tower.color);
      }
    }
    if (tower.stopped) {
      ctx.strokeStyle = '#ff6f86';
      ctx.lineWidth = Math.max(2, view.cellSize * 0.045);
      ctx.beginPath();
      ctx.moveTo(cx - view.cellSize * 0.22, cy - view.cellSize * 0.22);
      ctx.lineTo(cx + view.cellSize * 0.22, cy + view.cellSize * 0.22);
      ctx.moveTo(cx + view.cellSize * 0.22, cy - view.cellSize * 0.22);
      ctx.lineTo(cx - view.cellSize * 0.22, cy + view.cellSize * 0.22);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawEnemies(ctx: CanvasRenderingContext2D, state: GameState, view: RenderViewState): void {
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  const atlas = getSpriteAtlas();
  const monsterImage = atlas.images.monsters;
  const selectedTargetId = getSelectedTargetId(state);
  for (let i = 0; i < state.enemies.length; i++) {
    const enemy = state.enemies[i];
    if (!enemy.alive) continue;
    const cx = enemy.x * view.cellSize + view.cellSize / 2;
    const cy = enemy.y * view.cellSize + view.cellSize / 2;
    const targeted = enemy.id === selectedTargetId;
    if (targeted) drawTargetIndicator(ctx, cx, cy, view.cellSize);
    if (enemy.invisible) ctx.globalAlpha = 0.48;
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
        drawEnemyBadges(ctx, enemy, cx, cy, view.cellSize);
        ctx.globalAlpha = 1;
        if (targeted) drawTargetIndicator(ctx, cx, cy, view.cellSize);
        continue;
      }
    }
    const radius = view.cellSize * 0.23;
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(216, 238, 244, 0.5)';
    ctx.lineWidth = Math.max(1, view.cellSize * 0.025);
    ctx.stroke();
    drawHealthBar(ctx, cx, cy - radius * 0.55, view.cellSize, enemy.hp / enemy.maxHp);
    drawEnemyBadges(ctx, enemy, cx, cy, view.cellSize);
    ctx.globalAlpha = 1;
    if (targeted) drawTargetIndicator(ctx, cx, cy, view.cellSize);
  }
  ctx.restore();
}

function getSelectedTargetId(state: GameState): number | null {
  const tile = state.selectedTile;
  if (!tile) return null;
  for (let i = 0; i < state.towers.length; i++) {
    const tower = state.towers[i];
    if (tower.x === tile.x && tower.y === tile.y) return tower.targetId;
  }
  return null;
}

function drawTargetIndicator(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
): void {
  const radius = cellSize * 0.43;
  const notch = cellSize * 0.16;
  ctx.save();
  ctx.strokeStyle = '#8beaff';
  ctx.lineWidth = Math.max(2, cellSize * 0.045);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - radius - notch, cy);
  ctx.lineTo(cx - radius + notch, cy);
  ctx.moveTo(cx + radius - notch, cy);
  ctx.lineTo(cx + radius + notch, cy);
  ctx.moveTo(cx, cy - radius - notch);
  ctx.lineTo(cx, cy - radius + notch);
  ctx.moveTo(cx, cy + radius - notch);
  ctx.lineTo(cx, cy + radius + notch);
  ctx.stroke();
  ctx.restore();
}

function drawEnemyBadges(
  ctx: CanvasRenderingContext2D,
  enemy: { flying: boolean; skills: readonly string[]; invisible: boolean },
  cx: number,
  cy: number,
  cellSize: number,
): void {
  let offset = 0;
  if (enemy.flying) offset = drawBadge(ctx, cx, cy, cellSize, offset, 'F', '#8beaff');
  if (enemy.invisible) offset = drawBadge(ctx, cx, cy, cellSize, offset, 'I', '#b8a5ff');
  if (enemy.skills.includes('magicImmune'))
    offset = drawBadge(ctx, cx, cy, cellSize, offset, 'M', '#ff6f86');
  if (enemy.skills.includes('physicalImmune'))
    drawBadge(ctx, cx, cy, cellSize, offset, 'P', '#f3ca72');
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
  offset: number,
  label: string,
  color: string,
): number {
  const size = Math.max(10, cellSize * 0.22);
  const x = cx - cellSize * 0.38 + offset * (size + 2);
  const y = cy + cellSize * 0.2;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#041016';
  ctx.font = `${Math.max(8, cellSize * 0.15)}px "Share Tech Mono"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + size / 2, y + size / 2);
  return offset + 1;
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
  ctx.strokeStyle = alpha < 1 ? 'rgba(216, 238, 244, 0.34)' : '#d8eef4';
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
  ctx.fillStyle = '#061018';
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
  ctx.strokeStyle = 'rgba(216, 238, 244, 0.62)';
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
  ctx.fillStyle = '#8df7b0';
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
  ctx.font = `${Math.max(11, view.cellSize * 0.22)}px "Share Tech Mono"`;
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
  ctx.fillStyle = 'rgba(4, 10, 15, 0.68)';
  ctx.fillRect(0, 0, view.width, view.height);
  ctx.fillStyle = '#d8eef4';
  ctx.font = `${Math.max(26, view.cellSize * 0.62)}px "Share Tech Mono"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label =
    state.status === 'paused' ? 'PAUSED' : state.status === 'won' ? 'VICTORY' : 'DEFEAT';
  ctx.fillText(label, view.width / 2, view.height / 2);
}

export function tileIsBuildableForPointer(state: GameState, tile: GridPoint): boolean {
  return isBuildable(state.config.map, state.occupied, tile.x, tile.y);
}
