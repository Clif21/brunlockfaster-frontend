"use client";

import { useState, useEffect, useMemo } from "react";
import ChatWidget from "../components/ChatWidget";
import { API_BASE } from "../lib/apiBase";

export default function Home() {
  // ===== Form state =====
  const [email, setEmail] = useState("");
  const [brand, setBrand] = useState("iPhone");
  const [customBrand, setCustomBrand] = useState("");
  const [model, setModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [imei, setImei] = useState("");
  const [price, setPrice] = useState("2900");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ After order creation, we show payment choices
  const [createdOrder, setCreatedOrder] = useState(null);
  // { orderNumber, priceCents, checkoutUrl }

  // ✅ Credit info (only used if user is logged in)
  const [creditCents, setCreditCents] = useState(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditError, setCreditError] = useState("");

  const [token, setToken] = useState(null);
  
  useEffect(() => {
    const t = localStorage.getItem("br_token");
    setToken(t);
  }, []);

  // ===== Brand + Model options =====
  const brandOptions = [
    "iPhone",
    "Samsung",
    "LG",
    "Motorola",
    "Google Pixel",
    "OnePlus",
    "Huawei",
    "Sony",
    "Nokia",
    "Xiaomi",
    "Other",
  ];

  const MODEL_MAP = {
    iPhone: [
      "iPhone 15 / 15 Pro / 15 Pro Max",
      "iPhone 14 / 14 Plus / 14 Pro",
      "iPhone 13 / 13 Pro / 13 mini",
      "iPhone 12 / 12 Pro",
      "iPhone 11 / 11 Pro",
      "iPhone XS / XS Max / XR",
      "iPhone SE (2nd/3rd Gen)",
      "Other",
    ],
    Samsung: [
      "Galaxy S24 / S24+ / S24 Ultra",
      "Galaxy S23 / S23+ / S23 Ultra",
      "Galaxy S22 / S22+ / S22 Ultra",
      "Galaxy Note 20 / 20 Ultra",
      "Galaxy Z Flip (all gens)",
      "Galaxy Z Fold (all gens)",
      "Galaxy A54 / A34 / A14",
      "Other",
    ],
    LG: ["LG V60 ThinQ", "LG G8 / G8X ThinQ", "LG Velvet", "LG Stylo 6", "LG K51 / K92", "Other"],
    Motorola: [
      "Moto G Power (all years)",
      "Moto G Stylus (all years)",
      "Motorola Edge (all)",
      "Motorola One 5G",
      "Moto E (all years)",
      "Other",
    ],
    "Google Pixel": ["Pixel 9 / 9 Pro", "Pixel 8 / 8 Pro", "Pixel 7 / 7 Pro", "Pixel 6 / 6 Pro", "Pixel 5 / 5a", "Other"],
    OnePlus: ["OnePlus 12 / 12R", "OnePlus 11 / 11R", "OnePlus 10 Pro / 10T", "OnePlus 9 / 9 Pro", "Nord N30 / N20", "Other"],
    Huawei: ["P60 / P60 Pro", "P50 / P50 Pro", "Mate 50 / 50 Pro", "Mate 40 / 40 Pro", "Nova series", "Other"],
    Sony: ["Xperia 1 V", "Xperia 5 V", "Xperia 10 V", "Xperia Pro / Pro-I", "Other"],
    Nokia: ["Nokia G50", "Nokia X100", "Nokia 5.4", "Nokia 3.4", "Other"],
    Xiaomi: ["Xiaomi 13 / 13 Pro", "Xiaomi 12 / 12 Pro", "Xiaomi 11 / 11T", "Redmi Note 13 / 12", "POCO F5 / F4", "Other"],
  };

  const modelOptions = useMemo(() => {
    if (brand === "Other") return ["Other"];
    return MODEL_MAP[brand] || ["Other"];
  }, [brand]);

  function onBrandChange(next) {
    setBrand(next);
    setCustomBrand("");
    setModel("");
    setCustomModel("");
  }

  function getFinalBrand() {
    return brand === "Other" ? customBrand.trim() : brand;
  }

  function getFinalModel() {
    if (brand === "Other") return customModel.trim();
    return model === "Other" ? customModel.trim() : model;
  }

  async function fetchCreditBalance() {
    if (!token) {
      setCreditCents(null);
      setCreditError("");
      return;
    }

    setCreditLoading(true);
    setCreditError("");
    try {
      const res = await fetch(`${API_BASE}/api/wallet/me`, {
        headers: { Authorization: "Bearer " + token },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load credit");

      setCreditCents(data.credit_balance_cents ?? 0);
    } catch (e) {
      setCreditError(e.message || "Failed to load credit");
      setCreditCents(null);
    } finally {
      setCreditLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCreatedOrder(null);
    setCreditCents(null);
    setCreditError("");

    try {
      const finalBrand = getFinalBrand();
      const finalModel = getFinalModel();

      if (!finalBrand) throw new Error("Please specify your brand.");
      if (!finalModel) throw new Error("Please specify your model.");
      if (!imei.trim()) {
        throw new Error("Please enter an IMEI (for now any value is fine while testing).");
      }

      const priceCents = parseInt(price || "2900", 10) || 2900;

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          brand: finalBrand,
          model: finalModel,
          imei,
          price_cents: priceCents,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Failed to create order");
      }

      // We need an order number to pay with credit.
      // Your backend usually returns it — support both names.
      const orderNumber = data.orderNumber || data.order_number || data.order?.order_number;

      setCreatedOrder({
        orderNumber: orderNumber || null,
        priceCents: priceCents,
        checkoutUrl: data.checkoutUrl,
      });

      // If logged in, fetch credit so we can show “Pay with Credit”
      await fetchCreditBalance();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function payWithCredit() {
    setError("");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (!createdOrder?.orderNumber) {
      setError("Missing order number from server. Tell me what /api/orders returns and I’ll fix it.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/orders/${encodeURIComponent(createdOrder.orderNumber)}/pay-with-credit`,
        {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Credit payment failed");

      // Refresh credit + give user a clear next step
      await fetchCreditBalance();
      alert("Paid with credit! You can track your order on the Track page.");
    } catch (e) {
      setError(e.message);
    }
  }

  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  const canPayWithCredit =
    token &&
    createdOrder &&
    typeof creditCents === "number" &&
    creditCents >= (createdOrder.priceCents || 0);

  return (
    <>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="left">
            <span>
              📞{" "}
              <a href="tel:+12392648481" className="toplink">
                +1 (239) 264-8481
              </a>
            </span>
            <span>
              ✉{" "}
              <a href="mailto:support@brunlockfaster.com" className="toplink">
                support@brunlockfaster.com
              </a>
            </span>
          </div>
          <div className="right">
            <span>USD</span>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <header className="navbar">
        <div className="container nav-inner">
          <div className="logo">BRunlockfaster</div>

          {/* Desktop links only */}
          <nav className="links desktop-only">
            <a href="#services">Services</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="/track">Track</a>
            <a href="/login">Login</a>
            <a href="/register">Create account</a>
            <a href="/account">Account</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="nav-actions">
            <a href="#order" className="nav-cta desktop-only">
              Unlock Now
            </a>

            {/* Mobile hamburger -> NEW PAGE */}
            <a className="mobile-menu-btn mobile-only" href="/menu" aria-label="Open menu">
              ☰
            </a>
          </div>
        </div>
      </header>

      {/* TRUST BAR */}
      <div className="trust">
        <div className="container trust-inner">
          <div>🔒 Secure Stripe Checkout</div>
          <div>↩ Money-Back Guarantee</div>
          <div>🕑 Avg 1–3 Business Days</div>
          <div>🌎 Global Carrier Coverage</div>
        </div>
      </div>

      {/* HERO + ORDER CARD */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <h1>Carrier unlock for iPhone, Samsung &amp; more.</h1>
            <p>Fast, remote, IMEI-based unlocks. Pay online, get updates by email. No jailbreak.</p>
            <ul className="bullets">
              <li>✅ Keep your data &amp; warranty</li>
              <li>✅ Works worldwide once unlocked</li>
              <li>✅ Transparent status tracking</li>
            </ul>
            <div className="hero-actions">
              <a href="#order" className="btn-primary">
                Start an Unlock
              </a>
              <a href="#pricing" className="btn-ghost">
                See pricing
              </a>
            </div>
          </div>

          <div className="hero-card" id="order">
            <h2>Quick Unlock Form</h2>
            <p className="muted">Enter your device info and pay securely.</p>

            <form onSubmit={handleSubmit} className="order-form">
              {/* Email */}
              <label>
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@example.com" />
              </label>

              {/* Brand */}
              <label>
                Brand
                <select value={brand} onChange={(e) => onBrandChange(e.target.value)}>
                  {brandOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>

              {/* Custom brand */}
              {brand === "Other" && (
                <label>
                  Enter brand name
                  <input type="text" value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} required placeholder="Enter your brand name" />
                </label>
              )}

              {/* Model */}
              {brand !== "Other" ? (
                <>
                  <label>
                    Model
                    <select
                      value={model}
                      onChange={(e) => {
                        const next = e.target.value;
                        setModel(next);
                        if (next !== "Other") setCustomModel("");
                      }}
                      required
                    >
                      <option value="" disabled>
                        Choose model
                      </option>
                      {modelOptions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>

                  {model === "Other" && (
                    <label>
                      Enter model name
                      <input type="text" value={customModel} onChange={(e) => setCustomModel(e.target.value)} required placeholder="e.g., Rare regional variant" />
                    </label>
                  )}
                </>
              ) : (
                <label>
                  Model
                  <input type="text" value={customModel} onChange={(e) => setCustomModel(e.target.value)} required placeholder="Enter your model" />
                </label>
              )}

              {/* IMEI */}
              <label>
                IMEI
                <input value={imei} onChange={(e) => setImei(e.target.value)} required placeholder="Dial *#06# to get it (for live use, any value for tests)" />
              </label>

              {/* Price */}
              <label>
                Price (cents)
                <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="100" required />
              </label>

              {error && <p className="error">{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary btn-full">
                {loading ? "Creating order..." : "Create Order"}
              </button>
            </form>

            {/* ✅ Payment options appear AFTER order creation */}
            {createdOrder && (
              <div className="payBox">
                <div className="payTitle">Choose how to pay</div>

                <div className="payRow">
                  <button
                    className="btn-primary btn-full"
                    onClick={() => (window.location.href = createdOrder.checkoutUrl)}
                    type="button"
                  >
                    Pay with Card (Stripe)
                  </button>
                </div>

                <div className="creditInfo">
                  {token ? (
                    <>
                      <div className="muted small">
                        Your credit:{" "}
                        {creditLoading
                          ? "Loading..."
                          : typeof creditCents === "number"
                          ? `$${(creditCents / 100).toFixed(2)}`
                          : "—"}
                      </div>

                      {creditError ? <div className="error">{creditError}</div> : null}

                      <button
                        className={`btn-ghost btn-full ${canPayWithCredit ? "" : "disabledBtn"}`}
                        onClick={payWithCredit}
                        type="button"
                        disabled={!canPayWithCredit}
                      >
                        {canPayWithCredit
                          ? `Pay with Credit ($${(createdOrder.priceCents / 100).toFixed(2)})`
                          : "Pay with Credit (insufficient funds)"}
                      </button>

                      <div className="muted small" style={{ marginTop: ".35rem" }}>
                        Need more credit?{" "}
                        <a
                          href="/account"
                          style={{
                            color: "var(--color-primary)",
                            fontWeight: 800,
                            textDecoration: "none",
                          }}
                        >
                          Add credit in your account
                        </a>
                        .
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        marginTop: ".35rem",
                        color: "#b91c1c",
                        fontSize: ".85rem",
                        fontWeight: 700,
                      }}
                    >
                      You must be logged in to use site credit.
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="safe-text">🔒 Secure payments</p>
          </div>
        </div>
      </section>

      {/* (rest of your page stays the same) */}
      {/* FEATURES */}
      <section className="section" id="services">
        <div className="container">
          <h2>Why choose BRunlockfaster?</h2>
          <div className="grid3">
            <div className="card">
              <h3>Unlock-only focus</h3>
              <p>We specialize in IMEI unlocks—no upsells, no distractions, just fast delivery.</p>
            </div>
            <div className="card">
              <h3>Clear statuses</h3>
              <p>Pending → Processing → Unlocked → Completed. Track anytime on the website.</p>
            </div>
            <div className="card">
              <h3>Refund policy</h3>
              <p>If your carrier/model is unsupported after payment, you can be refunded.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="section alt" id="how">
        <div className="container">
          <h2>How it works</h2>
          <div className="steps">
            <div className="step">
              <h3>1. Submit IMEI</h3>
              <p>Provide brand/model and the IMEI you want to unlock.</p>
            </div>
            <div className="step">
              <h3>2. Pay online</h3>
              <p>Checkout securely via Stripe or use your site credit.</p>
            </div>
            <div className="step">
              <h3>3. We unlock it</h3>
              <p>We process your request and email you as soon as it’s unlocked.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="container">
          <h2>Simple pricing</h2>
          <div className="pricing">
            <div className="price-card">
              <div className="tag">Standard</div>
              <div className="price">$29</div>
              <ul>
                <li>Most common carriers</li>
                <li>1–3 business days</li>
                <li>Email status updates</li>
              </ul>
              <a href="#order" className="btn-primary btn-full">
                Choose Standard
              </a>
            </div>
            <div className="price-card popular">
              <div className="tag">Express</div>
              <div className="price">$59</div>
              <ul>
                <li>Priority processing</li>
                <li>Same-day when available</li>
                <li>Priority support</li>
              </ul>
              <a href="#order" className="btn-primary btn-full">
                Choose Express
              </a>
            </div>
          </div>
          <p className="muted center" style={{ marginTop: "0.5rem" }}>
            * Final price may vary by carrier/model. You’ll see your total at checkout.
          </p>
        </div>
      </section>

      {/* SUPPORTED */}
      <section className="section alt">
        <div className="container">
          <h2>Supported carriers &amp; brands</h2>
          <div className="logos">
            <span>AT&amp;T</span>
            <span>T-Mobile</span>
            <span>Verizon</span>
            <span>Metro</span>
            <span>Cricket</span>
            <span>Spectrum</span>
            <span>iPhone</span>
            <span>Samsung</span>
            <span>LG</span>
            <span>Motorola</span>
          </div>
          <p className="muted center">Don’t see yours? Submit the form anyway—if unsupported, we’ll refund you.</p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section">
        <div className="container">
          <h2>What customers say</h2>
          <div className="grid3">
            <div className="card">
              <p>“Paid at lunch, email same evening that my iPhone was unlocked. Swapped SIM and it worked.”</p>
              <div className="who">— Miguel R.</div>
            </div>
            <div className="card">
              <p>“Clear steps and they refunded my friend when her carrier wasn’t supported. Legit.”</p>
              <div className="who">— Ashley P.</div>
            </div>
            <div className="card">
              <p>“Used for Samsung unlocks for our small shop. Fast and consistent.”</p>
              <div className="who">— Len’s Phones</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section alt">
        <div className="container">
          <h2>FAQ</h2>
          <div className="faq">
            {faqData.map((f, i) => (
              <div key={i} className="faq-item">
                <button className="faq-q" onClick={() => toggleFaq(i)} aria-expanded={openFaq === i}>
                  {f.q}
                  <span className="chev">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer" id="contact">
        <div className="container footer-inner">
          <div>
            <h3>BRunlockfaster</h3>
            <p>Fast, secure, IMEI-based phone unlock service.</p>
            <p className="muted small">We do not jailbreak or modify software. Payments via Stripe or site credit.</p>
          </div>
          <div>
            <h4>Contact</h4>
            <p>
              <a href="mailto:support@brunlockfaster.com">support@brunlockfaster.com</a>
            </p>
            <p>
              <a href="tel:+12392648481">+1 (239) 264-8481</a>
            </p>
          </div>
          <div>
            <h4>Links</h4>
            <p><a href="#how">How it works</a></p>
            <p><a href="/track">Track order</a></p>
            <p><a href="/login">Login</a></p>
            <p><a href="/register">Create account</a></p>
            <p><a href="/account">Account</a></p>
            <p><a href="#contact">Contact</a></p>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} BRunlockfaster. All rights reserved.</div>
      </footer>

      <ChatWidget />

      <style jsx>{`
        :global(:root) {
          --color-primary: #ff6b00;
          --color-primary-2: #ff8800;
          --color-dark: #111827;
          --color-bg: #fffdfb;
          --color-accent: #ffe7d6;
          --color-text: #1f2937;
          --color-muted: #6b7280;
          --color-border: #e5e7eb;
        }
        :global(body) {
          margin: 0;
          background: var(--color-bg);
          color: var(--color-text);
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        }

        .desktop-only { display: block; }
        .mobile-only { display: none; }

        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .topbar {
          background: var(--color-dark);
          color: #fff;
          font-size: 0.8rem;
        }
        .topbar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 38px;
        }
        .topbar .left span { margin-right: 1rem; }
        .toplink { color: #fff; text-decoration: none; }

        .navbar {
          background: #fff;
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          gap: 1rem;
        }
        .logo { font-weight: 800; font-size: 1.15rem; color: var(--color-dark); }
        .links a {
          margin-right: 1rem;
          text-decoration: none;
          color: var(--color-dark);
          font-size: 0.95rem;
          white-space: nowrap;
        }
        .nav-actions { display: flex; align-items: center; gap: 0.75rem; }
        .nav-cta {
          background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-2) 100%);
          color: #fff;
          padding: 0.45rem 1rem;
          border-radius: 9999px;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 800;
          white-space: nowrap;
        }
        .mobile-menu-btn {
          width: 44px;
          height: 44px;
          border-radius: 0.75rem;
          border: 1px solid var(--color-border);
          background: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--color-dark);
          text-decoration: none;
        }

        .trust {
          background: var(--color-dark);
          background-image: linear-gradient(90deg, rgba(255,107,0,0.15), rgba(255,136,0,0.15));
          color: #eaeef6;
          font-size: 0.9rem;
        }
        .trust-inner {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.75rem;
          padding: 0.7rem 0;
        }

        .hero {
          background: radial-gradient(1000px 400px at 10% -10%, rgba(255, 107, 0, 0.12), transparent 50%),
            radial-gradient(900px 380px at 90% -20%, rgba(255, 136, 0, 0.12), transparent 50%), #fff;
          padding: 2.4rem 0 3.2rem;
          border-bottom: 1px solid var(--color-border);
        }
        .hero-inner { display: flex; gap: 2rem; align-items: flex-start; }
        .hero-text { flex: 1.1; }
        .hero-text h1 { font-size: 2.45rem; margin: 0 0 0.8rem; color: var(--color-dark); letter-spacing: -0.02em; }
        .hero-text p { color: var(--color-muted); margin: 0 0 0.9rem; }
        .bullets { margin: 0 0 1.1rem 1.2rem; color: #374151; }
        .hero-actions { display: flex; gap: 0.85rem; align-items: center; margin: 1rem 0 0; }

        .btn-primary {
          background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-2) 100%);
          color: #fff;
          padding: 0.75rem 1.2rem;
          border-radius: 0.6rem;
          text-decoration: none;
          border: none;
          cursor: pointer;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(255, 107, 0, 0.25);
        }
        .btn-ghost {
          padding: 0.75rem 1.2rem;
          border: 1.5px solid var(--color-primary);
          border-radius: 0.6rem;
          color: var(--color-primary);
          text-decoration: none;
          background: #fff;
          cursor: pointer;
          font-weight: 800;
        }
        .btn-full { width: 100%; text-align: center; }

        .hero-card {
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1.2rem;
          width: 380px;
          box-shadow: 0 14px 45px rgba(17, 24, 39, 0.12);
        }
        .muted { color: var(--color-muted); }
        .center { text-align: center; }

        .order-form { display: grid; gap: 0.85rem; margin-top: 0.9rem; }
        .order-form label { font-size: 0.86rem; display: grid; gap: 0.35rem; color: var(--color-dark); }
        .order-form input, .order-form select {
          padding: 0.6rem 0.7rem;
          border: 1px solid var(--color-border);
          border-radius: 0.6rem;
          background: #fff;
          transition: box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .order-form input:focus, .order-form select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.2);
        }
        .error { color: #b91c1c; font-size: 0.9rem; }
        .safe-text { font-size: 0.78rem; color: var(--color-muted); margin-top: 0.7rem; text-align: center; }

        .payBox{
          margin-top: 0.9rem;
          border-top: 1px solid var(--color-border);
          padding-top: 0.9rem;
          display: grid;
          gap: 0.65rem;
        }
        .payTitle{
          font-weight: 900;
          color: var(--color-dark);
        }
        .creditInfo{ display: grid; gap: .5rem; }
        .small{ font-size: .85rem; }

        .disabledBtn{
          opacity: .6;
          cursor: not-allowed;
        }

        .section { padding: 3rem 0; background: #fff; }
        .section.alt { background: var(--color-accent); }
        .section h2 { text-align: center; margin: 0 0 1.4rem; color: var(--color-dark); }

        .grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.2rem; }
        .card { background: #fff; border: 1px solid var(--color-border); border-radius: 0.8rem; padding: 1rem; }

        .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1.2rem; }
        .step { background: #fff; border: 1px solid var(--color-border); border-radius: 0.8rem; padding: 1rem; }

        .pricing { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.2rem; align-items: stretch; }
        .price-card { background: linear-gradient(180deg,#fff 0%,#fff 60%,rgba(255,231,214,0.45) 100%); border: 1px solid var(--color-border); border-radius: 1rem; padding: 1.1rem; display: grid; gap: 0.6rem; }
        .price-card .tag { font-weight: 700; color: var(--color-dark); }
        .price { font-size: 2rem; font-weight: 900; color: var(--color-dark); letter-spacing: -0.02em; }
        .price-card ul { margin: 0.3rem 0 0.6rem 1.1rem; color: #374151; }
        .popular { border: 2px solid var(--color-primary); box-shadow: 0 16px 40px rgba(255, 107, 0, 0.18); }

        .logos { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.8rem; justify-items: center; padding-top: 0.4rem; }
        .logos span { background: #fff; border: 1px solid var(--color-border); border-radius: 0.6rem; padding: 0.7rem 1rem; font-weight: 700; color: var(--color-dark); box-shadow: 0 6px 18px rgba(17, 24, 39, 0.06); }

        .who { margin-top: 0.5rem; font-size: 0.95rem; color: var(--color-muted); }

        .faq { max-width: 850px; margin: 0 auto; }
        .faq-item { background: #fff; border: 1px solid var(--color-border); border-radius: 0.8rem; margin-bottom: 0.7rem; overflow: hidden; }
        .faq-q { width: 100%; text-align: left; background: #fff; border: none; padding: 0.95rem 1rem; font-size: 1rem; display: flex; align-items: center; justify-content: space-between; cursor: pointer; color: var(--color-dark); }
        .faq-a { padding: 0.95rem 1rem; border-top: 1px solid var(--color-border); color: #374151; background: #fff; }
        .chev { font-weight: 900; color: var(--color-muted); }

        .footer { background: var(--color-dark); color: #fff; padding: 2.4rem 0 1rem; }
        .footer a { color: #fff; text-decoration: none; }
        .footer-inner { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.2rem; }
        .footer-bottom { text-align: center; margin-top: 1.2rem; font-size: 0.85rem; color: #e5e7eb; }

        @media (max-width: 900px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: inline-flex !important; }

          .topbar-inner { height: auto; padding: 0.6rem 0; gap: 0.45rem; flex-direction: column; align-items: flex-start; }
          .topbar .left { display: grid; gap: 0.35rem; }
          .topbar .left span { margin-right: 0; }

          .nav-inner { height: auto; padding: 0.75rem 0; }
          .trust-inner { grid-template-columns: 1fr 1fr; }
          .hero-inner { flex-direction: column; }
          .hero-text h1 { font-size: 1.85rem; line-height: 1.15; }
          .hero-actions { flex-direction: column; align-items: stretch; gap: 0.75rem; }
          .hero-actions a { width: 100%; text-align: center; }
          .hero-card { width: 100%; padding: 1rem; }
        }

        @media (max-width: 380px) {
          .container { padding: 0 1rem; }
          .trust-inner { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}

const faqData = [
  { q: "Is this permanent? Will it relock after updates?", a: "IMEI unlocks are permanent and tied to your device’s IMEI. Your phone will remain unlocked across updates and resets." },
  { q: "How long does an unlock take?", a: "Standard is typically 1–3 business days. Express aims for same-day when available. Exact timing depends on carrier/model." },
  { q: "What happens if my carrier isn’t supported?", a: "If we can’t process your unlock after payment due to an unsupported case, we’ll issue a refund." },
  { q: "Do you need my Apple ID or passcode?", a: "No, never. We only need your IMEI (dial *#06#). Keep your accounts secure and private." },
  { q: "Is payment safe?", a: "Yes. All payments are processed by Stripe. We do not store or process card numbers on our servers." },
];

