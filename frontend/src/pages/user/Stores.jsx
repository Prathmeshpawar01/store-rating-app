import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import SearchBar from '../../components/SearchBar';
import { SortControls } from '../../components/SortHeader';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import RatingStamp from '../../components/RatingStamp';
import RatingStars from '../../components/RatingStars';
import { EmptyState, ErrorState } from '../../components/States';
import Loading from '../../components/Loading';
import useAsync from '../../hooks/useAsync';
import useListParams from '../../hooks/useListParams';
import useSearchInput from '../../hooks/useSearchInput';
import { storeApi, getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/format';
import { validateRating } from '../../utils/validation';

const DEFAULTS = { search: '', sortBy: 'name', order: 'asc', page: 1, limit: 12 };
const SORT_OPTIONS = [
  { value: 'name', label: 'Store name' },
  { value: 'rating', label: 'Average rating' },
  { value: 'address', label: 'Address' },
  { value: 'myRating', label: 'My rating' },
];

export default function UserStores() {
  const { user } = useAuth();
  const [params, update] = useListParams(DEFAULTS);
  const [searchText, setSearchText] = useSearchInput(params.search, (search) => update({ search }));
  const [rating, setRating] = useState(null); // store being rated

  const { data, loading, error, reload, setData } = useAsync(
    () => storeApi.list(params),
    [params.search, params.sortBy, params.order, params.page, params.limit]
  );

  // Replace one store in the list after a rating is saved (no full reload needed).
  const onSaved = (updated) => {
    setData((d) => ({ ...d, items: d.items.map((s) => (s.id === updated.id ? updated : s)) }));
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Stores</h1>
          <p>
            Hi {user?.name.split(' ')[0]}. Find a store, see how others rate it, and add your own rating. You can edit
            it whenever you like.
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search by store name or address"
            label="Search stores"
          />
          <SortControls options={SORT_OPTIONS} sort={{ sortBy: params.sortBy, order: params.order }} onSort={update} />
        </div>

        {loading && !data ? (
          <Loading label="Loading stores…" />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : data.items.length === 0 ? (
          <EmptyState icon="store" title={params.search ? `No stores match “${params.search}”` : 'No stores yet'}>
            {params.search ? 'Try a shorter name or search by city instead.' : 'Stores added by the administrator will show up here.'}
          </EmptyState>
        ) : (
          <div className="store-grid" aria-busy={loading}>
            {data.items.map((store) => (
              <StoreCard key={store.id} store={store} onRate={() => setRating(store)} />
            ))}
          </div>
        )}
        {data && <Pagination pagination={data.pagination} onPageChange={(page) => update({ page })} noun="stores" />}
      </section>

      <RateModal store={rating} onClose={() => setRating(null)} onSaved={onSaved} />
    </>
  );
}

function StoreCard({ store, onRate }) {
  const rated = store.myRating !== null;
  return (
    <article className="store-card" aria-labelledby={`store-${store.id}`}>
      <div className="store-card-head">
        <h3 id={`store-${store.id}`}>{store.name}</h3>
        <div className="store-card-addr">
          <Icon name="pin" />
          <span>{store.address}</span>
        </div>
      </div>
      <div className="store-card-ratings">
        <div>
          <div className="mini-label">Overall rating</div>
          <RatingStamp value={store.averageRating} count={store.totalRatings} compact />
        </div>
        <div className="my-rating">
          <div className="mini-label">Your rating</div>
          {rated ? (
            <>
              <RatingStars value={store.myRating} />
              <span className="my-rating-value">{store.myRating} of 5</span>
              <span className="cell-sub">on {formatDate(store.myRatingUpdatedAt)}</span>
            </>
          ) : (
            <span className="cell-sub">You haven’t rated this store</span>
          )}
        </div>
      </div>
      <div className="store-card-foot">
        <button type="button" className={`btn ${rated ? 'btn-secondary' : 'btn-rate'}`} onClick={onRate}>
          <Icon name="star" filled={!rated} />
          {rated ? 'Edit rating' : 'Rate store'}
        </button>
      </div>
    </article>
  );
}

function RateModal({ store, onClose, onSaved }) {
  const toast = useToast();
  const [value, setValue] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = store?.myRating !== null && store?.myRating !== undefined;

  useEffect(() => {
    if (store) {
      setValue(store.myRating || 0);
      setError('');
    }
  }, [store]);

  const submit = async (e) => {
    e.preventDefault();
    const msg = validateRating(value);
    if (msg) {
      setError(msg);
      return;
    }
    setSaving(true);
    try {
      const { store: updated } = editing
        ? await storeApi.updateRating(store.id, value)
        : await storeApi.submitRating(store.id, value);
      toast.success(editing ? `Rating updated to ${value} for ${store.name}` : `Rated ${store.name} ${value} of 5`);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(store)}
      onClose={onClose}
      size="sm"
      title={editing ? 'Edit your rating' : 'Rate this store'}
      description={store ? `${store.name}, ${store.address}` : ''}
    >
      <form className="form" onSubmit={submit} noValidate>
        <RatingStars
          value={value}
          onChange={(n) => {
            setValue(n);
            setError('');
          }}
          label={`Your rating for ${store?.name || 'this store'}`}
        />
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        {editing && <p className="hint">Your previous rating was {store.myRating} of 5.</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || !value || (editing && value === store.myRating)}>
            {saving ? <span className="spinner spinner-sm" /> : null}
            {editing ? 'Update rating' : 'Submit rating'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
