// frontend/components/ChatWidget.jsx
"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../lib/apiBase";

export default function ChatWidget() {
  const [token, setToken] = useState(null);
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [input, setInput] = useState("");

  const pollRef = useRef(null);
  const bottomRef = useRef(null);

  // Get token from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem("br_token");
    if (!t) {
      setLoading(false);
      return;
    }
    setToken(t);
  }, []);

  // When token is set, load /api/chat/thread
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadThread() {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch("http://localhost:4242/api/chat/thread", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load chat");
        if (cancelled) return;
        setThread(data.thread);
        setMessages(data.messages || []);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadThread();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!token || !thread) return;

    async function poll() {
      try {
        const res = await fetch(
          `http://localhost:4242/api/chat/messages?thread_id=${thread.id}`,
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );
        const data = await res.json();
        if (!res.ok || !data.ok) {
          console.error(data.error || "Failed to poll messages");
          return;
        }
        setMessages(data.messages || []);
      } catch (e) {
        console.error("poll error:", e);
      }
    }

    pollRef.current = setInterval(poll, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [token, thread]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !token || !thread) return;

    try {
      setSending(true);
      setErr("");
      const res = await fetch("http://localhost:4242/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          thread_id: thread.id,
          message: input.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to send message");

      // Optimistically append, then let poll refresh
      setMessages((prev) => [...prev, data.message]);
      setInput("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  }

  // If no token: prompt to log in
  if (!token) {
    return (
      <div style={widgetBox}>
        <h3 style={title}>Support chat</h3>
        <p style={muted}>
          Log in to your account to chat with support about your unlock orders.
        </p>
        <a href="/login" style={linkButton}>
          Go to login
        </a>
      </div>
    );
  }

  if (loading && !thread) {
    return (
      <div style={widgetBox}>
        <h3 style={title}>Support chat</h3>
        <p style={muted}>Loading your chat…</p>
      </div>
    );
  }

  return (
    <div style={widgetBox}>
      <h3 style={title}>Support chat</h3>
      <p style={muted}>
        Ask us anything about your unlock. We&apos;ll reply as soon as we&apos;re online.
      </p>
      {err && <p style={errorText}>{err}</p>}

      <div style={messagesBox}>
        {messages.length === 0 && (
          <p style={mutedSmall}>Start the conversation by sending us a message.</p>
        )}
        {messages.map((m) => {
          const isUser = m.sender_type === "user";
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                marginBottom: "0.35rem",
              }}
            >
              <div
                style={{
                  ...bubble,
                  background: isUser ? "#FF6B00" : "#F3F4F6",
                  color: isUser ? "#fff" : "#111827",
                }}
              >
                <div style={{ fontSize: "0.8rem", marginBottom: "0.15rem" }}>
                  {isUser ? "You" : "Support"}
                </div>
                <div>{m.message}</div>
                <div style={timestamp}>
                  {m.created_at
                    ? new Date(m.created_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : ""}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={formRow}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          style={inputBox}
        />
        <button type="submit" style={sendBtn} disabled={sending || !input.trim()}>
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}

const widgetBox = {
  border: "1px solid #E5E7EB",
  borderRadius: "0.9rem",
  padding: "1rem",
  background: "#FFFFFF",
  maxWidth: "480px",
};

const title = {
  margin: "0 0 0.4rem",
  fontSize: "1.1rem",
  fontWeight: 700,
};

const muted = {
  margin: "0 0 0.6rem",
  fontSize: "0.9rem",
  color: "#6B7280",
};

const mutedSmall = {
  margin: "0",
  fontSize: "0.85rem",
  color: "#9CA3AF",
};

const errorText = {
  margin: "0 0 0.4rem",
  fontSize: "0.87rem",
  color: "#B91C1C",
};

const messagesBox = {
  border: "1px solid #E5E7EB",
  borderRadius: "0.75rem",
  padding: "0.6rem",
  height: "220px",
  overflowY: "auto",
  marginBottom: "0.6rem",
  background: "#F9FAFB",
};

const bubble = {
  maxWidth: "80%",
  borderRadius: "0.75rem",
  padding: "0.4rem 0.55rem",
  fontSize: "0.9rem",
};

const timestamp = {
  marginTop: "0.1rem",
  fontSize: "0.7rem",
  opacity: 0.8,
};

const formRow = {
  display: "flex",
  gap: "0.5rem",
};

const inputBox = {
  flex: 1,
  padding: "0.5rem 0.7rem",
  borderRadius: "0.6rem",
  border: "1px solid #E5E7EB",
  fontSize: "0.9rem",
};

const sendBtn = {
  padding: "0.5rem 0.9rem",
  borderRadius: "0.6rem",
  border: "none",
  background:
    "linear-gradient(90deg, #FF6B00 0%, #FF8800 100%)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.9rem",
};

const linkButton = {
  display: "inline-block",
  padding: "0.5rem 0.9rem",
  borderRadius: "0.6rem",
  border: "1px solid #FF6B00",
  background: "#fff",
  color: "#FF6B00",
  fontWeight: 600,
  textDecoration: "none",
  fontSize: "0.9rem",
};
