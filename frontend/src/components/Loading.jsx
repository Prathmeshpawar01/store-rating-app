export default function Loading({ label = 'Loading…', full = false }) {
  if (full) {
    return (
      <div className="full-loader" role="status" aria-live="polite">
        <div className="spinner" />
        <span className="sr-only">{label}</span>
      </div>
    );
  }
  return (
    <div className="state" role="status" aria-live="polite">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

/** Placeholder rows shown while a table loads. */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="table-wrap" aria-hidden="true">
      <table className="table">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((__, c) => (
                <td key={c}>
                  <div className="skeleton" style={{ height: 14, width: `${50 + ((r + c) % 4) * 12}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
