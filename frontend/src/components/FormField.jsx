import { useId, useState } from 'react';
import { passwordChecks } from '../utils/validation';

/**
 * Labelled input with error message and optional character counter.
 * Pass `as="textarea"` or `as="select"` for other controls.
 */
export default function FormField({ label, error, hint, as = 'input', maxCount, minCount, children, ...props }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const Control = as;
  const count = typeof props.value === 'string' ? props.value.trim().length : 0;
  const countBad = maxCount && ((minCount && count > 0 && count < minCount) || count > maxCount);
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      <div className="field-row">
        <label htmlFor={id}>{label}</label>
        {maxCount ? (
          <span className={`counter ${countBad ? 'bad' : ''}`} aria-hidden="true">
            {count}/{maxCount}
          </span>
        ) : null}
      </div>
      <Control
        id={id}
        className={`${as === 'select' ? 'select' : 'input'} ${error ? 'invalid' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      >
        {children}
      </Control>
      {hint && !error && (
        <span className="hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
}

/** Password input with show/hide toggle and an optional live rule checklist. */
export function PasswordField({ label, error, showChecklist = false, value, ...props }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw-wrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`input ${error ? 'invalid' : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          value={value}
          {...props}
        />
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {showChecklist && (
        <ul className="pw-checklist" aria-label="Password requirements">
          {passwordChecks(value).map((c) => (
            <li key={c.label} className={c.ok ? 'ok' : ''}>
              {c.label}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
}
