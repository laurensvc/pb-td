import { Hammer, Map, X } from 'lucide-react';
import { gameConfig, getGem } from '../game/config';
import type { GameSnapshot, TowerShopItem } from '../game/types';
import type { GameController } from '../hooks/useGameController';
import { getTowerTags } from './uiTags';

interface BottomBuildBarProps {
  controller: GameController;
  snapshot: GameSnapshot;
}

export function BottomBuildBar({ controller, snapshot }: BottomBuildBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-tactical-cyan/25 bg-[#061018]/92 px-2 py-2 shadow-[0_-20px_60px_rgb(0_0_0_/_0.38)] backdrop-blur-xl sm:px-3">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-2 lg:flex-row lg:items-stretch">
        <div className="pixel-stat flex min-w-[13rem] items-center justify-between gap-3 px-3 py-2">
          <div className="min-w-0">
            <div className="font-display text-xs uppercase text-tactical-amber">Maze Blocks</div>
            <div className="font-display text-2xl leading-none text-tactical-ink">
              {snapshot.bankedMazeBlocks}
            </div>
          </div>
          <button
            className={`arcade-button-secondary px-3 py-2 text-sm font-black ${
              snapshot.buildMode === 'mazeBlock' ? 'border-tactical-cyan/80' : ''
            }`}
            disabled={!snapshot.canPlaceMazeBlock}
            onClick={() => controller.dispatch({ type: 'placeMazeBlock', x: -1, y: -1 })}
          >
            <Map size={15} />
            PLACE
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-display text-xs uppercase text-tactical-cyan">
              <Hammer size={14} />
              Tower Shop
            </div>
            {snapshot.selectedShopGemId ? (
              <button
                className="arcade-mini"
                onClick={() => controller.dispatch({ type: 'clearShopSelection' })}
              >
                <X size={13} />
                Clear
              </button>
            ) : null}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {snapshot.towerShop.map((item) => (
              <ShopCard
                key={item.gemId}
                item={item}
                active={snapshot.selectedShopGemId === item.gemId}
                affordable={snapshot.gold >= item.cost}
                onSelect={() => controller.dispatch({ type: 'selectShopTower', gemId: item.gemId })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopCard({
  active,
  affordable,
  item,
  onSelect,
}: {
  active: boolean;
  affordable: boolean;
  item: TowerShopItem;
  onSelect: () => void;
}) {
  const gem = getGem(gameConfig, item.gemId);
  const tags = getTowerTags(gem, 3);
  return (
    <button
      type="button"
      className={`pixel-row min-h-[5.65rem] min-w-[12.5rem] items-start text-left ${
        active ? 'pixel-row-active' : ''
      }`}
      disabled={!affordable}
      onClick={onSelect}
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-black text-tactical-ink">
          <span className="gem-chip h-6 w-6 shrink-0" style={{ background: gem.color }} />
          <span className="truncate capitalize">{gem.family}</span>
          <span className="font-display text-tactical-amber">{item.cost}G</span>
        </span>
        <span className="mt-1 block text-xs text-tactical-muted">
          {gem.damage} dmg | {gem.range.toFixed(1)} rng | {gem.cooldown.toFixed(2)}s
        </span>
        <span className="mt-1 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="border border-tactical-cyan/30 bg-tactical-cyan/10 px-1.5 py-0.5 font-display text-[0.62rem] uppercase leading-none text-tactical-cyan"
            >
              {tag}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}
