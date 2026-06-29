import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createFacetState,
  dispatchFacet,
  facetSnapshot,
  type FacetAction,
  type FacetSnapshot,
} from '@facet/sim';

export function useFacetGame(seed = 42) {
  const initial = useMemo(() => createFacetState(seed), [seed]);
  const stateRef = useRef(initial);
  const [snapshot, setSnapshot] = useState<FacetSnapshot>(() => facetSnapshot(initial));

  const dispatch = (action: FacetAction) => {
    dispatchFacet(stateRef.current, action);
    setSnapshot(facetSnapshot(stateRef.current));
  };

  useEffect(() => {
    if (snapshot.phase !== 'wave') return;
    let frame: number;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      dispatchFacet(stateRef.current, { type: 'TICK', dt });
      setSnapshot(facetSnapshot(stateRef.current));
      if (stateRef.current.phase === 'wave') {
        frame = requestAnimationFrame(loop);
      }
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [snapshot.phase, snapshot.wave]);

  return { snapshot, dispatch, state: stateRef };
}
