export default function MobileMenuPage() {
  return (
    <main style={wrap}>
      <header style={top}>
        <a href="/" style={back}>← Back</a>
        <div style={brand}>BRunlockfaster</div>
        <div style={{ width: 60 }} />
      </header>

      <nav style={menu}>
        <a href="/#services" style={item}>Services</a>
        <a href="/#how" style={item}>How it works</a>
        <a href="/#pricing" style={item}>Pricing</a>
        <a href="/track" style={item}>Track</a>
        <a href="/login" style={item}>Login</a>
        <a href="/register" style={item}>Create account</a>
        <a href="/account" style={item}>Account</a>
        <a href="/#contact" style={item}>Contact</a>
      </nav>

      <a href="/#order" style={cta}>Unlock Now</a>
    </main>
  );
}

const wrap = {
  minHeight: "100vh",
  background: "#FFFDFB",
  padding: "0 1.25rem 1.5rem",
};

const top = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "1.1rem 0",
  borderBottom: "1px solid #E5E7EB",
};

const brand = {
  fontWeight: 900,
  fontSize: "1.05rem",
  color: "#111827",
};

const back = {
  textDecoration: "none",
  color: "#FF6B00",
  fontWeight: 800,
  width: 60,
};

const menu = {
  display: "grid",
  gap: "0.85rem",
  padding: "1.25rem 0",
};

const item = {
  display: "block",
  padding: "1rem",
  borderRadius: "0.9rem",
  border: "1px solid #E5E7EB",
  background: "#fff",
  textDecoration: "none",
  color: "#111827",
  fontWeight: 800,
};

const cta = {
  display: "block",
  marginTop: "0.4rem",
  padding: "1rem",
  textAlign: "center",
  borderRadius: "0.9rem",
  textDecoration: "none",
  color: "#fff",
  fontWeight: 900,
  background: "linear-gradient(90deg, #FF6B00 0%, #FF8800 100%)",
};
