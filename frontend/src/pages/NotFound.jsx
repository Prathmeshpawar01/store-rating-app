import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { isAuthenticated, homePath } = useAuth();
  return (
    <main className="notfound">
      <div>
        <div className="notfound-code">404</div>
        <h1 style={{ marginTop: 12 }}>This page doesn’t exist</h1>
        <p style={{ color: 'var(--muted)', margin: '8px 0 20px' }}>Check the address, or head back to where you started.</p>
        <Link className="btn btn-primary" to={isAuthenticated ? homePath : '/login'}>
          {isAuthenticated ? 'Go to my dashboard' : 'Go to login'}
        </Link>
      </div>
    </main>
  );
}
