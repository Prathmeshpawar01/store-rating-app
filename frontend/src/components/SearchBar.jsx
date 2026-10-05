import Icon from './Icon';

/** Search input with icon and clear button. Debounce the value in the parent. */
export default function SearchBar({ value, onChange, placeholder = 'Search', label = 'Search' }) {
  return (
    <div className="search">
      <Icon name="search" />
      <label className="sr-only" htmlFor={`search-${label}`}>
        {label}
      </label>
      <input
        id={`search-${label}`}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      {value && (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Clear search">
          <Icon name="close" />
        </button>
      )}
    </div>
  );
}
