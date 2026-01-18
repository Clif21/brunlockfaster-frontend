"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../lib/apiBase";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const pollRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("br_token") : null;
    setHasToken(!!token);
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("br_token") : null;

    // Stop polling when closed
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }

    // If user is not logged in, do nothing here (button click will redirect)
    if (!token) return;

    // Load immediately
    loadMessages(token);

    // Poll every 6 seconds while open
    pollRef.current = setInterval(() => loadMessages(token), 6000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive and widget is open
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function loadMessages(token) {
    try {
      const res = await fetch(`${API_BASE}/api/chat/messages`, {
        headers: { Authorization: "Bearer " + token },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load messages");
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Chat loadMessages:", err);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const token = localStorage.getItem("br_token");
    if (!token) {
      window.location.href = "/chat";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ message: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");

      setMessages((prev) => [...prev, data.message]);
      setInput("");
    } catch (err) {
      console.error("Chat sendMessage:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleButtonClick() {
    const token = localStorage.getItem("br_token");
    if (!token) {
      window.location.href = "/chat";
      return;
    }
    setOpen((o) => !o);
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleButtonClick}
        style={{
          position: "fixed",
          right: "1.25rem",
          bottom: "1.25rem",
          borderRadius: "999px",
          border: "none",
          padding: "0.8rem 1.15rem",
          background: "linear-gradient(90deg, #FF6B00 0%, #FF8800 100%)",
          color: "#fff",
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          zIndex: 50,
        }}
      >
        💬 Chat
      </button>

      {/* Chat Panel */}
      {open && hasToken && (
        <div
          style={{
            position: "fixed",
            right: "1.25rem",
            bottom: "4.25rem",
            width: "min(360px, calc(100vw - 2.5rem))",
            maxHeight: "440px",
            background: "#fff",
            borderRadius: "0.85rem",
            boxShadow: "0 14px 40px rgba(15,23,42,0.28)",
            border: "1px solid #E5E7EB",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 49,
          }}
        >
          <div
            style={{
              padding: "0.75rem 1rem",
              borderBottom: "1px solid #E5E7EB",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(90deg, #FF6B00 0%, #FF8800 100%)",
              color: "#fff",
              fontWeight: 800,
            }}
          >
            <span>Support chat</span>
            <button
              onClick={() => setOpen(false)}
              style={{
                border: "none",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
                fontSize: "1.15rem",
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              flex: 1,
              padding: "0.75rem",
              overflowY: "auto",
              fontSize: "0.95rem",
              background: "#F9FAFB",
            }}
          >
            {messages.length === 0 ? (
              <p style={{ color: "#6B7280", marginTop: 0 }}>
                Start the conversation and a representative will respond as soon as possible.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    marginBottom: "0.55rem",
                    textAlign: m.sender_type === "user" ? "right" : "left",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      padding: "0.45rem 0.75rem",
                      borderRadius: "0.85rem",
                      background: m.sender_type === "user" ? "#FFEDD5" : "#E5E7EB",
                      maxWidth: "100%",
                      wordBreak: "break-word",
                    }}
                  >
                    <div style={{ fontSize: "0.78rem", color: "#6B7280" }}>
                      {m.sender_type === "user" ? "You" : "Support"}
                    </div>
                    <div>{m.message}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={sendMessage}
            style={{
              borderTop: "1px solid #E5E7EB",
              padding: "0.55rem",
              display: "flex",
              gap: "0.45rem",
              background: "#fff",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                borderRadius: "999px",
                border: "1px solid #E5E7EB",
                padding: "0.55rem 0.8rem",
                fontSize: "0.95rem",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                borderRadius: "999px",
                border: "none",
                padding: "0.55rem 0.95rem",
                background: "linear-gradient(90deg, #FF6B00 0%, #FF8800 100%)",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              {loading ? "..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

