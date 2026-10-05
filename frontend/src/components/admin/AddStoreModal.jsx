import { useEffect, useState } from 'react';
import Modal from '../Modal';
import FormField from '../FormField';
import { adminApi, getErrorMessage, getFieldErrors } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { LIMITS, runValidators, validateAddress, validateEmail, validateStoreName } from '../../utils/validation';

const EMPTY = { name: '', email: '', address: '', ownerId: '' };

export default function AddStoreModal({ open, onClose, onCreated, onAddOwner }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [owners, setOwners] = useState({ list: [], loading: false, error: '' });

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setErrors({});
    setFormError('');
    setOwners((o) => ({ ...o, loading: true, error: '' }));
    adminApi
      .owners()
      .then(({ owners: list }) => setOwners({ list, loading: false, error: '' }))
      .catch((err) => setOwners({ list: [], loading: false, error: getErrorMessage(err) }));
  }, [open]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = runValidators(form, {
      name: validateStoreName,
      email: validateEmail,
      address: validateAddress,
      ownerId: (v) => (v ? '' : 'Choose the store owner'),
    });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setFormError('');
    try {
      const { store } = await adminApi.createStore({
        name: form.name.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        ownerId: Number(form.ownerId),
      });
      toast.success(`Store added: ${store.name}`);
      onCreated?.(store);
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const noOwners = !owners.loading && !owners.error && owners.list.length === 0;

  return (
    <Modal open={open} onClose={onClose} title="Add a store" description="Each store is managed by one store owner account.">
      <form className="form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="alert alert-error" role="alert">
            {formError}
          </div>
        )}
        <FormField
          label="Store name"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          maxCount={LIMITS.STORE_NAME_MAX}
          minCount={LIMITS.STORE_NAME_MIN}
        />
        <FormField label="Store email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        <FormField
          label="Store address"
          as="textarea"
          rows={2}
          value={form.address}
          onChange={set('address')}
          error={errors.address}
          maxCount={LIMITS.ADDRESS_MAX}
        />
        <FormField
          label="Store owner"
          as="select"
          value={form.ownerId}
          onChange={set('ownerId')}
          error={errors.ownerId || owners.error}
          disabled={owners.loading || noOwners}
          hint={noOwners ? 'No store owner accounts yet. Add one first.' : undefined}
        >
          <option value="">{owners.loading ? 'Loading owners…' : 'Select an owner'}</option>
          {owners.list.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.email})
            </option>
          ))}
        </FormField>
        {onAddOwner && (
          <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onAddOwner}>
            Add a new store owner
          </button>
        )}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || noOwners}>
            {submitting ? <span className="spinner spinner-sm" /> : null}
            Add store
          </button>
        </div>
      </form>
    </Modal>
  );
}
