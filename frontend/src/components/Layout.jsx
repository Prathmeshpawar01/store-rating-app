import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { NAV_ITEMS } from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

const AREA_TITLES = { ADMIN: 'Administration', USER: 'Browse and rate stores', OWNER: 'Store owner' };

/** Authenticated shell: sidebar + top bar + routed page. */
export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const current = (NAV_ITEMS[user?.role] || []).find((i) => location.pathname.startsWith(i.to));
  const title = current?.label || AREA_TITLES[user?.role] || '';

  useEffect(() => {
    document.title = title ? `${title} · StoreRate` : 'StoreRate';
  }, [title]);

  return (
    <div className="shell">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      <div className={`backdrop ${menuOpen ? 'show' : ''}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <div className="main-col">
        <Navbar title={title} onMenu={() => setMenuOpen((o) => !o)} menuOpen={menuOpen} />
        <main className="content" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
