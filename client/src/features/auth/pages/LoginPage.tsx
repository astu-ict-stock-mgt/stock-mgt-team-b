import { useState, type FormEvent } from 'react';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Temporary frontend-only behavior.
    // This will be replaced with the real authentication service later.
    console.log({
      email,
      password,
      rememberDevice,
    });
  };

  const handleForgotPassword = () => {
    // This will be connected to the ForgotPassword page later.
    console.log('Forgot password clicked');
  };

  const handleGoogleLogin = () => {
    // This will be connected to Google OAuth later.
    console.log('Continue with Google clicked');
  };

  return (
    <AuthLayout>
      <section
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        aria-labelledby="login-title"
      >
        {/* Logo and heading */}
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

        {/* Login form */}
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
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your username or email"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          {/* Password */}
          <PasswordInput
            value={password}
            onChange={setPassword}
          />

          {/* Remember device / Forgot password */}
          <div className="flex items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="remember"
                checked={rememberDevice}
                onChange={(event) =>
                  setRememberDevice(event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 accent-slate-900"
              />

              <span>Remember this device</span>
            </label>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-medium text-slate-700 transition hover:text-slate-950 focus:outline-none focus:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Log in to Console
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
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          {/* Google icon */}
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

        {/* Help information */}
        <footer className="mt-6">
          <p className="text-center text-xs leading-5 text-slate-500">
            Having terminal access issues? Contact your IT Helpdesk.
          </p>
        </footer>
      </section>
    </AuthLayout>
  );
}