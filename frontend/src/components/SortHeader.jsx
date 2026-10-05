import Icon from './Icon';

/**
 * Clickable table header. Clicking the active column flips asc/desc;
 * clicking another column sorts by it ascending.
 */
export default function SortHeader({ field, label, sort, onSort, className }) {
  const active = sort.sortBy === field;
  const ariaSort = active ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none';
  const next = () => onSort({ sortBy: field, order: active && sort.order === 'asc' ? 'desc' : 'asc' });

  return (
    <th aria-sort={ariaSort} className={className}>
      <button type="button" className={`sort-btn ${active ? 'active' : ''}`} onClick={next}>
        {label}
        <Icon name={active ? (sort.order === 'asc' ? 'arrowUp' : 'arrowDown') : 'sortAsc'} />
      </button>
    </th>
  );
}

/** Dropdown + direction toggle for card layouts without table headers. */
export function SortControls({ options, sort, onSort }) {
  return (
    <>
      <label className="sr-only" htmlFor="sort-by">
        Sort by
      </label>
      <select
        id="sort-by"
        className="select"
        value={sort.sortBy}
        onChange={(e) => onSort({ ...sort, sortBy: e.target.value })}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            Sort by {o.label.toLowerCase()}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-secondary order-toggle"
        onClick={() => onSort({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' })}
        aria-label={`Sort direction: ${sort.order === 'asc' ? 'ascending' : 'descending'}. Click to change.`}
      >
        <Icon name={sort.order === 'asc' ? 'arrowUp' : 'arrowDown'} />
        {sort.order === 'asc' ? 'Ascending' : 'Descending'}
      </button>
    </>
  );
}
