'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // refetchOnWindowFocus={false} makes dev mode feel faster
    // The session will still be updated on page loads.
    <SessionProvider refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}