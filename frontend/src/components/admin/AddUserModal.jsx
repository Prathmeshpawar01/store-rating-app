import { useEffect, useState } from 'react';
import Modal from '../Modal';
import FormField, { PasswordField } from '../FormField';
import { adminApi, getErrorMessage, getFieldErrors } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  LIMITS,
  runValidators,
  validateAddress,
  validateEmail,
  validateName,
  validatePassword,
} from '../../utils/validation';

const EMPTY = { name: '', email: '', address: '', password: '', role: 'USER' };

const COPY = {
  USER: { title: 'Add a normal user', button: 'Add user', done: 'User added' },
  ADMIN: { title: 'Add an administrator', button: 'Add administrator', done: 'Administrator added' },
  OWNER: { title: 'Add a store owner', button: 'Add store owner', done: 'Store owner added' },
};

/**
 * Creates a user. `role` fixes the role (e.g. "Add admin"); without it the admin
 * picks USER, ADMIN or OWNER from a dropdown.
 */
export default function AddUserModal({ open, onClose, onCreated, role: fixedRole }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, role: fixedRole || 'USER' });
      setErrors({});
      setFormError('');
    }
  }, [open, fixedRole]);

  const copy = COPY[form.role] || COPY.USER;

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = runValidators(form, {
      name: validateName,
      email: validateEmail,
      address: validateAddress,
      password: validatePassword,
    });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setFormError('');
    try {
      const { user } = await adminApi.createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        password: form.password,
        role: form.role,
      });
      toast.success(`${copy.done}: ${user.name}`);
      onCreated?.(user);
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={fixedRole ? copy.title : 'Add a user'}
      description="They can log in straight away with this email and password."
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="alert alert-error" role="alert">
            {formError}
          </div>
        )}
        <div className="form-grid">
          <div className="span-2">
            <FormField
              label="Full name"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              hint={`${LIMITS.NAME_MIN}–${LIMITS.NAME_MAX} characters`}
              maxCount={LIMITS.NAME_MAX}
              minCount={LIMITS.NAME_MIN}
            />
          </div>
          <FormField label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
          {fixedRole ? (
            <FormField label="Role" value={COPY[fixedRole].title.replace(/^Add an? /, '')} readOnly disabled />
          ) : (
            <FormField label="Role" as="select" value={form.role} onChange={set('role')} error={errors.role}>
              <option value="USER">Normal user</option>
              <option value="OWNER">Store owner</option>
              <option value="ADMIN">Administrator</option>
            </FormField>
          )}
          <div className="span-2">
            <FormField
              label="Address"
              as="textarea"
              rows={2}
              value={form.address}
              onChange={set('address')}
              error={errors.address}
              maxCount={LIMITS.ADDRESS_MAX}
            />
          </div>
          <div className="span-2">
            <PasswordField
              label="Temporary password"
              autoComplete="new-password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              showChecklist
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <span className="spinner spinner-sm" /> : null}
            {copy.button}
          </button>
        </div>
      </form>
    </Modal>
  );
}
