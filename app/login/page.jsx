"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("http://localhost:4242/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error || "Login failed");
      localStorage.setItem("br_token", data.token);
      localStorage.setItem("br_user", JSON.stringify(data.user));
      router.push("/account");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={wrap}>
      <h1 style={h1}>Log in</h1>
      <form onSubmit={submit} style={form}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={input}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={input}
          />
        </label>
        {err && <p style={{ color: "#b91c1c" }}>{err}</p>}
        <button disabled={loading} style={btnPrimary}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p>
          New here? <a href="/register">Create an account</a>
        </p>
      </form>
      <style jsx>{css}</style>
    </main>
  );
}

const wrap = { maxWidth: 520, margin: "3rem auto", padding: "0 1.5rem" };
const h1 = { fontSize: "2rem", marginBottom: "1rem" };
const form = {
  display: "grid",
  gap: "0.9rem",
  background: "#fff",
  border: "1px solid #E5E7EB",
  padding: "1.2rem",
  borderRadius: "0.9rem",
};
const input = {
  width: "100%",
  padding: "0.6rem 0.7rem",
  border: "1px solid #E5E7EB",
  borderRadius: "0.6rem",
  marginTop: "0.35rem",
};
const btnPrimary = {
  background: "linear-gradient(90deg, #FF6B00 0%, #FF8800 100%)",
  color: "#fff",
  padding: "0.75rem 1.1rem",
  border: "none",
  borderRadius: "0.6rem",
  cursor: "pointer",
  fontWeight: 700,
};

const css = `
  :global(body){background:#FFFDFB;color:#1F2937}
  a{color:#FF6B00;text-decoration:none}
  input:focus{outline:none;border-color:#FF6B00;box-shadow:0 0 0 3px rgba(255,107,0,.2)}
`;
