import { Link, useParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import RatingStamp, { RatingDistribution } from '../../components/RatingStamp';
import RatingStars from '../../components/RatingStars';
import { EmptyState, ErrorState } from '../../components/States';
import useAsync from '../../hooks/useAsync';
import { adminApi } from '../../services/api';
import { formatDate, formatDateTime } from '../../utils/format';

export default function AdminStoreDetails() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(() => adminApi.store(id), [id]);

  const back = (
    <Link to="/admin/stores" className="back-link">
      <Icon name="chevronLeft" /> Stores
    </Link>
  );

  if (loading && !data) return <Loading label="Loading store…" />;
  if (error) {
    return (
      <>
        {back}
        <div className="panel">
          <ErrorState error={error} onRetry={reload} title="Could not load this store" />
        </div>
      </>
    );
  }

  const { store } = data;

  return (
    <>
      {back}
      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="detail-hero">
          <div style={{ minWidth: 0, flex: '1 1 320px' }}>
            <h1>{store.name}</h1>
            <dl className="def-list">
              <dt>Store email</dt>
              <dd>{store.email}</dd>
              <dt>Address</dt>
              <dd>{store.address}</dd>
              <dt>Store owner</dt>
              <dd>
                <Link to={`/admin/users/${store.owner.id}`}>{store.owner.name}</Link>
              </dd>
              <dt>Owner email</dt>
              <dd>{store.owner.email}</dd>
              <dt>Added</dt>
              <dd>{formatDate(store.createdAt)}</dd>
            </dl>
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <RatingStamp value={store.averageRating} count={store.totalRatings} />
            {store.totalRatings > 0 && (
              <div style={{ width: 220 }}>
                <RatingDistribution distribution={store.ratingDistribution} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="raters">
        <div className="panel-head">
          <h2 id="raters">Users who rated this store ({store.totalRatings})</h2>
        </div>
        {store.ratings.length === 0 ? (
          <EmptyState icon="star" title="No ratings yet">
            Ratings appear here as soon as customers rate this store.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User name</th>
                  <th className="hide-sm">User email</th>
                  <th>Rating</th>
                  <th className="hide-sm">Rating date</th>
                </tr>
              </thead>
              <tbody>
                {store.ratings.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/admin/users/${r.user.id}`} className="cell-strong">
                        {r.user.name}
                      </Link>
                      <div className="cell-sub show-sm">
                        {r.user.email}
                      </div>
                    </td>
                    <td className="hide-sm">{r.user.email}</td>
                    <td>
                      <RatingStars value={r.rating} />
                      <span className="sr-only">{r.rating} out of 5</span>
                    </td>
                    <td className="hide-sm" title={`Submitted ${formatDateTime(r.createdAt)}`}>
                      {formatDate(r.updatedAt)}
                      {r.updatedAt !== r.createdAt && <div className="cell-sub">Edited</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
