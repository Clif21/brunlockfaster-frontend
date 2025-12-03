"use client";

export default function OrderSuccess({ searchParams }) {
  const orderNumber = searchParams?.order || "";

  return (
    <main style={{ maxWidth: 700, margin: "4rem auto", padding: "0 1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Payment successful ✅</h1>
      <p style={{ marginBottom: "1rem" }}>
        Thank you for your order. We’ve received your payment and will start processing your unlock.
      </p>
      {orderNumber ? (
        <p style={{ marginBottom: "1rem" }}>
          Your order number: <strong>{orderNumber}</strong>
        </p>
      ) : (
        <p style={{ marginBottom: "1rem" }}>
          We couldn’t read the order number from the URL, but your payment went through.
        </p>
      )}
      <p style={{ marginBottom: "1rem" }}>
        You’ll get an email with updates. You can track your order from the homepage.
      </p>
      <a
        href="/"
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
        Back to home
      </a>
    </main>
  );
}
