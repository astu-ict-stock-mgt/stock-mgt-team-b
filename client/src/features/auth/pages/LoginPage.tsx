import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import { useLogin, useAuth } from '../hooks';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { submitLogin } = useLogin();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Username or email is required.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    return newErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setAuthError('');

    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await submitLogin({
        email,
        password,
      });

      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setAuthError(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to sign in. Please check your credentials and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);

    if (errors.email) {
      setErrors((current) => ({
        ...current,
        email: undefined,
      }));
    }

    if (authError) {
      setAuthError('');
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);

    if (errors.password) {
      setErrors((current) => ({
        ...current,
        password: undefined,
      }));
    }

    if (authError) {
      setAuthError('');
    }
  };

  return (
    <AuthLayout>
      <section
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        aria-labelledby="login-title"
      >
        <header className="mb-8 text-center">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm"
            aria-hidden="true"
          >
            <span className="text-xl font-bold">SM</span>
          </div>

          <h1 id="login-title" className="text-2xl font-bold tracking-tight text-slate-900">
            Stock Management System
          </h1>

          <p className="mt-2 text-sm text-slate-500">Sign in to manage corporate inventory</p>
        </header>

        {authError && (
          <div
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0 text-red-600"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>

              <div>
                <p className="text-sm font-medium text-red-800">Sign-in failed</p>

                <p className="mt-1 text-sm text-red-700">{authError}</p>
              </div>
            </div>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {/* Username / Email */}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Username or Email Address
            </label>

            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(event) => handleEmailChange(event.target.value)}
              placeholder="Enter your username or email"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:ring-2 ${
                errors.email
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/10'
              } ${isSubmitting ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}`}
            />

            {errors.email && (
              <p id="email-error" className="mt-1.5 text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <PasswordInput
            value={password}
            onChange={handlePasswordChange}
            error={errors.password}
            disabled={isSubmitting}
          />

          {/* Remember device / Forgot password */}
          <div className="flex items-center justify-between gap-4">
            <label
              className={`flex items-center gap-2 text-sm text-slate-600 ${isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <input
                type="checkbox"
                name="remember"
                checked={rememberDevice}
                onChange={(event) => setRememberDevice(event.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-slate-300 accent-slate-900"
              />

              <span>Remember this device</span>
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-medium text-slate-700 transition hover:text-slate-950 focus:underline focus:outline-none"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isSubmitting && (
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}

            <span>{isSubmitting ? 'Signing in...' : 'Log in to Console'}</span>
          </button>
        </form>

        <footer className="mt-6">
          <p className="text-center text-xs leading-5 text-slate-500">
            Having terminal access issues? Contact your IT Helpdesk.
          </p>
        </footer>
      </section>
    </AuthLayout>
  );
}
