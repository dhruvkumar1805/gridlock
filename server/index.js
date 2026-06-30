const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const isProd = process.env.NODE_ENV === 'production';

const io = new Server(server, {
  cors: isProd ? false : {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

if (isProd) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

const COLS = 50;
const ROWS = 40;
const TOTAL = COLS * ROWS;
const COOLDOWN_MS = 3000;

const PALETTE = [
  '#e63946', '#2a9d8f', '#457b9d', '#e9c46a', '#f4a261',
  '#e76f51', '#8ecae6', '#06d6a0', '#ef476f', '#ffd166',
  '#8338ec', '#3a86ff', '#fb8500', '#118ab2', '#c77dff',
  '#06d6a0', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
];

const grid = Array.from({ length: TOTAL }, (_, i) => ({
  i,
  owner: null,
  color: null,
  name: null,
  ts: null,
}));

const users = new Map();

function buildLeaderboard() {
  const tally = {};
  for (const cell of grid) {
    if (!cell.owner) continue;
    if (!tally[cell.owner]) {
      tally[cell.owner] = { id: cell.owner, name: cell.name, color: cell.color, cells: 0 };
    }
    tally[cell.owner].cells++;
  }
  return Object.values(tally).sort((a, b) => b.cells - a.cells).slice(0, 15);
}

io.on('connection', (socket) => {
  const color = PALETTE[users.size % PALETTE.length];
  const user = {
    id: socket.id,
    name: `anon_${socket.id.slice(0, 5)}`,
    color,
    lastCapture: 0,
  };
  users.set(socket.id, user);

  socket.emit('hello', {
    grid,
    you: { id: socket.id, color, name: user.name },
    online: users.size,
  });

  io.emit('online', users.size);

  socket.on('rename', (raw) => {
    const name = String(raw ?? '').trim().replace(/[^\w\s\-\.]/g, '').slice(0, 18);
    if (!name) return;
    user.name = name;
    for (const cell of grid) {
      if (cell.owner === socket.id) cell.name = name;
    }
    io.emit('leaderboard', buildLeaderboard());
  });

  socket.on('claim', (idx) => {
    if (typeof idx !== 'number' || idx < 0 || idx >= TOTAL) return;

    const now = Date.now();
    const wait = COOLDOWN_MS - (now - user.lastCapture);
    if (wait > 0) {
      socket.emit('denied', { wait });
      return;
    }

    const cell = grid[idx];
    if (cell.owner === socket.id) return;

    cell.owner = socket.id;
    cell.color = user.color;
    cell.name = user.name;
    cell.ts = now;
    user.lastCapture = now;

    io.emit('claimed', {
      idx,
      owner: socket.id,
      color: user.color,
      name: user.name,
      ts: now,
    });

    io.emit('leaderboard', buildLeaderboard());
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    io.emit('online', users.size);
    io.emit('leaderboard', buildLeaderboard());
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`gridlock server on :${PORT}`));
