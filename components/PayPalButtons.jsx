"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4242";

function loadPayPalScript(clientId) {
  return new Promise((resolve, reject) => {
    if (!clientId) {
      reject(new Error("Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID"));
      return;
    }

    if (window.paypal && window.paypal.Buttons) {
      resolve(window.paypal);
      return;
    }

    const existingScript = document.querySelector('script[data-paypal-sdk="true"]');

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.paypal));
      existingScript.addEventListener("error", () =>
        reject(new Error("PayPal SDK failed to load"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=USD&components=buttons`;
    script.async = true;
    script.setAttribute("data-paypal-sdk", "true");

    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error("Failed to load PayPal SDK"));

    document.body.appendChild(script);
  });
}

export default function PayPalButtons({ orderNumber, onPaid }) {
  const containerRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let buttons = null;

    async function init() {
      try {
        if (!orderNumber) return;

        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        const paypal = await loadPayPalScript(clientId);

        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = "";

        buttons = paypal.Buttons({
          async createOrder() {
            const res = await fetch(`${API_BASE}/api/paypal/order/create`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ orderNumber }),
            });

            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.error || "Failed to create PayPal order");
            }

            return data.orderID;
          },

          async onApprove(data) {
            const res = await fetch(`${API_BASE}/api/paypal/order/capture`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderID: data.orderID,
                orderNumber,
              }),
            });

            const result = await res.json();

            if (!res.ok) {
              throw new Error(result.error || "Failed to capture PayPal payment");
            }

            alert("PayPal payment successful! Your order is now processing.");
            onPaid?.(result);
          },

          onError(err) {
            console.error("PayPal error:", err);
            setError(err.message || "PayPal failed.");
          },
        });

        await buttons.render(containerRef.current);
      } catch (err) {
        console.error(err);
        setError(err.message || "Something went wrong loading PayPal.");
      }
    }

    init();

    return () => {
      cancelled = true;
      if (buttons && typeof buttons.close === "function") {
        try {
          buttons.close();
        } catch {}
      }
    };
  }, [orderNumber, onPaid]);

  if (!orderNumber) return null;

  return (
    <div>
      <div ref={containerRef} />
      {error ? <p style={{ color: "red", marginTop: "10px" }}>{error}</p> : null}
    </div>
  );
}