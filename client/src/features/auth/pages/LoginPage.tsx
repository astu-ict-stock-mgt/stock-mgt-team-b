import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import { useLogin } from '../hooks';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { submitLogin } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google sign-in state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

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
      const response = await submitLogin({
        email,
        password,
      });

      // Role-based redirection
      if (response.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
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
    <div className="flex min-h-screen w-full bg-slate-900 font-sans text-slate-800">
      {/* Left Fixed Panel: Enterprise Branding & Logistics Imagery */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden lg:flex">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop')`,
          }}
        />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/60" />

        {/* Top Header Layer: Branding */}
        <div className="relative z-10 flex items-center gap-3 p-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
              />
            </svg>
          </div>
          <div>
            <span className="block text-xl font-bold tracking-wide text-white">
              LOGIX<span className="text-blue-500">STOCK</span>
            </span>
            <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">
              Enterprise Management
            </span>
          </div>
        </div>

        {/* Bottom Hero & Live Metrics Display */}
        <div className="relative z-10">
          <div className="max-w-xl">
            <h2 className="text-3xl leading-tight font-extrabold text-white">
              Real-time inventory intelligence & supply chain tracking.
            </h2>
          </div>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex w-full flex-col justify-between bg-white px-6 py-10 sm:px-12 lg:w-1/2 lg:px-16">
        {/* Mobile Header (Shown on small screens) */}
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
              />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-wide text-slate-900">
            LOGIX<span className="text-blue-600">STOCK</span>
          </span>
        </div>

        {/* Center Content Form */}
        <div className="mx-auto my-auto w-full max-w-md py-6">
          <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Sign in to Console
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Welcome back. Enter your credentials to access the terminal.
            </p>
          </header>

          {/* Quick Demo Logins Bar */}
          <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-slate-50 p-4 shadow-sm">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-blue-900 uppercase">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                Quick Demo Role Switch (1-Click Login)
              </span>
              <span className="text-[10px] font-medium text-blue-600">Password: password123</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {[
                {
                  role: 'Admin',
                  email: 'admin@example.com',
                  color: 'bg-purple-600 hover:bg-purple-700 text-white',
                },
                {
                  role: 'PAO Officer',
                  email: 'pao@example.com',
                  color: 'bg-blue-700 hover:bg-blue-800 text-white',
                },
                {
                  role: 'Storekeeper',
                  email: 'storekeeper@example.com',
                  color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                },
                {
                  role: 'Stock Clerk',
                  email: 'stockclerk@example.com',
                  color: 'bg-cyan-700 hover:bg-cyan-800 text-white',
                },
                {
                  role: 'Accountant',
                  email: 'accountant@example.com',
                  color: 'bg-amber-600 hover:bg-amber-700 text-white',
                },
                {
                  role: 'Dept Head',
                  email: 'depthead@example.com',
                  color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
                },
                {
                  role: 'Security',
                  email: 'security@example.com',
                  color: 'bg-rose-600 hover:bg-rose-700 text-white',
                },
              ].map((account) => (
                <button
                  key={account.role}
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setEmail(account.email);
                    setPassword('password123');
                    setAuthError('');
                    setIsSubmitting(true);
                    try {
                      await submitLogin({ email: account.email, password: 'password123' });
                      navigate('/dashboard');
                    } catch (err: unknown) {
                      const error = err as {
                        response?: { data?: { message?: string } };
                        message?: string;
                      };
                      setAuthError(error?.response?.data?.message || 'Login failed.');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className={`rounded-lg px-2.5 py-1.5 text-center text-xs font-semibold shadow-xs transition-transform active:scale-95 disabled:opacity-50 ${account.color}`}
                >
                  {account.role}
                </button>
              ))}
            </div>
          </div>

          {authError && (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4"
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
                  <p className="text-sm font-semibold text-red-800">Authentication Failed</p>
                  <p className="mt-0.5 text-sm text-red-700">{authError}</p>
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
                placeholder="name@company.com"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`w-full rounded-lg border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 ${
                  errors.email
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                } ${isSubmitting ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}`}
              />

              {errors.email && (
                <p id="email-error" className="mt-1.5 text-xs text-red-600" role="alert">
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
                  onChange={(event) => setRememberDevice(event.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-blue-500"
                />

                <span>Remember this device</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline focus:outline-none"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-blue-300"
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

              <span>{isSubmitting ? 'Authenticating...' : 'Sign in to Console'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Google login button */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={() => {
              setGoogleError('');
              setGoogleLoading(true);

              setTimeout(() => {
                setGoogleLoading(false);
                setGoogleError(
                  'Google sign-in is not configured yet. Please use your username or email and password.'
                );
              }, 1000);
            }}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                Connecting to Google...
              </>
            ) : (
              <>
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M21.35 12.23c0-.79-.07-1.55-.22-2.27H12v4.3h5.23a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.92-4.18 2.92-7.42Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 21.67c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.53A9.75 9.75 0 0 0 12 21.67Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.54 13.75A5.86 5.86 0 0 1 6.23 12c0-.61.11-1.2.31-1.75V7.72H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.28l3.25-2.53Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 6.22c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.28 14.63 2.33 12 2.33a9.75 9.75 0 0 0-8.71 5.39l3.25 2.53C7.31 7.94 9.46 6.22 12 6.22Z"
                  />
                </svg>
                Sign in with SSO / Google
              </>
            )}
          </button>

          {googleError && (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"
            >
              {googleError}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-6 text-center">
          <p className="text-xs text-slate-400">
            Need technical assistance? Contact your system administrator or{' '}
            <a
              href="mailto:support@company.com"
              className="font-medium text-blue-600 hover:underline"
            >
              IT Helpdesk
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
