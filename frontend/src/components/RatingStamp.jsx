import Icon from './Icon';
import { plural } from '../utils/format';

/**
 * The large rating figure used on dashboards and detail pages:
 *   4.2 / 5
 *   ▮▮▮▮▯   (five segments filled proportionally)
 *   18 ratings
 */
export default function RatingStamp({ value, count, compact = false, label }) {
  const has = value !== null && value !== undefined;
  const v = has ? Number(value) : 0;

  return (
    <div
      className={`stamp ${compact ? 'compact' : ''} ${has ? '' : 'empty'}`}
      role="group"
      aria-label={label || (has ? `Average rating ${v.toFixed(1)} out of 5` : 'No ratings yet')}
    >
      <div className="stamp-figure">
        <span className="stamp-num">{has ? v.toFixed(1) : '–'}</span>
        <span className="stamp-of">/ 5</span>
      </div>
      <div className="stamp-bar" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, v - i));
          return (
            <span key={i} className="stamp-seg">
              <span style={{ width: `${fill * 100}%` }} />
            </span>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="stamp-meta">{count ? plural(count, 'rating') : 'No ratings yet'}</span>
      )}
    </div>
  );
}

/** Horizontal bars showing how many 1-5 star ratings were given. */
export function RatingDistribution({ distribution = {} }) {
  const total = Object.values(distribution).reduce((a, b) => a + Number(b || 0), 0);
  return (
    <div className="dist">
      {[5, 4, 3, 2, 1].map((n) => {
        const c = Number(distribution[n] || 0);
        return (
          <div className="dist-row" key={n}>
            <span className="dist-label">
              {n} <Icon name="star" filled />
            </span>
            <div className="dist-track" role="img" aria-label={`${c} ratings of ${n} stars`}>
              <div className="dist-fill" style={{ width: total ? `${(c / total) * 100}%` : 0 }} />
            </div>
            <span className="dist-count">{c}</span>
          </div>
        );
      })}
    </div>
  );
}
