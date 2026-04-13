import React, { useState, useEffect, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function ErrorBoundary({ children }: Props) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4 text-center">
        <div className="glass-card p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-neon-purple mb-4">Something went wrong</h2>
          <p className="text-gray-400 mb-6">
            {error?.message.startsWith('{') 
              ? "A database error occurred. Please try again later."
              : "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-neon-accent text-dark-bg font-bold rounded-full hover:opacity-90 transition-opacity"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


