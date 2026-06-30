export default function Leaderboard({ board, meId }) {
  return (
    <div className="leaderboard">
      <h3 className="lb-title">Leaderboard</h3>

      {board.length === 0 ? (
        <p className="lb-empty">no captures yet — be the first!</p>
      ) : (
        <ol className="lb-list">
          {board.map((entry, i) => {
            const isMe = entry.id === meId;
            return (
              <li key={entry.id} className={`lb-row${isMe ? ' lb-me' : ''}`}>
                <span className="lb-rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <span className="lb-dot" style={{ background: entry.color }} />
                <span className="lb-name">{entry.name}</span>
                <span className="lb-count">{entry.cells}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
