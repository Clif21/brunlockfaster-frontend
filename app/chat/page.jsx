// frontend/app/chat/page.jsx
"use client";

export default function ChatEntryPage() {
  return (
    <main style={wrap}>
      <h1 style={h1}>Chat with support</h1>

      {/* Back to homepage near the top */}
      <p style={{ marginBottom: "1rem" }}>
        <a href="/">← Back to homepage</a>
      </p>

      <p style={{ marginBottom: "1rem" }}>
        To use the live chat, you need to be logged in to your BRunlockfaster account.
      </p>

      <div style={box}>
        <p>If you already have an account:</p>
        <p>
          <a href="/login">Log in here</a>
        </p>
        <hr style={{ margin: "1.2rem 0" }} />
        <p>If you’re new:</p>
        <p>
          <a href="/register">Create an account</a>
        </p>
      </div>

      {/* Extra back link at the bottom as well */}
      <p style={{ marginTop: "1.5rem" }}>
        <a href="/">← Back to homepage</a>
      </p>

      <style jsx>{css}</style>
    </main>
  );
}

const wrap = { maxWidth: 520, margin: "3rem auto", padding: "0 1.5rem" };
const h1 = { fontSize: "2rem", marginBottom: "0.5rem" };
const box = {
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: "0.9rem",
  padding: "1.2rem",
};

const css = `
  :global(body){background:#FFFDFB;color:#1F2937}
  a{color:#FF6B00;text-decoration:none}
`;
