import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setSubmitError('');

    if (!email.trim()) {
      setError('Username or email is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      /*
       * Temporary frontend-only simulation.
       * This will later be replaced with the real password-reset API.
       */
      await new Promise((resolve) => {
        setTimeout(resolve, 1200);
      });

      setIsSubmitted(true);
    } catch {
      setSubmitError(
        'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError('');
    setSubmitError('');
  };

  return (
    <AuthLayout>
      <section
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        aria-labelledby="forgot-password-title"
      >
        {!isSubmitted ? (
          <>
            {/* Header */}
            <header className="mb-8 text-center">
              <div
                className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    width="18"
                    height="11"
                    x="3"
                    y="11"
                    rx="2"
                    ry="2"
                  />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <h1
                id="forgot-password-title"
                className="text-2xl font-bold tracking-tight text-slate-900"
              >
                Forgot Password?
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your username or email address and we&apos;ll
                help you reset your password.
              </p>
            </header>

            {/* Error message */}
            {submitError && (
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
                    <line
                      x1="12"
                      y1="16"
                      x2="12.01"
                      y2="16"
                    />
                  </svg>

                  <p className="text-sm text-red-700">
                    {submitError}
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form
              className="space-y-5"
              onSubmit={handleSubmit}
              noValidate
            >
              <div>
                <label
                  htmlFor="reset-email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Username or Email Address
                </label>

                <input
                  id="reset-email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(event) =>
                    handleEmailChange(event.target.value)
                  }
                  placeholder="Enter your username or email"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error ? 'reset-email-error' : undefined
                  }
                  className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                    error
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/10'
                  } ${
                    isSubmitting
                      ? 'cursor-not-allowed bg-slate-100'
                      : ''
                  }`}
                />

                {error && (
                  <p
                    id="reset-email-error"
                    className="mt-1.5 text-sm text-red-600"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </div>

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
                  {isSubmitting
                    ? 'Sending request...'
                    : 'Send Reset Instructions'}
                </span>
              </button>
            </form>

            {/* Back to login */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950 focus:outline-none focus:underline"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>

                Back to Login
              </Link>
            </div>
          </>
        ) : (
          /* Success state */
          <div className="text-center">
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Check Your Email
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              If an account exists for{' '}
              <span className="font-medium text-slate-700">
                {email}
              </span>
              , you&apos;ll receive password reset instructions
              shortly.
            </p>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              For security reasons, we don&apos;t reveal whether an
              account exists.
            </p>

            <Link
              to="/login"
              className="mt-6 flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Return to Login
            </Link>
          </div>
        )}
      </section>
    </AuthLayout>
  );
}