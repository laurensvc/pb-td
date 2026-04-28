import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

const tiles = [
  { label: 'PB TD', className: 'bento-intro-tile-title' },
  { label: 'Forge', className: 'bento-intro-tile-gold' },
  { label: 'Maze', className: 'bento-intro-tile-board' },
  { label: 'Gems', className: 'bento-intro-tile-green' },
  { label: 'Waves', className: 'bento-intro-tile-red' },
  { label: 'Castle', className: 'bento-intro-tile-cyan' },
] as const;

export function BentoIntro() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 1850);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className="bento-intro" aria-hidden="true">
      <div className="bento-intro-grid">
        {tiles.map((tile, index) => (
          <div
            key={tile.label}
            className={`bento-intro-tile ${tile.className}`}
            style={{ '--bento-index': index } as CSSProperties}
          >
            <span>{tile.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
