"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Mot de passe incorrect");
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <img src="https://murhumide.fr/assets/img/logo-mur-humide.png"
          alt="Mur Humide" style={s.logo}
          onError={(e) => { e.target.style.display = "none"; }} />
        <h1 style={s.h1}>Espace administration</h1>
        <p style={s.subtitle}>Accès réservé à l'équipe Mur Humide</p>
        {error && <div style={s.error}>{error}</div>}
        <input
          type="password"
          style={s.input}
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          autoFocus
        />
        <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
          onClick={handleLogin} disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#F0F9FF", display: "flex",
    alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 380, background: "white", borderRadius: 20,
    padding: "36px 28px", border: "1px solid #E0F2FE", textAlign: "center" },
  logo: { height: 40, objectFit: "contain", marginBottom: 24 },
  h1: { fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" },
  subtitle: { fontSize: 14, color: "#94A3B8", margin: "0 0 24px" },
  error: { background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10,
    padding: "10px 14px", fontSize: 13, color: "#991B1B", marginBottom: 16 },
  input: { display: "block", width: "100%", padding: "13px 16px", borderRadius: 12,
    border: "2px solid #E2E8F0", fontSize: 15, color: "#0F172A", background: "white",
    boxSizing: "border-box", fontFamily: "inherit", outline: "none", marginBottom: 14 },
  btn: { display: "block", width: "100%", padding: "14px", borderRadius: 14,
    background: "#0284C7", color: "white", fontSize: 15, fontWeight: 700,
    border: "none", cursor: "pointer" },
};
