import { useState, type FormEvent } from 'react';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import { Link } from 'react-router-dom';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
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
      /*
       * Temporary frontend-only authentication simulation.
       *
       * This will later be replaced with the real authentication
       * service/API when the backend is available.
       */
      await new Promise((resolve) => {
        setTimeout(resolve, 1200);
      });

      /*
       * We intentionally show an authentication error here instead
       * of pretending that login succeeded without a backend.
       */
      setAuthError(
        'Unable to sign in. Please check your credentials and try again.',
      );
    } catch {
      setAuthError(
        'Something went wrong while trying to sign in. Please try again.',
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

  const handleGoogleLogin = () => {
    if (isSubmitting) {
      return;
    }

    console.log('Continue with Google clicked');
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

          <h1
            id="login-title"
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            Stock Management System
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage corporate inventory
          </p>
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
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>

              <div>
                <p className="text-sm font-medium text-red-800">
                  Sign-in failed
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {authError}
                </p>
              </div>
            </div>
          </div>
        )}

        <form
          className="space-y-5"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Username / Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
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
              className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                errors.email
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/10'
              } ${
                isSubmitting
                  ? 'cursor-not-allowed bg-slate-100 text-slate-500'
                  : ''
              }`}
            />

            {errors.email && (
              <p
                id="email-error"
                className="mt-1.5 text-sm text-red-600"
                role="alert"
              >
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
              className={`flex items-center gap-2 text-sm text-slate-600 ${
                isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                name="remember"
                checked={rememberDevice}
                onChange={(event) =>
                  setRememberDevice(event.target.checked)
                }
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-slate-300 accent-slate-900"
              />

              <span>Remember this device</span>
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-medium text-slate-700 transition hover:text-slate-950 focus:outline-none focus:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-500"
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

            <span>
              {isSubmitting ? 'Signing in...' : 'Log in to Console'}
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />

          <span className="text-xs font-medium text-slate-400">
            OR
          </span>

          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Google login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z"
            />
            <path
              fill="#34A853"
              d="M12 21.6c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.6Z"
            />
            <path
              fill="#FBBC05"
              d="M6.54 13.69A5.86 5.86 0 0 1 6.23 12c0-.59.11-1.17.31-1.69V7.78H3.3A9.74 9.74 0 0 0 2.26 12c0 1.57.38 3.05 1.04 4.22l3.24-2.53Z"
            />
            <path
              fill="#EA4335"
              d="M12 6.28c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.39 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 8 9.46 6.28 12 6.28Z"
            />
          </svg>

          <span>Continue with Google</span>
        </button>

        <footer className="mt-6">
          <p className="text-center text-xs leading-5 text-slate-500">
            Having terminal access issues? Contact your IT Helpdesk.
          </p>
        </footer>
      </section>
    </AuthLayout>
  );
}