import { useState } from 'react';
import Icon from './Icon';

const CAPTIONS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/**
 * Read-only stars: <RatingStars value={4.2} />
 * Interactive picker: <RatingStars value={n} onChange={setN} />
 *
 * The picker is a radio group: arrow keys move the selection, and each star has
 * an accessible label ("3 stars – Good").
 */
export default function RatingStars({ value = 0, onChange, size, label = 'Rating' }) {
  const [hover, setHover] = useState(0);

  if (!onChange) {
    const rounded = Math.round(Number(value) || 0);
    return (
      <span className="stars" role="img" aria-label={value ? `${Number(value).toFixed(1)} out of 5 stars` : 'Not rated'}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon
            key={n}
            name="star"
            filled
            className={`star ${n <= rounded ? 'on' : ''}`}
            style={size ? { width: size, height: size } : undefined}
          />
        ))}
      </span>
    );
  }

  const shown = hover || value;

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(5, (value || 0) + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(1, (value || 1) - 1));
    }
  };

  return (
    <div>
      <div className="stars-input" role="radiogroup" aria-label={label} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''} – ${CAPTIONS[n]}`}
            tabIndex={value === n || (!value && n === 1) ? 0 : -1}
            className={`star-btn ${n <= shown ? 'on' : ''}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onKeyDown={onKeyDown}
          >
            <Icon name="star" filled />
          </button>
        ))}
      </div>
      <div className="star-caption" aria-live="polite">
        {shown ? `${shown} of 5 – ${CAPTIONS[shown]}` : 'Select 1 to 5 stars'}
      </div>
    </div>
  );
}

/** Compact pill: ★ 4.2 */
export function RatingPill({ value, emptyText = 'No ratings' }) {
  if (value === null || value === undefined) {
    return <span className="rating-pill none">{emptyText}</span>;
  }
  return (
    <span className="rating-pill" aria-label={`${Number(value).toFixed(1)} out of 5`}>
      <Icon name="star" filled />
      {Number(value).toFixed(1)}
    </span>
  );
}
