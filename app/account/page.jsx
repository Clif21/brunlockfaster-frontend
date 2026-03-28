"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChatWidget from "../../components/ChatWidget";
import { API_BASE } from "../../lib/apiBase";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Credit
  const [creditCents, setCreditCents] = useState(0);
  const [creditTx, setCreditTx] = useState([]);
  const [creditLoading, setCreditLoading] = useState(false);

  // ✅ Other amount input
  const [customAmount, setCustomAmount] = useState("");
  const [customErr, setCustomErr] = useState("");

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("br_token");
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("br_user");
    const tok = localStorage.getItem("br_token");

    if (!storedUser || !tok) {
      setErr("You are not logged in.");
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchOrders(tok);
      fetchChat(tok);
      fetchWallet(tok);
    } catch (e) {
      console.error(e);
      setErr("Session error. Please log in again.");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  async function fetchOrders(tok) {
    try {
      const res = await fetch(`${API_BASE}/api/me/orders`, {
        headers: { Authorization: "Bearer " + tok },
        cache: "no-store",
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

  async function fetchChat(tok) {
    try {
      const res = await fetch(`${API_BASE}/api/chat/messages`, {
        headers: { Authorization: "Bearer " + tok },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load chat messages");
      setChatMessages(data.messages || []);
    } catch (e) {
      console.error("fetchChat:", e);
    }
  }

  async function fetchWallet(tok) {
    setCreditLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/wallet/me`, {
        headers: { Authorization: "Bearer " + tok },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load credit");

      setCreditCents(data.credit_balance_cents || 0);
      setCreditTx(Array.isArray(data.transactions) ? data.transactions : []);
    } catch (e) {
      console.error("fetchWallet:", e);
    } finally {
      setCreditLoading(false);
    }
  }

  async function buyCredit(amountCents) {
    const tok = localStorage.getItem("br_token");
    if (!tok) {
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/wallet/topup/stripe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + tok,
        },
        body: JSON.stringify({ amountCents }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Top-up failed");

      window.location.href = data.url;
    } catch (e) {
      alert(e.message);
    }
  }

  // ✅ Custom amount handler ($5–$500, whole dollars)
  function buyCustomCredit() {
    setCustomErr("");
    const n = Number(customAmount);

    if (!Number.isFinite(n)) return setCustomErr("Enter a valid number.");
    if (n < 5) return setCustomErr("Minimum is $5.");
    if (n > 500) return setCustomErr("Maximum is $500.");
    if (!Number.isInteger(n)) return setCustomErr("Whole dollars only (no cents).");

    buyCredit(n * 100);
  }

  async function sendChatMessage(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const tok = localStorage.getItem("br_token");
    if (!tok) {
      window.location.href = "/login";
      return;
    }

    setChatLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + tok,
        },
        body: JSON.stringify({ message: chatInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");

      setChatMessages((prev) => [...prev, data.message]);
      setChatInput("");
    } catch (e2) {
      alert(e2.message);
    } finally {
      setChatLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("br_token");
    localStorage.removeItem("br_user");
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="wrap">
        <p>Loading your account...</p>
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (err && !user) {
    return (
      <main className="wrap">
        <h1 className="h1">Account</h1>
        <p className="error">{err}</p>
        <p className="muted">
          <a className="link" href="/login">
            Log in
          </a>{" "}
          or <a className="link" href="/register">create an account</a>
        </p>
        <p style={{ marginTop: "1rem" }}>
          <a className="link" href="/">← Back to homepage</a>
        </p>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="wrap">
      <div className="headerRow">
        <div>
          <h1 className="h1">Your account</h1>
          <p className="muted" style={{ margin: 0 }}>
            Signed in as <strong>{user?.email}</strong>
          </p>
          {user?.phone && (
            <p className="muted" style={{ margin: 0 }}>
              Phone: {user.phone}
            </p>
          )}
          <p style={{ marginTop: ".75rem" }}>
            <a className="link" href="/">← Back to homepage</a>
          </p>
        </div>

        <div className="headerBtns">
          <button onClick={logout} className="btnSecondary">
            Log out
          </button>
        </div>
      </div>

      {err && <p className="error">{err}</p>}

      <div className="twoCols">
        {/* Credit */}
        <section className="box">
          <div className="boxTitleRow">
            <h2 className="h2">BRunlockfaster Credit</h2>
            <span className="muted small">
              ${((creditCents || 0) / 100).toFixed(2)}
            </span>
          </div>

          <p className="muted small">
            Non-refundable credit usable only on brunlockfaster.com.
          </p>

          <div className="creditBtns">
            <button onClick={() => buyCredit(2500)} className="btnSecondary">$25</button>
            <button onClick={() => buyCredit(5000)} className="btnSecondary">$50</button>
            <button onClick={() => buyCredit(10000)} className="btnSecondary">$100</button>
            <button onClick={() => buyCredit(20000)} className="btnSecondary">$200</button>
          </div>

          {/* ✅ Other amount */}
          <div className="otherBox">
            <div className="otherLabel">Other amount</div>
            <div className="otherRow">
              <span className="dollar">$</span>
              <input
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setCustomErr("");
                }}
                placeholder="e.g. 75"
                className="otherInput"
                inputMode="numeric"
              />
              <button onClick={buyCustomCredit} className="otherBtn">
                Buy Credit
              </button>
            </div>
            {customErr ? <div className="otherErr">{customErr}</div> : null}
            <div className="muted small" style={{ marginTop: ".35rem" }}>
              Min $5 • Max $500 • Whole dollars only
            </div>
          </div>

          <button
            onClick={() => fetchWallet(localStorage.getItem("br_token"))}
            className="btnSecondary"
            style={{ width: "100%", marginTop: ".8rem" }}
            disabled={creditLoading}
          >
            {creditLoading ? "Refreshing..." : "Refresh Credit"}
          </button>

          {creditTx.length > 0 && (
            <div style={{ marginTop: ".85rem" }}>
              <p className="muted small" style={{ marginBottom: ".4rem" }}>
                Recent activity
              </p>
              {creditTx.slice(0, 6).map((t, i) => (
                <p key={i} className="muted small" style={{ margin: ".15rem 0" }}>
                  {t.type} — ${(t.amount_cents / 100).toFixed(2)} ({t.status})
                </p>
              ))}
            </div>
          )}
        </section>

        {/* Orders */}
        <section className="box">
          <div className="boxTitleRow">
            <h2 className="h2">Your orders</h2>
            <span className="muted small">{orders.length} total</span>
          </div>

          {orders.length === 0 ? (
            <p className="muted">You don&apos;t have any orders yet.</p>
          ) : (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>IMEI</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.order_number}</td>
                      <td>{o.brand}</td>
                      <td>{o.model || "-"}</td>
                      <td>{o.imei || "-"}</td>
                      <td>
                        {typeof o.price_cents === "number"
                          ? `$${(o.price_cents / 100).toFixed(2)}`
                          : "-"}
                      </td>
                      <td>{o.status}</td>
                      <td>{o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Chat */}
        <section className="box">
          <div className="boxTitleRow">
            <h2 className="h2">Support chat</h2>
            <span className="muted small">Messages saved</span>
          </div>

          <div className="chatArea">
            {chatMessages.length === 0 ? (
              <p className="muted" style={{ marginTop: 0 }}>
                Start a message and support will respond as soon as possible.
              </p>
            ) : (
              chatMessages.map((m) => (
                <div key={m.id} className={m.sender_type === "user" ? "msgRow me" : "msgRow"}>
                  <div className={m.sender_type === "user" ? "bubble me" : "bubble"}>
                    <div className="who">{m.sender_type === "user" ? "You" : "Support"}</div>
                    <div>{m.message}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={sendChatMessage} className="chatForm">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="chatInput"
              placeholder="Type your message..."
            />
            <button disabled={chatLoading} className="chatBtn" type="submit">
              {chatLoading ? "..." : "Send"}
            </button>
          </form>
        </section>
      </div>

      <ChatWidget />
      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  :global(body){
    background:#FFFDFB;
    color:#1F2937;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  }

  .wrap{
    max-width: 1100px;
    margin: 2.25rem auto;
    padding: 0 1.1rem;
  }

  .h1{
    font-size:2rem;
    margin: 0 0 .35rem;
    letter-spacing:-.02em;
  }
  .h2{ margin:0; font-size:1.15rem; }
  .muted{ color:#6B7280; }
  .small{ font-size: .85rem; }

  .link{
    color:#FF6B00;
    text-decoration:none;
    font-weight:800;
  }

  .headerRow{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap: 1rem;
    margin-bottom: 1.2rem;
  }

  .headerBtns{
    display:flex;
    gap:.6rem;
  }

  .btnSecondary{
    padding: .6rem .95rem;
    border-radius: .75rem;
    border: 1px solid #E5E7EB;
    background:#fff;
    cursor:pointer;
    font-weight:900;
  }

  .twoCols{
    display:grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    align-items:start;
  }

  .box{
    background:#fff;
    border:1px solid #E5E7EB;
    border-radius:.95rem;
    padding: 1.1rem;
    box-shadow: 0 12px 36px rgba(17,24,39,.06);
  }

  .boxTitleRow{
    display:flex;
    align-items:baseline;
    justify-content:space-between;
    gap:.8rem;
    margin-bottom:.75rem;
  }

  .creditBtns{
    display:flex;
    gap:.5rem;
    flex-wrap:wrap;
  }

  .otherBox{
    margin-top: .9rem;
    padding: .85rem;
    border: 1px solid #E5E7EB;
    border-radius: .85rem;
    background: #F9FAFB;
  }
  .otherLabel{
    font-weight: 900;
    margin-bottom: .45rem;
  }
  .otherRow{
    display:flex;
    gap:.5rem;
    align-items:center;
  }
  .dollar{
    font-weight: 900;
  }
  .otherInput{
    flex:1;
    border-radius: .75rem;
    border: 1px solid #E5E7EB;
    padding: .6rem .75rem;
    outline: none;
  }
  .otherInput:focus{
    border-color:#FF6B00;
    box-shadow:0 0 0 3px rgba(255,107,0,.18);
  }
  .otherBtn{
    border-radius: .75rem;
    border: none;
    padding: .65rem .9rem;
    background: linear-gradient(90deg, #FF6B00 0%, #FF8800 100%);
    color:#fff;
    font-weight: 900;
    cursor: pointer;
  }
  .otherErr{
    margin-top: .45rem;
    color:#B91C1C;
    font-weight: 800;
    font-size: .9rem;
  }

  .tableWrap{
    overflow-x:auto;
    -webkit-overflow-scrolling: touch;
    border: 1px solid #F3F4F6;
    border-radius: .8rem;
  }
  .table{
    width:100%;
    border-collapse:collapse;
    font-size:.92rem;
    min-width: 820px;
    background:#fff;
  }
  th, td{
    text-align:left;
    padding: .65rem .7rem;
    border-bottom:1px solid #F3F4F6;
    white-space:nowrap;
  }
  th{
    background:#F9FAFB;
    border-bottom:1px solid #E5E7EB;
    font-weight:900;
  }

  .error{
    color:#B91C1C;
    margin: .6rem 0 0;
    font-weight:800;
  }

  .chatArea{
    height: 360px;
    overflow-y:auto;
    background:#F9FAFB;
    border:1px solid #E5E7EB;
    border-radius:.85rem;
    padding:.75rem;
  }

  .msgRow{
    display:flex;
    justify-content:flex-start;
    margin-bottom:.55rem;
  }
  .msgRow.me{ justify-content:flex-end; }

  .bubble{
    background:#E5E7EB;
    border-radius:.85rem;
    padding:.45rem .7rem;
    max-width: 92%;
    word-break: break-word;
  }
  .bubble.me{ background:#FFEDD5; }
  .who{
    font-size:.78rem;
    color:#6B7280;
    margin-bottom:.15rem;
    font-weight:700;
  }

  .chatForm{
    display:flex;
    gap:.45rem;
    margin-top:.65rem;
  }
  .chatInput{
    flex:1;
    border-radius:999px;
    border:1px solid #E5E7EB;
    padding:.6rem .8rem;
    font-size:.95rem;
    outline:none;
  }
  .chatInput:focus{
    border-color:#FF6B00;
    box-shadow:0 0 0 3px rgba(255,107,0,.18);
  }
  .chatBtn{
    border-radius:999px;
    border:none;
    padding:.6rem .95rem;
    background: linear-gradient(90deg, #FF6B00 0%, #FF8800 100%);
    color:#fff;
    font-weight:900;
    cursor:pointer;
  }
  .chatBtn:disabled{
    opacity:.75;
    cursor:not-allowed;
  }

  @media (max-width: 900px){
    .chatArea{ height: 300px; }
  }
  @media (max-width: 520px){
    .wrap{ margin: 1.6rem auto; }
    .h1{ font-size: 1.7rem; }
    .headerRow{ flex-direction:column; align-items:flex-start; }
    .headerBtns{ width:100%; }
    .btnSecondary{ width:100%; }
    .creditBtns button{ width: 100%; }
    .otherRow{ flex-direction: column; align-items: stretch; }
    .otherBtn{ width: 100%; }
  }
`;
