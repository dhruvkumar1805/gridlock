import { useState } from 'react';

export default function Header({ online, me, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEdit = () => {
    setDraft(me.name);
    setEditing(true);
  };

  const commit = () => {
    const name = draft.trim();
    if (name && name !== me.name) onRename(name);
    setEditing(false);
  };

  const onKey = (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  };

  return (
    <header className="header">
      <span className="logo">Gridlock</span>

      <div className="header-user">
        <span className="color-chip" style={{ background: me.color }} />
        {editing ? (
          <input
            className="name-input"
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKey}
            maxLength={18}
            spellCheck={false}
          />
        ) : (
          <button className="name-btn" onClick={startEdit} title="click to rename">
            {me.name}
          </button>
        )}
      </div>

      <div className="header-spacer" />

      <div className="online-badge">
        <span className="live-dot" />
        <span>{online} online</span>
      </div>
    </header>
  );
}
