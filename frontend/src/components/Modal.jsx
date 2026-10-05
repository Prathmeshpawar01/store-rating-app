import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

/**
 * Accessible modal dialog: closes on Escape / backdrop click, traps Tab focus,
 * and returns focus to the element that opened it.
 */
export default function Modal({ open, onClose, title, description, children, size }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = () =>
      dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

    const first = [...focusable()].find((el) => el.tagName !== 'BUTTON' || !el.classList.contains('modal-x'));
    (first || dialog).focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const items = [...focusable()].filter((el) => !el.disabled);
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`modal ${size === 'sm' ? 'modal-sm' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="modal-head">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="icon-btn modal-x" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
