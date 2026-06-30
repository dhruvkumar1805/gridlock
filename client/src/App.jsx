import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from './socket';
import Header from './components/Header';
import Grid from './components/Grid';
import Sidebar from './components/Sidebar';

const COOLDOWN_MS = 3000;

export default function App() {
  const [cells, setCells] = useState(null);
  const [me, setMe] = useState(null);
  const [online, setOnline] = useState(0);
  const [board, setBoard] = useState([]);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const rafRef = useRef(null);
  const cooldownEndRef = useRef(0);

  const tickCooldown = useCallback(() => {
    const remaining = cooldownEndRef.current - Date.now();
    if (remaining <= 0) {
      setCooldownLeft(0);
      return;
    }
    setCooldownLeft(remaining);
    rafRef.current = requestAnimationFrame(tickCooldown);
  }, []);

  useEffect(() => {
    socket.connect();

    socket.on('hello', ({ grid, you, online }) => {
      const savedName = localStorage.getItem('gl_name');
      if (savedName && savedName !== you.name) {
        socket.emit('rename', savedName);
        you = { ...you, name: savedName };
      }
      setCells(grid);
      setMe(you);
      setOnline(online);
    });

    socket.on('online', setOnline);

    socket.on('claimed', ({ idx, owner, color, name, ts }) => {
      setCells(prev => {
        if (!prev) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], owner, color, name, ts };
        return next;
      });
    });

    socket.on('leaderboard', setBoard);

    socket.on('denied', ({ wait }) => {
      cooldownEndRef.current = Date.now() + wait;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tickCooldown);
    });

    return () => {
      socket.off('hello');
      socket.off('online');
      socket.off('claimed');
      socket.off('leaderboard');
      socket.off('denied');
      socket.disconnect();
    };
  }, [tickCooldown]);

  const claim = useCallback((idx) => {
    socket.emit('claim', idx);
    cooldownEndRef.current = Date.now() + COOLDOWN_MS;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tickCooldown);
  }, [tickCooldown]);

  const rename = useCallback((name) => {
    const clean = name.trim();
    if (!clean) return;
    socket.emit('rename', clean);
    localStorage.setItem('gl_name', clean);
    setMe(prev => prev ? { ...prev, name: clean } : prev);
  }, []);

  if (!cells || !me) {
    return (
      <div className="splash">
        <span className="splash-dot" />
        <span>connecting...</span>
      </div>
    );
  }

  const myCount = cells.reduce((n, c) => n + (c.owner === me.id ? 1 : 0), 0);

  return (
    <div className="app">
      <Header online={online} me={me} onRename={rename} cooldown={cooldownLeft} />
      <div className="layout">
        <Grid cells={cells} me={me} onClaim={claim} cooldown={cooldownLeft} />
        <Sidebar board={board} me={me} cooldown={cooldownLeft} myCount={myCount} total={cells.length} />
      </div>
    </div>
  );
}
