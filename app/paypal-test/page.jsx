"use client";

import PayPalButtons from "../../components/PayPalButtons";

export default function PayPalTestPage() {
  return (
    <main style={{ padding: "40px" }}>
      <h1>PayPal Test</h1>
      <p>If PayPal is set up correctly, the button should appear below.</p>
      <PayPalButtons />
    </main>
  );
}