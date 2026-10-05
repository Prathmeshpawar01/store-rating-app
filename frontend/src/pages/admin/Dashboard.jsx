import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import Icon from '../../components/Icon';
import RatingStamp from '../../components/RatingStamp';
import { RatingPill } from '../../components/RatingStars';
import { ErrorState, EmptyState } from '../../components/States';
import { TableSkeleton } from '../../components/Loading';
import AddUserModal from '../../components/admin/AddUserModal';
import AddStoreModal from '../../components/admin/AddStoreModal';
import useAsync from '../../hooks/useAsync';
import { adminApi } from '../../services/api';
import { plural } from '../../utils/format';

export default function AdminDashboard() {
  const [modal, setModal] = useState(null); // 'store' | 'USER' | 'ADMIN' | 'OWNER'
  const [backToStore, setBackToStore] = useState(false);
  const userRole = ['USER', 'ADMIN', 'OWNER'].includes(modal) ? modal : undefined;
  const stats = useAsync(() => adminApi.dashboard(), []);
  const topStores = useAsync(() => adminApi.stores({ sortBy: 'rating', order: 'desc', limit: 5 }), []);

  const refresh = () => {
    stats.reload();
    topStores.reload();
  };

  const s = stats.data;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Everything on the platform at a glance.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => setModal('store')}>
            <Icon name="plus" /> Add store
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setModal('USER')}>
            <Icon name="plus" /> Add user
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setModal('ADMIN')}>
            <Icon name="plus" /> Add admin
          </button>
        </div>
      </div>

      {stats.error ? (
        <div className="panel" style={{ marginBottom: 24 }}>
          <ErrorState error={stats.error} onRetry={stats.reload} />
        </div>
      ) : (
        <div className="stat-grid">
          <StatCard
            label="Total users"
            icon="users"
            value={s?.totalUsers}
            note={s ? `${plural(s.totalNormalUsers, 'customer')}, ${plural(s.totalAdmins, 'admin')}` : null}
            to="/admin/users"
            loading={stats.loading && !s}
          />
          <StatCard label="Total stores" icon="store" value={s?.totalStores} to="/admin/stores" loading={stats.loading && !s} />
          <StatCard
            label="Total ratings"
            icon="star"
            value={s?.totalRatings}
            note={s?.averageRating ? `Average ${s.averageRating.toFixed(1)} stars` : 'No ratings yet'}
            loading={stats.loading && !s}
          />
          <StatCard
            label="Total store owners"
            icon="owner"
            value={s?.totalStoreOwners}
            to="/admin/users?role=OWNER"
            loading={stats.loading && !s}
          />
        </div>
      )}

      <div className="two-col">
        <section className="panel" aria-labelledby="top-stores">
          <div className="panel-head">
            <h2 id="top-stores">Highest rated stores</h2>
            <Link to="/admin/stores" className="btn btn-ghost btn-sm">
              All stores
            </Link>
          </div>
          {topStores.loading && !topStores.data ? (
            <TableSkeleton rows={5} cols={3} />
          ) : topStores.error ? (
            <ErrorState error={topStores.error} onRetry={topStores.reload} />
          ) : topStores.data.items.length === 0 ? (
            <EmptyState icon="store" title="No stores yet" action={
              <button type="button" className="btn btn-primary" onClick={() => setModal('store')}>Add the first store</button>
            } />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Store</th>
                    <th className="hide-sm">Owner</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {topStores.data.items.map((store) => (
                    <tr key={store.id}>
                      <td>
                        <Link to={`/admin/stores/${store.id}`} className="cell-strong">
                          {store.name}
                        </Link>
                        <div className="cell-sub">{plural(store.totalRatings, 'rating')}</div>
                      </td>
                      <td className="hide-sm">{store.owner.name}</td>
                      <td>
                        <RatingPill value={store.averageRating} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel panel-pad" aria-labelledby="overall">
          <h2 id="overall" style={{ marginBottom: 16 }}>
            Platform average
          </h2>
          {s ? (
            <RatingStamp value={s.averageRating} count={s.totalRatings} />
          ) : (
            <div className="skeleton" style={{ height: 90, width: 160 }} />
          )}
          <p style={{ color: 'var(--muted)', marginTop: 16, fontSize: 'var(--fs-sm)' }}>
            Average of every rating submitted across all stores.
          </p>
        </section>
      </div>

      <AddStoreModal
        open={modal === 'store'}
        onClose={() => setModal(null)}
        onCreated={refresh}
        onAddOwner={() => {
          setBackToStore(true);
          setModal('OWNER');
        }}
      />
      <AddUserModal
        open={Boolean(userRole)}
        role={userRole}
        onClose={() => {
          setModal(backToStore ? 'store' : null);
          setBackToStore(false);
        }}
        onCreated={refresh}
      />
    </>
  );
}
