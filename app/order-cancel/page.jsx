export default function OrderCancel() {
  return (
    <main style={{ maxWidth: 700, margin: "4rem auto", padding: "0 1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Payment canceled ❌</h1>
      <p style={{ marginBottom: "1rem" }}>
        Your Stripe payment was canceled or not completed.
      </p>
      <p style={{ marginBottom: "1rem" }}>
        If this was a mistake, you can go back and submit the unlock again.
      </p>
      <a
        href="/#order"
        style={{
          display: "inline-block",
          marginTop: "1rem",
          background: "#111827",
          color: "#fff",
          padding: "0.6rem 1.1rem",
          borderRadius: "0.5rem",
          textDecoration: "none"
        }}
      >
        Try again
      </a>
    </main>
  );
}
