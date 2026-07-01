import { loadGameContent } from '@facet/content'
import type { GameSnapshot } from '@facet/protocol'
import {
  GEM_FOOTPRINT,
  addStructure,
  buildFlyingPath,
  buildPathCache,
  createSimBoard,
  resolveTowerCombat,
  towerWorldCenter,
} from '@facet/sim'
import Phaser from 'phaser'
import { isDebugPathsEnabled } from '../debug.js'

const GROUND_PATH_COLOR = 0x3ddc84
const FLYING_PATH_COLOR = 0x4da3ff
const RANGE_RING_COLOR = 0xffd166

export class DebugOverlayLayer {
  private readonly graphics: Phaser.GameObjects.Graphics
  private readonly content = loadGameContent()
  private enabled: boolean

  constructor(scene: Phaser.Scene) {
    this.enabled = isDebugPathsEnabled()
    this.graphics = scene.add.graphics().setDepth(90).setVisible(this.enabled)
  }

  sync(snapshot: GameSnapshot): void {
    if (!this.enabled) return
    this.redraw(snapshot)
  }

  destroy(): void {
    this.graphics.destroy()
  }

  private redraw(snapshot: GameSnapshot): void {
    const g = this.graphics
    g.clear()

    const board = this.content.board
    const routeId = board.defaultRouteId
    const sim = createSimBoard(board)

    for (const tower of snapshot.towers) {
      addStructure(sim, {
        id: tower.id,
        gx: tower.gx,
        gy: tower.gy,
        kind: tower.specialId ? 'special' : 'tower',
        footprint: GEM_FOOTPRINT,
      })
    }
    for (const rock of snapshot.rocks) {
      addStructure(sim, {
        id: rock.id,
        gx: rock.gx,
        gy: rock.gy,
        kind: 'rock',
        footprint: GEM_FOOTPRINT,
      })
    }
    for (const candidate of snapshot.candidates) {
      addStructure(sim, {
        id: candidate.id,
        gx: candidate.gx,
        gy: candidate.gy,
        kind: 'candidate',
        footprint: GEM_FOOTPRINT,
      })
    }

    const pathCache = buildPathCache(board, sim, routeId)
    if (pathCache && pathCache.worldConcatenated.length > 1) {
      g.lineStyle(3, GROUND_PATH_COLOR, 0.9)
      const points = pathCache.worldConcatenated
      g.beginPath()
      g.moveTo(points[0]!.x, points[0]!.y)
      for (let i = 1; i < points.length; i++) {
        g.lineTo(points[i]!.x, points[i]!.y)
      }
      g.strokePath()
    }

    const flying = buildFlyingPath(board, routeId)
    if (flying.worldPoints.length > 1) {
      this.strokeDashedPolyline(g, flying.worldPoints, FLYING_PATH_COLOR, 3, 10, 8)
    }

    for (const tower of snapshot.towers) {
      if (!tower.active) continue
      const resolved = resolveTowerCombat(this.content, tower, tower.mvpStacks)
      if (!resolved) continue
      const center = towerWorldCenter(tower.gx, tower.gy)
      g.lineStyle(1, RANGE_RING_COLOR, 0.35)
      g.strokeCircle(center.x, center.y, resolved.stats.range)
    }
  }

  private strokeDashedPolyline(
    g: Phaser.GameObjects.Graphics,
    points: Array<{ x: number; y: number }>,
    color: number,
    width: number,
    dash: number,
    gap: number,
  ): void {
    g.lineStyle(width, color, 0.85)
    for (let i = 1; i < points.length; i++) {
      this.strokeDashedSegment(g, points[i - 1]!, points[i]!, dash, gap)
    }
  }

  private strokeDashedSegment(
    g: Phaser.GameObjects.Graphics,
    from: { x: number; y: number },
    to: { x: number; y: number },
    dash: number,
    gap: number,
  ): void {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const length = Math.hypot(dx, dy)
    if (length === 0) return

    const ux = dx / length
    const uy = dy / length
    let traveled = 0
    let draw = true

    while (traveled < length) {
      const segment = Math.min(draw ? dash : gap, length - traveled)
      const x0 = from.x + ux * traveled
      const y0 = from.y + uy * traveled
      const x1 = from.x + ux * (traveled + segment)
      const y1 = from.y + uy * (traveled + segment)
      if (draw) {
        g.beginPath()
        g.moveTo(x0, y0)
        g.lineTo(x1, y1)
        g.strokePath()
      }
      traveled += segment
      draw = !draw
    }
  }
}
