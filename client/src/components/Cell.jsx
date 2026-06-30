import { memo, useEffect, useRef, useState } from 'react';

const Cell = memo(function Cell({ cell, isMe, onClick, idx, myColor }) {
  const [burst, setBurst] = useState(false);
  const prevTs = useRef(cell.ts);

  useEffect(() => {
    if (cell.ts !== prevTs.current && cell.ts != null) {
      prevTs.current = cell.ts;
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 350);
      return () => clearTimeout(t);
    }
  }, [cell.ts]);

  const claimed = !!cell.owner;

  const style = claimed
    ? { backgroundColor: cell.color }
    : { '--preview': myColor };

  return (
    <div
      className={`cell${claimed ? ' claimed' : ''}${isMe ? ' mine' : ''}${burst ? ' burst' : ''}`}
      style={style}
      onClick={() => onClick(idx)}
      title={cell.name || undefined}
    />
  );
});

export default Cell;
