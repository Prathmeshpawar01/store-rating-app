import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import RatingStamp, { RatingDistribution } from '../../components/RatingStamp';
import RatingStars from '../../components/RatingStars';
import StatCard from '../../components/StatCard';
import { EmptyState, ErrorState } from '../../components/States';
import useAsync from '../../hooks/useAsync';
import { ownerApi } from '../../services/api';
import { formatDate, plural } from '../../utils/format';

export default function OwnerDashboard() {
  const dash = useAsync(() => ownerApi.dashboard(), []);
  const recent = useAsync(() => ownerApi.ratings({ sortBy: 'date', order: 'desc', limit: 5 }), []);

  if (dash.loading && !dash.data) return <Loading label="Loading your store…" />;
  if (dash.error) {
    return (
      <div className="panel">
        <ErrorState error={dash.error} onRetry={dash.reload} />
      </div>
    );
  }

  const { stores, summary } = dash.data;

  if (stores.length === 0) {
    return (
      <>
        <div className="page-head">
          <h1>My store</h1>
        </div>
        <div className="panel">
          <EmptyState icon="store" title="No store is linked to your account yet">
            Ask the administrator to assign your store to this account. Ratings will appear here once it’s set up.
          </EmptyState>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{stores.length === 1 ? 'My store' : 'My stores'}</h1>
          <p>How customers rate your {stores.length === 1 ? 'store' : 'stores'}.</p>
        </div>
        <div className="page-actions">
          <Link to="/owner/ratings" className="btn btn-primary">
            <Icon name="list" /> See all ratings
          </Link>
        </div>
      </div>

      <section className="panel" style={{ marginBottom: 16 }} aria-label="Store ratings">
        {stores.map((s) => (
          <div className="store-hero" key={s.id}>
            <div style={{ minWidth: 0 }}>
              <h2>{s.name}</h2>
              <div className="store-card-addr">
                <Icon name="pin" />
                <span>{s.address}</span>
              </div>
              <Link to={`/owner/ratings?storeId=${s.id}`} className="btn btn-ghost btn-sm" style={{ marginTop: 10, paddingLeft: 0 }}>
                View ratings for this store
              </Link>
            </div>
            <div className="store-hero-stats">
              <RatingStamp value={s.averageRating} count={s.totalRatings} label={`Average rating for ${s.name}`} />
            </div>
          </div>
        ))}
      </section>

      <div className="stat-grid">
        <StatCard
          label="Average rating"
          icon="star"
          value={summary.averageRating === null ? '—' : summary.averageRating.toFixed(1)}
          note={stores.length > 1 ? 'Across all your stores' : 'Out of 5'}
        />
        <StatCard label="Total ratings" icon="list" value={summary.totalRatings} to="/owner/ratings" />
        <StatCard label="Customers who rated" icon="users" value={summary.uniqueRaters} />
        <StatCard label="Stores" icon="store" value={summary.totalStores} />
      </div>

      <div className="two-col">
        <section className="panel" aria-labelledby="recent">
          <div className="panel-head">
            <h2 id="recent">Latest ratings</h2>
            <Link to="/owner/ratings" className="btn btn-ghost btn-sm">
              All ratings
            </Link>
          </div>
          {recent.loading && !recent.data ? (
            <Loading />
          ) : recent.error ? (
            <ErrorState error={recent.error} onRetry={recent.reload} />
          ) : recent.data.items.length === 0 ? (
            <EmptyState icon="star" title="No ratings yet">
              When customers rate your store, you’ll see who rated and what they gave.
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>User name</th>
                    <th>Rating</th>
                    <th className="hide-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.data.items.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className="cell-strong">{r.user.name}</span>
                        <div className="cell-sub">{r.user.email}</div>
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

        <section className="panel panel-pad" aria-labelledby="breakdown">
          <h2 id="breakdown" style={{ marginBottom: 6 }}>
            Rating breakdown
          </h2>
          <p className="cell-sub" style={{ marginBottom: 16 }}>
            {plural(summary.totalRatings, 'rating')} in total
          </p>
          <RatingDistribution distribution={summary.ratingDistribution} />
        </section>
      </div>
    </>
  );
}
