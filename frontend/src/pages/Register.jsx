import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormField, { PasswordField } from '../components/FormField';
import AuthAside from './AuthAside';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import {
  LIMITS,
  runValidators,
  validateAddress,
  validateEmail,
  validateName,
  validatePassword,
} from '../utils/validation';

const EMPTY = { name: '', email: '', address: '', password: '', confirmPassword: '' };

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Sign up · StoreRate';
  }, []);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = runValidators(form, {
      name: validateName,
      email: validateEmail,
      address: validateAddress,
      password: validatePassword,
      confirmPassword: (v, all) => (!v ? 'Confirm your password' : v !== all.password ? 'Passwords do not match' : ''),
    });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      // Role is never sent – the server always creates a normal USER account.
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      toast.success('Account created. You can rate stores now.');
      navigate('/user/stores', { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <AuthAside
        heading="Your rating helps the next shopper."
        text="Create a free account to rate stores across the city. You can edit any rating later."
      />
      <main className="auth-main">
        <div className="auth-card">
          <h2>Create an account</h2>
          <p>Sign up as a customer to browse and rate stores.</p>

          <form className="form" onSubmit={handleSubmit} noValidate>
            {formError && (
              <div className="alert alert-error" role="alert">
                {formError}
              </div>
            )}
            <FormField
              label="Full name"
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              hint={`${LIMITS.NAME_MIN}–${LIMITS.NAME_MAX} characters`}
              maxCount={LIMITS.NAME_MAX}
              minCount={LIMITS.NAME_MIN}
              autoFocus
            />
            <FormField
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
            />
            <FormField
              label="Address"
              as="textarea"
              rows={3}
              autoComplete="street-address"
              value={form.address}
              onChange={set('address')}
              error={errors.address}
              maxCount={LIMITS.ADDRESS_MAX}
            />
            <PasswordField
              label="Password"
              autoComplete="new-password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              showChecklist
            />
            <PasswordField
              label="Confirm password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              error={errors.confirmPassword}
            />
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? <span className="spinner spinner-sm" /> : null}
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
