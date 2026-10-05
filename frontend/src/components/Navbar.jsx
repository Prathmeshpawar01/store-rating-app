import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { initials, ROLE_LABELS } from '../utils/format';

export default function Navbar({ title, onMenu, menuOpen }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn menu-toggle"
        onClick={onMenu}
        aria-label="Open navigation"
        aria-expanded={menuOpen}
        aria-controls="app-sidebar"
      >
        <Icon name="menu" />
      </button>
      <span className="topbar-title">{title}</span>
      <span className="topbar-spacer" />
      {user && (
        <div className="user-chip">
          <span className="avatar" aria-hidden="true">
            {initials(user.name)}
          </span>
          <span className="user-chip-text">
            <span className="user-chip-name">{user.name}</span>
            <span className="user-chip-role">{ROLE_LABELS[user.role]}</span>
          </span>
        </div>
      )}
      <button type="button" className="btn btn-ghost" onClick={handleLogout}>
        <Icon name="logout" />
        <span className="hide-sm">Log out</span>
      </button>
    </header>
  );
}
