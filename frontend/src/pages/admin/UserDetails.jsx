import { Link, useParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import RoleBadge from '../../components/RoleBadge';
import RatingStamp from '../../components/RatingStamp';
import RatingStars, { RatingPill } from '../../components/RatingStars';
import { EmptyState, ErrorState } from '../../components/States';
import useAsync from '../../hooks/useAsync';
import { adminApi } from '../../services/api';
import { formatDate, formatDateTime, plural } from '../../utils/format';

export default function AdminUserDetails() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(() => adminApi.user(id), [id]);

  if (loading && !data) return <Loading label="Loading user…" />;
  if (error) {
    return (
      <>
        <Link to="/admin/users" className="back-link">
          <Icon name="chevronLeft" /> Users
        </Link>
        <div className="panel">
          <ErrorState error={error} onRetry={reload} title="Could not load this user" />
        </div>
      </>
    );
  }

  const { user } = data;

  return (
    <>
      <Link to="/admin/users" className="back-link">
        <Icon name="chevronLeft" /> Users
      </Link>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="detail-hero">
          <div style={{ minWidth: 0, flex: '1 1 320px' }}>
            <RoleBadge role={user.role} />
            <h1 style={{ marginTop: 10 }}>{user.name}</h1>
            <dl className="def-list">
              <dt>Email</dt>
              <dd>{user.email}</dd>
              <dt>Address</dt>
              <dd>{user.address}</dd>
              <dt>Created</dt>
              <dd>{formatDateTime(user.createdAt)}</dd>
              <dt>Last updated</dt>
              <dd>{formatDateTime(user.updatedAt)}</dd>
            </dl>
          </div>
          {user.role === 'OWNER' && (
            <div>
              <div className="mini-label">Rating across their stores</div>
              <RatingStamp value={user.ownerRating} count={user.ownerTotalRatings} />
            </div>
          )}
        </div>
      </section>

      {user.role === 'OWNER' && (
        <section className="panel" aria-labelledby="owned">
          <div className="panel-head">
            <h2 id="owned">Stores owned ({user.stores.length})</h2>
          </div>
          {user.stores.length === 0 ? (
            <EmptyState icon="store" title="No stores assigned">
              Assign a store to this owner from the Stores page.
            </EmptyState>
          ) : (
            user.stores.map((s) => (
              <div className="owner-store" key={s.id}>
                <div style={{ minWidth: 0 }}>
                  <Link to={`/admin/stores/${s.id}`} className="cell-strong">
                    {s.name}
                  </Link>
                  <div className="cell-sub">{s.address}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="cell-sub">{plural(s.totalRatings, 'rating')}</span>
                  <RatingPill value={s.averageRating} />
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {user.role === 'USER' && (
        <section className="panel" aria-labelledby="given">
          <div className="panel-head">
            <h2 id="given">Ratings submitted ({user.ratings.length})</h2>
          </div>
          {user.ratings.length === 0 ? (
            <EmptyState icon="star" title="No ratings yet">
              This user hasn’t rated any stores.
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Store</th>
                    <th>Rating</th>
                    <th className="hide-sm">Last updated</th>
                  </tr>
                </thead>
                <tbody>
                  {user.ratings.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link to={`/admin/stores/${r.store.id}`} className="cell-strong">
                          {r.store.name}
                        </Link>
                      </td>
                      <td>
                        <RatingStars value={r.rating} />
                      </td>
                      <td className="hide-sm">{formatDate(r.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
