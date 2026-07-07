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
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, background: "#0a0e17", color: "#eef2f9", fontFamily: "monospace" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <div style={{ fontSize: 48, fontWeight: 900, background: "linear-gradient(95deg,#ff5d75,#ffb020)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Error
            </div>
            <h1 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "12px 0" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 12, color: "#5d6d8a", lineHeight: 1.6 }}>
              An unexpected error occurred. Your data is safe — try reloading.
              If the problem persists, contact support.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: 20,
                background: "linear-gradient(135deg,#22d39a,#16b88a)",
                color: "#0d1220",
                fontWeight: 700,
                fontFamily: "monospace",
                padding: "10px 28px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
