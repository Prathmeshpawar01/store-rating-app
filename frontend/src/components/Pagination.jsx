import Icon from './Icon';

export default function Pagination({ pagination, onPageChange, noun = 'results' }) {
  if (!pagination || pagination.total === 0) return null;
  const { page, limit, total, totalPages } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span>
        Showing {from}–{to} of {total} {noun}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <Icon name="chevronLeft" /> Previous
        </button>
        <span aria-current="page">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next <Icon name="chevronRight" />
        </button>
      </div>
    </nav>
  );
}
