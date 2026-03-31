"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: "Outfit, sans-serif", background: "var(--warm-white)" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "2rem",
          }}
        >
          <div
            style={{
              maxWidth: 560,
              width: "100%",
              background: "white",
              borderRadius: 16,
              padding: "1.5rem",
              boxShadow: "var(--shadow-sm)",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginBottom: 12 }}>Kutilmagan xatolik yuz berdi</h2>
            <p style={{ color: "var(--gray-500)", marginBottom: 16 }}>
              Muammo logga yuborildi. Iltimos, qayta urinib ko'ring.
            </p>
            <button className="btn btn-primary" onClick={() => reset()}>
              Qayta urinish
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
