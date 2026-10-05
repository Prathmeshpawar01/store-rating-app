import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function StatCard({ label, value, icon, note, to, loading }) {
  const body = (
    <>
      <span className="stat-label">
        {icon && <Icon name={icon} />}
        {label}
      </span>
      {loading ? (
        <span className="skeleton" style={{ height: 36, width: 72 }} />
      ) : (
        <span className="stat-value">{value}</span>
      )}
      {note && <span className="stat-note">{note}</span>}
    </>
  );
  return to ? (
    <Link to={to} className="stat">
      {body}
    </Link>
  ) : (
    <div className="stat">{body}</div>
  );
}
