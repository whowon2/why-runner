"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8 font-sans">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-gray-500 max-w-md">
          {error.message?.includes("connect")
            ? "Could not connect to the database. Please try again later."
            : "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
