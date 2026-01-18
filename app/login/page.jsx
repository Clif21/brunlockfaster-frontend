"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../../lib/apiBase";

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
      const res = await fetch(`${API_BASE}/api/auth/login`, {
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
    <main className="wrap">
      <div className="top-actions">
        <a className="link" href="/">
          ← Back to homepage
        </a>
      </div>

      <h1 className="h1">Log in</h1>
      <p className="sub">
        Sign in to view your orders and chat with support.
      </p>

      <form onSubmit={submit} className="card">
        <label className="label">
          Email
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </label>

        <label className="label">
          Password
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Your password"
          />
        </label>

        {err && <p className="error">{err}</p>}

        <button disabled={loading} className="btn">
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="divider" />

        <p className="muted">
          New here?{" "}
          <a className="link" href="/register">
            Create an account
          </a>
        </p>
      </form>

      <style jsx>{`
        :global(body) {
          background: #fffdfb;
          color: #1f2937;
        }
        .wrap {
          max-width: 560px;
          margin: 2.25rem auto;
          padding: 0 1.1rem;
        }
        .top-actions {
          margin-bottom: 1rem;
        }
        .h1 {
          font-size: 2rem;
          margin: 0 0 0.4rem;
          letter-spacing: -0.02em;
        }
        .sub {
          margin: 0 0 1.1rem;
          color: #6b7280;
          line-height: 1.45;
        }
        .card {
          display: grid;
          gap: 0.9rem;
          background: #fff;
          border: 1px solid #e5e7eb;
          padding: 1.2rem;
          border-radius: 0.9rem;
          box-shadow: 0 12px 36px rgba(17, 24, 39, 0.08);
        }
        .label {
          font-size: 0.9rem;
          display: grid;
          gap: 0.35rem;
        }
        .input {
          width: 100%;
          padding: 0.7rem 0.8rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.7rem;
          background: #fff;
          font-size: 1rem;
        }
        .input:focus {
          outline: none;
          border-color: #ff6b00;
          box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.2);
        }
        .btn {
          width: 100%;
          background: linear-gradient(90deg, #ff6b00 0%, #ff8800 100%);
          color: #fff;
          padding: 0.8rem 1rem;
          border: none;
          border-radius: 0.8rem;
          cursor: pointer;
          font-weight: 800;
          font-size: 1rem;
        }
        .btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }
        .error {
          color: #b91c1c;
          margin: 0;
        }
        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 0.3rem 0;
        }
        .muted {
          margin: 0;
          color: #6b7280;
          line-height: 1.45;
        }
        .link {
          color: #ff6b00;
          text-decoration: none;
          font-weight: 700;
        }

        @media (max-width: 420px) {
          .wrap {
            margin: 1.6rem auto;
          }
          .h1 {
            font-size: 1.7rem;
          }
          .card {
            padding: 1rem;
          }
        }
      `}</style>
    </main>
  );
}

