import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-blue-100/70"
        />

        <div
          aria-hidden="true"
          className="absolute -right-32 -bottom-40 h-96 w-96 rounded-full bg-blue-100/70"
        />

        <div className="relative z-10 w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}
