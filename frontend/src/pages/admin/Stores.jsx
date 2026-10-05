import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import SearchBar from '../../components/SearchBar';
import SortHeader from '../../components/SortHeader';
import Pagination from '../../components/Pagination';
import { RatingPill } from '../../components/RatingStars';
import { TableSkeleton } from '../../components/Loading';
import { EmptyState, ErrorState } from '../../components/States';
import AddStoreModal from '../../components/admin/AddStoreModal';
import AddUserModal from '../../components/admin/AddUserModal';
import useAsync from '../../hooks/useAsync';
import useListParams from '../../hooks/useListParams';
import useSearchInput from '../../hooks/useSearchInput';
import { adminApi } from '../../services/api';
import { plural } from '../../utils/format';

const DEFAULTS = { search: '', sortBy: 'name', order: 'asc', page: 1, limit: 10 };

export default function AdminStores() {
  const [params, update] = useListParams(DEFAULTS);
  const [searchText, setSearchText] = useSearchInput(params.search, (search) => update({ search }));
  const [modal, setModal] = useState(null); // 'store' | 'owner'

  const { data, loading, error, reload } = useAsync(
    () => adminApi.stores(params),
    [params.search, params.sortBy, params.order, params.page, params.limit]
  );
  const sort = { sortBy: params.sortBy, order: params.order };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Stores</h1>
          <p>All registered stores with their owner and current average rating.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => setModal('store')}>
            <Icon name="plus" /> Add store
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search by store name, email or address"
            label="Search stores"
          />
          <label className="sr-only" htmlFor="store-sort">
            Sort by
          </label>
          <select id="store-sort" className="select" value={params.sortBy} onChange={(e) => update({ sortBy: e.target.value })}>
            <option value="name">Sort by name</option>
            <option value="email">Sort by email</option>
            <option value="address">Sort by address</option>
            <option value="owner">Sort by owner</option>
            <option value="rating">Sort by rating</option>
            <option value="totalRatings">Sort by number of ratings</option>
          </select>
          <button
            type="button"
            className="btn btn-secondary order-toggle"
            onClick={() => update({ order: params.order === 'asc' ? 'desc' : 'asc' })}
          >
            <Icon name={params.order === 'asc' ? 'arrowUp' : 'arrowDown'} />
            {params.order === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>

        {loading && !data ? (
          <TableSkeleton rows={6} cols={5} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : data.items.length === 0 ? (
          <EmptyState icon="store" title={params.search ? 'No stores match your search' : 'No stores yet'}>
            {params.search ? 'Try a different name, email or address.' : 'Add a store and assign it to an owner.'}
          </EmptyState>
        ) : (
          <div className="table-wrap" aria-busy={loading}>
            <table className="table">
              <thead>
                <tr>
                  <SortHeader field="name" label="Store name" sort={sort} onSort={update} />
                  <SortHeader field="email" label="Email" sort={sort} onSort={update} className="hide-sm" />
                  <SortHeader field="address" label="Address" sort={sort} onSort={update} className="hide-sm" />
                  <SortHeader field="owner" label="Owner" sort={sort} onSort={update} className="hide-sm" />
                  <SortHeader field="rating" label="Average rating" sort={sort} onSort={update} />
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="cell-strong">{s.name}</span>
                      <div className="cell-sub">{plural(s.totalRatings, 'rating')}</div>
                    </td>
                    <td className="hide-sm">{s.email}</td>
                    <td className="hide-sm cell-clip" title={s.address}>
                      {s.address}
                    </td>
                    <td className="hide-sm">
                      <Link to={`/admin/users/${s.owner.id}`}>{s.owner.name}</Link>
                    </td>
                    <td>
                      <RatingPill value={s.averageRating} />
                    </td>
                    <td>
                      <Link to={`/admin/stores/${s.id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination pagination={data.pagination} onPageChange={(page) => update({ page })} noun="stores" />}
      </section>

      <AddStoreModal
        open={modal === 'store'}
        onClose={() => setModal(null)}
        onCreated={reload}
        onAddOwner={() => setModal('owner')}
      />
      <AddUserModal open={modal === 'owner'} role="OWNER" onClose={() => setModal('store')} />
    </>
  );
}
