import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0D10",
          color: "#F7F8FA",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#69727D", letterSpacing: "0.06em" }}>404</p>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: "12px 0 0" }}>Page not found</h1>
          <Link href="/" style={{ display: "inline-block", marginTop: 24, color: "#B7BEC7" }}>
            Back to RAVAND →
          </Link>
        </div>
      </body>
    </html>
  );
}
