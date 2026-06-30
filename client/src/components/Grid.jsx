import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cell from './Cell';

const COLS = 50;
const ROWS = 40;
const CELL = 18;
const GAP = 2;
const STEP = CELL + GAP;

export default function Grid({ cells, me, onClaim, cooldown }) {
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;

  const containerRef = useRef(null);
  const hasMoved = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const coolingRef = useRef(false);
  coolingRef.current = cooldown > 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gridW = COLS * STEP;
    const gridH = ROWS * STEP;
    setView(v => ({
      ...v,
      x: Math.max(20, (rect.width - gridW) / 2),
      y: Math.max(20, (rect.height - gridH) / 2),
    }));
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const { x, y, scale } = viewRef.current;
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    const newScale = Math.min(2.8, Math.max(0.3, scale * factor));
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const gx = (cx - x) / scale;
    const gy = (cy - y) / scale;
    setView({ x: cx - gx * newScale, y: cy - gy * newScale, scale: newScale });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    hasMoved.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    lastPos.current = { x: e.clientX, y: e.clientY };

    const onMove = (ev) => {
      const dx = ev.clientX - lastPos.current.x;
      const dy = ev.clientY - lastPos.current.y;
      const totalDx = ev.clientX - startPos.current.x;
      const totalDy = ev.clientY - startPos.current.y;
      if (Math.abs(totalDx) > 4 || Math.abs(totalDy) > 4) {
        hasMoved.current = true;
      }
      lastPos.current = { x: ev.clientX, y: ev.clientY };
      setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const handleCellClick = useCallback((idx) => {
    if (hasMoved.current || coolingRef.current) return;
    onClaim(idx);
  }, [onClaim]);

  const zoom = useCallback((factor) => {
    setView(v => ({ ...v, scale: Math.min(2.8, Math.max(0.3, v.scale * factor)) }));
  }, []);

  const resetView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setView({
      x: Math.max(20, (rect.width - COLS * STEP) / 2),
      y: Math.max(20, (rect.height - ROWS * STEP) / 2),
      scale: 1,
    });
  }, []);

  const cellElements = useMemo(() =>
    cells.map((cell, i) => (
      <Cell
        key={i}
        cell={cell}
        isMe={cell.owner === me.id}
        onClick={handleCellClick}
        idx={i}
        myColor={me.color}
      />
    )),
    [cells, me.id, me.color, handleCellClick]
  );

  const { x, y, scale } = view;
  const claimed = useMemo(() => cells.filter(c => c.owner).length, [cells]);
  const pctClaimed = ((claimed / cells.length) * 100).toFixed(1);

  return (
    <div
      className="grid-container"
      ref={containerRef}
      onMouseDown={onMouseDown}
      data-cooling={cooldown > 0}
    >
      <div
        className="grid-inner"
        style={{
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
          gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
        }}
      >
        {cellElements}
      </div>

      <div className="zoom-controls">
        <button className="zoom-btn" onClick={() => zoom(1.25)} title="zoom in">+</button>
        <button className="zoom-btn" onClick={() => zoom(0.8)} title="zoom out">−</button>
        <button className="zoom-btn reset-btn" onClick={resetView} title="reset view">fit</button>
      </div>

      <div className="grid-stats">
        <span className="gs-num">{claimed}</span>
        <span className="gs-sep">/</span>
        <span>{cells.length} tiles claimed</span>
        <span className="gs-pct">({pctClaimed}%)</span>
      </div>

      <div className="grid-hint">scroll to zoom · drag to pan · click to claim</div>
    </div>
  );
}
