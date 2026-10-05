import SearchBar from '../../components/SearchBar';
import SortHeader from '../../components/SortHeader';
import Pagination from '../../components/Pagination';
import RatingStars from '../../components/RatingStars';
import { TableSkeleton } from '../../components/Loading';
import { EmptyState, ErrorState } from '../../components/States';
import useAsync from '../../hooks/useAsync';
import useListParams from '../../hooks/useListParams';
import useSearchInput from '../../hooks/useSearchInput';
import { ownerApi } from '../../services/api';
import { formatDate, formatDateTime } from '../../utils/format';

const DEFAULTS = { search: '', storeId: '', rating: '', sortBy: 'date', order: 'desc', page: 1, limit: 10 };

export default function OwnerRatings() {
  const [params, update] = useListParams(DEFAULTS);
  const [searchText, setSearchText] = useSearchInput(params.search, (search) => update({ search }));

  const dash = useAsync(() => ownerApi.dashboard(), []);
  const { data, loading, error, reload } = useAsync(
    () => ownerApi.ratings(params),
    [params.search, params.storeId, params.rating, params.sortBy, params.order, params.page, params.limit]
  );

  const stores = dash.data?.stores || [];
  const sort = { sortBy: params.sortBy, order: params.order };
  const filtered = Boolean(params.search || params.rating || params.storeId);
  const multiStore = stores.length > 1;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ratings</h1>
          <p>Every customer who has rated your {multiStore ? 'stores' : 'store'}, with the rating they gave.</p>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search by customer name or email"
            label="Search ratings"
          />
          {multiStore && (
            <>
              <label className="sr-only" htmlFor="store-filter">
                Store
              </label>
              <select
                id="store-filter"
                className="select"
                value={params.storeId}
                onChange={(e) => update({ storeId: e.target.value })}
              >
                <option value="">All my stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </>
          )}
          <label className="sr-only" htmlFor="rating-filter">
            Rating
          </label>
          <select
            id="rating-filter"
            className="select"
            value={params.rating}
            onChange={(e) => update({ rating: e.target.value })}
          >
            <option value="">Any rating</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        {loading && !data ? (
          <TableSkeleton rows={6} cols={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : data.items.length === 0 ? (
          <EmptyState icon="star" title={filtered ? 'No ratings match these filters' : 'No ratings yet'}>
            {filtered
              ? 'Clear the search or choose a different rating.'
              : 'When customers rate your store, they’ll be listed here.'}
          </EmptyState>
        ) : (
          <div className="table-wrap" aria-busy={loading}>
            <table className="table">
              <thead>
                <tr>
                  <SortHeader field="name" label="User name" sort={sort} onSort={update} />
                  <SortHeader field="email" label="User email" sort={sort} onSort={update} className="hide-sm" />
                  {multiStore && <SortHeader field="store" label="Store" sort={sort} onSort={update} className="hide-sm" />}
                  <SortHeader field="rating" label="Rating" sort={sort} onSort={update} />
                  <SortHeader field="date" label="Rating date" sort={sort} onSort={update} className="hide-sm" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="cell-strong">{r.user.name}</span>
                      <div className="cell-sub show-sm">{r.user.email}</div>
                    </td>
                    <td className="hide-sm">{r.user.email}</td>
                    {multiStore && <td className="hide-sm">{r.store.name}</td>}
                    <td>
                      <RatingStars value={r.rating} />
                      <span className="sr-only">{r.rating} out of 5</span>
                    </td>
                    <td className="hide-sm" title={`First rated ${formatDateTime(r.createdAt)}`}>
                      {formatDate(r.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination pagination={data.pagination} onPageChange={(page) => update({ page })} noun="ratings" />}
      </section>
    </>
  );
}
