import { NavLink, Link } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';

export const NAV_ITEMS = {
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/admin/users', label: 'Users', icon: 'users' },
    { to: '/admin/stores', label: 'Stores', icon: 'store' },
    { to: '/admin/change-password', label: 'Change password', icon: 'lock' },
  ],
  USER: [
    { to: '/user/stores', label: 'Stores', icon: 'store' },
    { to: '/user/change-password', label: 'Change password', icon: 'lock' },
  ],
  OWNER: [
    { to: '/owner/dashboard', label: 'My store', icon: 'dashboard' },
    { to: '/owner/ratings', label: 'Ratings', icon: 'star' },
    { to: '/owner/change-password', label: 'Change password', icon: 'lock' },
  ],
};

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#2a3347" />
      <path
        d="M16 6.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L16 21.3l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z"
        fill="#E9A100"
      />
    </svg>
  );
}

export default function Sidebar({ open, onNavigate }) {
  const { user, homePath } = useAuth();
  const items = NAV_ITEMS[user?.role] || [];

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} id="app-sidebar" aria-label="Main navigation">
      <Link to={homePath} className="brand" onClick={onNavigate}>
        <BrandMark />
        StoreRate
      </Link>
      <nav>
        <ul className="nav-list">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className="nav-link" onClick={onNavigate}>
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-foot">Ratings are 1 to 5 stars. One rating per store per person.</div>
    </aside>
  );
}
