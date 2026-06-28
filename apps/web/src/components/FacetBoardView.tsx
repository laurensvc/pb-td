import type { ReactNode } from 'react';
import { facetBoard } from '@facet/sim';
import type { FacetSnapshot } from '@facet/sim';

const CELL = 22;

export function FacetBoardView({
  snapshot,
  onCellClick,
}: {
  snapshot: FacetSnapshot;
  onCellClick: (x: number, y: number) => void;
}) {
  const blocked = new Set(facetBoard.blocked.map(([x, y]) => `${x},${y}`));
  const rocks = new Set(snapshot.rocks.map((r) => `${r.x},${r.y}`));
  const towers = new Map(snapshot.towers.map((t) => [`${t.x},${t.y}`, t]));

  const cells: ReactNode[] = [];
  for (let y = 0; y < facetBoard.height; y++) {
    for (let x = 0; x < facetBoard.width; x++) {
      const key = `${x},${y}`;
      const isSpawn = x === facetBoard.spawn.x && y === facetBoard.spawn.y;
      const isExit = x === facetBoard.exit.x && y === facetBoard.exit.y;
      const tower = towers.get(key);
      let cls = 'facet-cell buildable';
      if (blocked.has(key)) cls = 'facet-cell blocked';
      else if (isSpawn) cls = 'facet-cell spawn';
      else if (isExit) cls = 'facet-cell exit';
      else if (rocks.has(key)) cls = 'facet-cell rock';
      else if (tower) cls = `facet-cell tower family-${tower.family}`;

      cells.push(
        <button
          key={key}
          type="button"
          className={cls}
          style={{ left: x * CELL, top: y * CELL, width: CELL, height: CELL }}
          onClick={() => onCellClick(x, y)}
          title={tower ? `${tower.family} T${tower.tier}` : key}
        />,
      );
    }
  }

  return (
    <div
      className="facet-board-wrap"
      style={{ width: facetBoard.width * CELL, height: facetBoard.height * CELL }}
    >
      <div className="facet-board">{cells}</div>
      {snapshot.enemies.map((e) => (
        <div
          key={e.id}
          className="facet-enemy"
          style={{
            left: e.x * CELL,
            top: e.y * CELL,
            width: CELL * 0.8,
            height: CELL * 0.8,
          }}
        />
      ))}
    </div>
  );
}
