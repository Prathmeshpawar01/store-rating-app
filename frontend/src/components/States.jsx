import Icon from './Icon';
import { getErrorMessage } from '../services/api';

export function EmptyState({ icon = 'inbox', title, children, action }) {
  return (
    <div className="state">
      <Icon name={icon} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Could not load this page' }) {
  return (
    <div className="state state-error" role="alert">
      <Icon name="alert" />
      <h3>{title}</h3>
      <p>{getErrorMessage(error)}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          <Icon name="refresh" /> Try again
        </button>
      )}
    </div>
  );
}
