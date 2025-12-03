"use client";

import { useState } from "react";

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(
        `http://localhost:4242/api/orders/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to find order");
      }
      setResult(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "3rem auto", padding: "0 1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Track your unlock</h1>
      <p style={{ marginBottom: "1.5rem" }}>
        Enter the order number we showed you after payment and the email you used.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", maxWidth: 420 }}>
        <label>
          Order number
          <input
            value={orderNumber}
            onChange={e => setOrderNumber(e.target.value)}
            required
            placeholder="e.g. BRMHVB01X6"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </label>
        <label>
          Email
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            type="email"
            placeholder="you@example.com"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </label>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#111827",
            color: "white",
            padding: "0.65rem 1rem",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer"
          }}
        >
          {loading ? "Checking..." : "Track order"}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: "2rem",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            padding: "1.25rem"
          }}
        >
          <h2 style={{ marginBottom: "0.5rem" }}>Order found ✅</h2>
          <p>
            <strong>Order:</strong> {result.order_number}
          </p>
          <p>
            <strong>Status:</strong> {result.status}
          </p>
          <p>
            <strong>Device:</strong> {result.brand} {result.model}
          </p>
          <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.75rem" }}>
            Statuses are updated by admin: pending_payment → processing → unlocked → completed.
          </p>
        </div>
      )}
    </main>
  );
}
