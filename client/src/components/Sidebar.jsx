import UserCard from './UserCard';
import Leaderboard from './Leaderboard';

export default function Sidebar({ board, me, cooldown, myCount, total }) {
  return (
    <aside className="sidebar">
      <UserCard me={me} cooldown={cooldown} myCount={myCount} total={total} />
      <Leaderboard board={board} meId={me.id} />
    </aside>
  );
}
