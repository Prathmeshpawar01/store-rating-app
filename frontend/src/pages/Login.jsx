import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormField, { PasswordField } from '../components/FormField';
import AuthAside from './AuthAside';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { validateEmail, runValidators } from '../utils/validation';

const DEMO = [
  { label: 'Administrator', email: 'admin@example.com', password: 'Admin@1234' },
  { label: 'Store owner', email: 'owner@example.com', password: 'Admin@1234' },
  { label: 'Normal user', email: 'user@example.com', password: 'User@1234' },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Log in · StoreRate';
  }, []);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = runValidators(form, {
      email: validateEmail,
      password: (v) => (v ? '' : 'Password is required'),
    });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      const from = location.state?.from;
      const home = ROLE_HOME[user.role];
      // Only return to the previous page if it belongs to this role's area.
      navigate(from && from.startsWith(home.split('/').slice(0, 2).join('/')) ? from : home, { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <AuthAside
        heading="Honest ratings for the stores you visit."
        text="Rate stores from one to five stars, change your mind any time, and see how every shop is doing."
      />
      <main className="auth-main">
        <div className="auth-card">
          <h2>Log in</h2>
          <p>One login for customers, store owners and administrators.</p>

          <form className="form" onSubmit={handleSubmit} noValidate>
            {formError && (
              <div className="alert alert-error" role="alert">
                {formError}
              </div>
            )}
            <FormField
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              autoFocus
            />
            <PasswordField
              label="Password"
              autoComplete="current-password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
            />
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? <span className="spinner spinner-sm" /> : null}
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </p>

          <div className="demo-box">
            <p>Try a demo account</p>
            <div className="demo-list">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setForm({ email: d.email, password: d.password });
                    setErrors({});
                    setFormError('');
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
