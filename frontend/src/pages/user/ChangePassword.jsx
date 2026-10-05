import { useState } from 'react';
import { PasswordField } from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../../services/api';
import { runValidators, validatePassword } from '../../utils/validation';

const EMPTY = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

/** Shared by all roles (/user, /owner and /admin change-password routes). */
export default function ChangePassword() {
  const { changePassword } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
    setFormError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = runValidators(form, {
      currentPassword: (v) => (v ? '' : 'Enter your current password'),
      newPassword: (v, all) => validatePassword(v) || (v === all.currentPassword ? 'Choose a password different from your current one' : ''),
      confirmNewPassword: (v, all) => (!v ? 'Confirm your new password' : v !== all.newPassword ? 'Passwords do not match' : ''),
    });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await changePassword(form);
      toast.success('Password changed');
      setForm(EMPTY);
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Change password</h1>
          <p>Other devices signed in to this account will need to log in again.</p>
        </div>
      </div>
      <section className="panel panel-pad" style={{ maxWidth: 520 }}>
        <form className="form" onSubmit={submit} noValidate>
          {formError && (
            <div className="alert alert-error" role="alert">
              {formError}
            </div>
          )}
          <PasswordField
            label="Current password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={set('currentPassword')}
            error={errors.currentPassword}
          />
          <PasswordField
            label="New password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={set('newPassword')}
            error={errors.newPassword}
            showChecklist
          />
          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            value={form.confirmNewPassword}
            onChange={set('confirmNewPassword')}
            error={errors.confirmNewPassword}
          />
          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner spinner-sm" /> : null}
              Change password
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
