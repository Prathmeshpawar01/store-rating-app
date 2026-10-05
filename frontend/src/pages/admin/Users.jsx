import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import SearchBar from '../../components/SearchBar';
import SortHeader from '../../components/SortHeader';
import Pagination from '../../components/Pagination';
import RoleBadge from '../../components/RoleBadge';
import { RatingPill } from '../../components/RatingStars';
import { TableSkeleton } from '../../components/Loading';
import { EmptyState, ErrorState } from '../../components/States';
import AddUserModal from '../../components/admin/AddUserModal';
import useAsync from '../../hooks/useAsync';
import useListParams from '../../hooks/useListParams';
import useSearchInput from '../../hooks/useSearchInput';
import { adminApi } from '../../services/api';
import { formatDate } from '../../utils/format';

const DEFAULTS = { search: '', role: '', sortBy: 'createdAt', order: 'desc', page: 1, limit: 10 };

export default function AdminUsers() {
  const [params, update] = useListParams(DEFAULTS);
  const [searchText, setSearchText] = useSearchInput(params.search, (search) => update({ search }));
  const [modalRole, setModalRole] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () => adminApi.users(params),
    [params.search, params.role, params.sortBy, params.order, params.page, params.limit]
  );

  const sort = { sortBy: params.sortBy, order: params.order };
  const filtered = Boolean(params.search || params.role);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p>Every account on the platform: customers, store owners and administrators.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => setModalRole('USER')}>
            <Icon name="plus" /> Add user
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setModalRole('ADMIN')}>
            <Icon name="plus" /> Add admin
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setModalRole('OWNER')}>
            <Icon name="plus" /> Add store owner
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search by name, email or address"
            label="Search users"
          />
          <label className="sr-only" htmlFor="role-filter">
            Filter by role
          </label>
          <select
            id="role-filter"
            className="select"
            value={params.role}
            onChange={(e) => update({ role: e.target.value })}
          >
            <option value="">All roles</option>
            <option value="USER">Normal users</option>
            <option value="OWNER">Store owners</option>
            <option value="ADMIN">Administrators</option>
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
          <EmptyState icon="users" title={filtered ? 'No users match these filters' : 'No users yet'}>
            {filtered ? 'Try a different search term or role.' : 'Add the first user to get started.'}
          </EmptyState>
        ) : (
          <div className="table-wrap" aria-busy={loading}>
            <table className="table">
              <thead>
                <tr>
                  <SortHeader field="name" label="Name" sort={sort} onSort={update} />
                  <SortHeader field="email" label="Email" sort={sort} onSort={update} className="hide-sm" />
                  <SortHeader field="address" label="Address" sort={sort} onSort={update} className="hide-sm" />
                  <SortHeader field="role" label="Role" sort={sort} onSort={update} />
                  <SortHeader field="createdAt" label="Created" sort={sort} onSort={update} className="hide-sm" />
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="cell-strong">{u.name}</span>
                      <div className="cell-sub show-sm">{u.email}</div>
                      {u.role === 'OWNER' && (
                        <div style={{ marginTop: 4 }}>
                          <RatingPill value={u.ownerRating} emptyText="No store ratings" />
                        </div>
                      )}
                    </td>
                    <td className="hide-sm">{u.email}</td>
                    <td className="hide-sm cell-clip" title={u.address}>
                      {u.address}
                    </td>
                    <td>
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="hide-sm">{formatDate(u.createdAt)}</td>
                    <td>
                      <Link to={`/admin/users/${u.id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination pagination={data.pagination} onPageChange={(page) => update({ page })} noun="users" />}
      </section>

      <AddUserModal
        open={Boolean(modalRole)}
        role={modalRole || undefined}
        onClose={() => setModalRole(null)}
        onCreated={reload}
      />
    </>
  );
}
