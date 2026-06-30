const COOLDOWN_MS = 3000;

export default function UserCard({ me, cooldown, myCount, total }) {
  const pct = cooldown > 0 ? (cooldown / COOLDOWN_MS) * 100 : 0;
  const share = total > 0 ? ((myCount / total) * 100).toFixed(1) : '0.0';
  const isReady = cooldown <= 0;

  return (
    <div className="user-card">
      <div className="uc-top">
        <span className="uc-avatar" style={{ background: me.color }} />
        <div className="uc-info">
          <div className="uc-name">{me.name}</div>
          <div className="uc-tag">you</div>
        </div>
      </div>

      <div className="uc-stats">
        <div className="stat-block">
          <span className="stat-val">{myCount}</span>
          <span className="stat-lbl">tiles</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-block">
          <span className="stat-val">{share}%</span>
          <span className="stat-lbl">of board</span>
        </div>
      </div>

      <div className="cd-track">
        <div
          className="cd-fill"
          style={{ width: `${pct}%`, opacity: isReady ? 0 : 1 }}
        />
      </div>
      <p className={`cd-label${isReady ? ' ready' : ''}`}>
        {isReady ? 'ready to capture' : `cooldown — ${(cooldown / 1000).toFixed(1)}s`}
      </p>
    </div>
  );
}
