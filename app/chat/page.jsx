"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatAccessPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("br_token");
      const userStr = localStorage.getItem("br_user");

      // If already logged in, go straight to account (where chat lives)
      if (token && userStr) {
        router.push("/account");
        return;
      }
    } catch (e) {
      console.error("chat access check error:", e);
    } finally {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <main style={wrap}>
        <p>Checking your session...</p>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <h1 style={h1}>Chat with support</h1>
      <p style={p}>
        To chat with a representative, please log in or create a free account.
        This lets us link your conversation to your unlock orders and reply faster.
      </p>

      <div style={buttons}>
        <a href="/login" style={btnPrimary}>
          Log in
        </a>
        <a href="/register" style={btnSecondary}>
          Create an account
        </a>
      </div>

      <p style={hint}>
        Once you&apos;re signed in, you&apos;ll find the chat inside your account page.
      </p>
    </main>
  );
}

const wrap = { maxWidth: 600, margin: "3rem auto", padding: "0 1.5rem" };
const h1 = { fontSize: "2rem", marginBottom: "1rem" };
const p = { fontSize: "1rem", color: "#4B5563" };

const buttons = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  marginTop: "1.25rem",
};

const btnPrimary = {
  background: "linear-gradient(90deg, #FF6B00 0%, #FF8800 100%)",
  color: "#fff",
  padding: "0.75rem 1.2rem",
  borderRadius: "0.6rem",
  textDecoration: "none",
  fontWeight: 700,
};

const btnSecondary = {
  border: "1px solid #E5E7EB",
  padding: "0.75rem 1.2rem",
  borderRadius: "0.6rem",
  textDecoration: "none",
  color: "#111827",
  background: "#fff",
  fontWeight: 600,
};

const hint = {
  marginTop: "1rem",
  fontSize: "0.9rem",
  color: "#6B7280",
};
