"use client";

import { useEffect, useState } from "react";
import ChatWidget from "../../components/ChatWidget";
import { API_BASE } from "../../lib/apiBase";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Chat state
  const [chatThread, setChatThread] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("br_user");
    const token = localStorage.getItem("br_token");

    if (!storedUser || !token) {
      setErr("You are not logged in.");
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchOrders(token);
      initChat(token);
    } catch (e) {
      console.error(e);
      setErr("Session error. Please log in again.");
      setLoading(false);
    }
  }, []);

  async function fetchOrders(token) {
    try {
      const res = await fetch("http://localhost:4242/api/me/orders", {
        headers: {
          Authorization: "Bearer " + token,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load orders");
      setOrders(data.orders || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function initChat(token) {
    setChatLoading(true);
    setChatError("");
    try {
      const res = await fetch("http://localhost:4242/api/chat/thread", {
        headers: {
          Authorization: "Bearer " + token,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load chat");

      // Expecting { ok, thread, messages }
      setChatThread(data.thread || null);
      setChatMessages(data.messages || []);
    } catch (e) {
      console.error("initChat error:", e);
      setChatError(e.message || "Failed to load chat");
    } finally {
      setChatLoading(false);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !chatThread) return;

    const token = localStorage.getItem("br_token");
    if (!token) {
      setChatError("Session expired. Please log in again.");
      return;
    }

    setSending(true);
    setChatError("");

    try {
      const res = await fetch("http://localhost:4242/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          threadId: chatThread.id,
          message: newMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");

      // Expecting { ok, message } or similar
      const saved = data.message || {
        id: Date.now(),
        thread_id: chatThread.id,
        sender_type: "user",
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, saved]);
      setNewMessage("");
    } catch (e) {
      console.error("handleSendMessage error:", e);
      setChatError(e.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function logout() {
    localStorage.removeItem("br_token");
    localStorage.removeItem("br_user");
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main style={wrap}>
        <p>Loading your account...</p>
      </main>
    );
  }

  if (err && !user) {
    return (
      <main style={wrap}>
        <h1 style={h1}>Account</h1>
        <p style={{ color: "#b91c1c" }}>{err}</p>
        <p>
          <a href="/login">Log in</a> or <a href="/register">create an account</a>
        </p>
      </main>
    );
  }

  return (
    <main style={wrap}>
      {/* Top mini-nav so you can go home without logging out */}
      <div style={topNav}>
        <a href="/" style={homeLink}>
          ← Back to homepage
        </a>
      </div>

      <div style={headerRow}>
        <div>
          <h1 style={h1}>Your account</h1>
          <p style={{ margin: 0 }}>Signed in as {user?.email}</p>
          {user?.phone && (
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#6B7280" }}>
              Phone: {user.phone}
            </p>
          )}
        </div>
        <button onClick={logout} style={btnSecondary}>
          Log out
        </button>
      </div>

      {err && <p style={{ color: "#b91c1c" }}>{err}</p>}

      {/* Orders + Chat side-by-side on desktop, stacked on mobile */}
      <div style={twoCols}>
        <section style={ordersBox}>
          <h2 style={{ marginTop: 0 }}>Your orders</h2>
          {orders.length === 0 ? (
            <p>You don&apos;t have any orders yet.</p>
          ) : (
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Order #</th>
                  <th style={th}>Brand</th>
                  <th style={th}>Model</th>
                  <th style={th}>IMEI</th>
                  <th style={th}>Price</th>
                  <th style={th}>Status</th>
                  <th style={th}>Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td style={td}>{o.order_number}</td>
                    <td style={td}>{o.brand}</td>
                    <td style={td}>{o.model || "-"}</td>
                    <td style={td}>{o.imei || "-"}</td>
                    <td style={td}>
                      {typeof o.price_cents === "number"
                        ? `$${(o.price_cents / 100).toFixed(2)}`
                        : "-"}
                    </td>
                    <td style={td}>{o.status}</td>
                    <td style={td}>
                      {o.created_at
                        ? new Date(o.created_at).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Chat card */}
        <section style={chatBox}>
          <h2 style={{ marginTop: 0 }}>Chat with support</h2>
          <p style={{ marginTop: 0, fontSize: "0.9rem", color: "#6B7280" }}>
            Ask about your unlock, provide extra details, or get help with your order.
          </p>

          {chatLoading ? (
            <p>Loading chat…</p>
          ) : (
            <>
              <div style={chatWindow}>
                {chatMessages.length === 0 ? (
                  <p style={{ fontSize: "0.9rem", color: "#6B7280" }}>
                    No messages yet. Start the conversation below.
                  </p>
                ) : (
                  chatMessages.map((m) => (
                    <div
                      key={m.id}
                      style={
                        m.sender_type === "user" ? userBubbleWrapper : adminBubbleWrapper
                      }
                    >
                      <div
                        style={m.sender_type === "user" ? userBubble : adminBubble}
                      >
                        <div style={{ fontSize: "0.85rem" }}>{m.message}</div>
                        <div style={bubbleMeta}>
                          {m.sender_type === "user" ? "You" : "Support"} ·{" "}
                          {m.created_at
                            ? new Date(m.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {chatError && (
                <p style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{chatError}</p>
              )}

              <form onSubmit={handleSendMessage} style={chatForm}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={2}
                  style={chatInput}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  style={chatSendBtn}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

const wrap = { maxWidth: 1000, margin: "3rem auto", padding: "0 1.5rem" };
const h1 = { fontSize: "2rem", marginBottom: "0.3rem" };

const topNav = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "1rem",
};

const homeLink = {
  textDecoration: "none",
  color: "#FF6B00",
  fontWeight: 600,
  fontSize: "0.95rem",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  marginBottom: "1.5rem",
};

const btnSecondary = {
  padding: "0.5rem 0.9rem",
  borderRadius: "0.6rem",
  border: "1px solid #E5E7EB",
  background: "#fff",
  cursor: "pointer",
};

const twoCols = {
  display: "grid",
  gridTemplateColumns: "2fr 1.3fr",
  gap: "1.5rem",
};

const ordersBox = {
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: "0.9rem",
  padding: "1.1rem",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.9rem",
  marginTop: "0.6rem",
};

const th = {
  textAlign: "left",
  padding: "0.5rem",
  borderBottom: "1px solid #E5E7EB",
  background: "#F9FAFB",
};

const td = {
  padding: "0.5rem",
  borderBottom: "1px solid #F3F4F6",
};

const chatBox = {
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: "0.9rem",
  padding: "1.1rem",
  display: "flex",
  flexDirection: "column",
};

const chatWindow = {
  flex: 1,
  minHeight: "180px",
  maxHeight: "260px",
  border: "1px solid #E5E7EB",
  borderRadius: "0.75rem",
  padding: "0.7rem",
  marginBottom: "0.7rem",
  overflowY: "auto",
  background: "#F9FAFB",
};

const chatForm = {
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
};

const chatInput = {
  width: "100%",
  padding: "0.5rem 0.6rem",
  borderRadius: "0.6rem",
  border: "1px solid #E5E7EB",
  resize: "none",
  fontSize: "0.9rem",
};

const chatSendBtn = {
  alignSelf: "flex-end",
  background: "linear-gradient(90deg, #FF6B00 0%, #FF8800 100%)",
  color: "#fff",
  padding: "0.45rem 0.9rem",
  borderRadius: "999px",
  border: "none",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: 600,
};

const userBubbleWrapper = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: "0.4rem",
};

const adminBubbleWrapper = {
  display: "flex",
  justifyContent: "flex-start",
  marginBottom: "0.4rem",
};

const userBubble = {
  maxWidth: "80%",
  background:
    "linear-gradient(90deg, rgba(255,107,0,0.12) 0%, rgba(255,136,0,0.18) 100%)",
  padding: "0.45rem 0.6rem",
  borderRadius: "0.8rem 0.1rem 0.8rem 0.8rem",
  fontSize: "0.9rem",
};

const adminBubble = {
  maxWidth: "80%",
  background: "#fff",
  border: "1px solid #E5E7EB",
  padding: "0.45rem 0.6rem",
  borderRadius: "0.1rem 0.8rem 0.8rem 0.8rem",
  fontSize: "0.9rem",
};

const bubbleMeta = {
  fontSize: "0.7rem",
  color: "#6B7280",
  marginTop: "0.2rem",
};

