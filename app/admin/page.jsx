"use client";

import { useState, useEffect } from "react";

const STATUS = {
  nouveau:  { label: "Nouveau",  bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  en_cours: { label: "En cours", bg: "#FFFBEB", color: "#B45309", border: "#FDE68A" },
  resolu:   { label: "Résolu",   bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
};
const NEXT = { nouveau: "en_cours", en_cours: "resolu", resolu: "nouveau" };
const STAR_COLOR = (n) => n <= 2 ? "#EF4444" : n === 3 ? "#EAB308" : "#22C55E";
const STARS = (n) => [1,2,3,4,5].map((i) => i <= n ? "★" : "☆").join("");

export default function AdminDashboard() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [agenceFilter, setAgenceFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch("/api/admin/feedbacks")
      .then((r) => r.json())
      .then((d) => { setFeedbacks(d.feedbacks || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const bump = async (id, currentStatus) => {
    const next = NEXT[currentStatus];
    await fetch("/api/admin/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    setFeedbacks((prev) => prev.map((f) => f.id === id ? { ...f, status: next } : f));
  };

  const agences = [...new Set(feedbacks.map((f) => f.location_name).filter(Boolean))];

  const visible = feedbacks
    .filter((f) => statusFilter === "all" || f.status === statusFilter)
    .filter((f) => agenceFilter === "all" || f.location_name === agenceFilter);

  const count = (s) => feedbacks.filter((f) => f.status === s).length;

  const parsePrestations = (raw) => {
    try { return JSON.parse(raw); } catch { return []; }
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <img src="https://murhumide.fr/assets/img/logo-mur-humide.png"
          alt="" style={s.logo} onError={(e) => { e.target.style.display = "none"; }} />
        <h1 style={s.h1}>Retours clients</h1>
        <span style={s.total}>{feedbacks.length} retour{feedbacks.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        {Object.entries(STATUS).map(([key, cfg]) => (
          <button key={key}
            style={{ ...s.statBtn, borderColor: cfg.border,
              background: statusFilter === key ? cfg.bg : "white",
              color: cfg.color }}
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}>
            <span style={s.statCount}>{count(key)}</span>
            <span style={s.statLabel}>{cfg.label}</span>
          </button>
        ))}
      </div>

      {/* Filtre agence */}
      {agences.length > 1 && (
        <div style={s.filterRow}>
          <select style={s.select} value={agenceFilter}
            onChange={(e) => setAgenceFilter(e.target.value)}>
            <option value="all">Toutes les agences</option>
            {agences.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={s.empty}>Chargement…</div>
      ) : visible.length === 0 ? (
        <div style={s.empty}>Aucun retour pour ces filtres</div>
      ) : (
        <div style={s.list}>
          {visible.map((f) => {
            const sc = STATUS[f.status] || STATUS.nouveau;
            const prestations = parsePrestations(f.prestations);
            const isOpen = expanded === f.id;
            const date = new Date(f.created_at).toLocaleDateString("fr-FR",
              { day: "numeric", month: "short", year: "numeric" });

            return (
              <div key={f.id} style={s.card}>
                {/* Ligne top */}
                <div style={s.cardTop}>
                  <div style={s.cardLeft}>
                    <span style={{ color: STAR_COLOR(f.rating), fontSize: 17, letterSpacing: 1 }}>
                      {STARS(f.rating)}
                    </span>
                    <span style={s.agence}>{f.location_name || "—"}</span>
                  </div>
                  <div style={s.cardRight}>
                    <span style={s.dateText}>{date}</span>
                    <span style={{ ...s.badge, background: sc.bg, color: sc.color, borderColor: sc.border }}>
                      {sc.label}
                    </span>
                  </div>
                </div>

                {/* Prestations */}
                {prestations.length > 0 && (
                  <div style={s.prestationRow}>
                    {prestations.map((p, i) => (
                      <span key={i} style={s.prestationTag}>{p}</span>
                    ))}
                    {f.ville && <span style={s.villeTag}>{f.ville}</span>}
                  </div>
                )}

                {/* Commentaire */}
                {f.commentaire && (
                  <p style={s.comment}
                    onClick={() => setExpanded(isOpen ? null : f.id)}>
                    {isOpen ? f.commentaire : f.commentaire.slice(0, 120) + (f.commentaire.length > 120 ? "…" : "")}
                    {f.commentaire.length > 120 && (
                      <span style={s.readMore}>{isOpen ? " Réduire" : " Lire plus"}</span>
                    )}
                  </p>
                )}

                {/* Action statut */}
                <div style={s.cardActions}>
                  <button style={{ ...s.nextBtn, borderColor: STATUS[NEXT[f.status]]?.border,
                    color: STATUS[NEXT[f.status]]?.color }}
                    onClick={() => bump(f.id, f.status)}>
                    Passer à : {STATUS[NEXT[f.status]]?.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#F8FAFC", padding: "0 16px 48px",
    fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 720, margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: 12, padding: "24px 0 20px",
    borderBottom: "1px solid #E2E8F0", marginBottom: 20 },
  logo: { height: 32, objectFit: "contain" },
  h1: { fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0, flex: 1 },
  total: { fontSize: 13, color: "#94A3B8", fontWeight: 500 },
  statsRow: { display: "flex", gap: 10, marginBottom: 16 },
  statBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
    gap: 2, padding: "12px 8px", borderRadius: 12, border: "2px solid",
    cursor: "pointer", transition: "background 0.12s", fontFamily: "inherit" },
  statCount: { fontSize: 22, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 11, fontWeight: 500, letterSpacing: 0.2 },
  filterRow: { marginBottom: 16 },
  select: { padding: "9px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0",
    fontSize: 13, color: "#475569", background: "white", fontFamily: "inherit", cursor: "pointer" },
  empty: { textAlign: "center", color: "#94A3B8", padding: "48px 0", fontSize: 15 },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: { background: "white", borderRadius: 16, padding: "16px 18px",
    border: "1px solid #E2E8F0" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 10 },
  cardLeft: { display: "flex", flexDirection: "column", gap: 3 },
  cardRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 },
  agence: { fontSize: 13, fontWeight: 600, color: "#334155" },
  dateText: { fontSize: 11, color: "#94A3B8" },
  badge: { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
    border: "1px solid", letterSpacing: 0.2 },
  prestationRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  prestationTag: { fontSize: 11, background: "#F1F5F9", color: "#475569",
    padding: "3px 10px", borderRadius: 20, fontWeight: 500 },
  villeTag: { fontSize: 11, background: "#E0F2FE", color: "#0369A1",
    padding: "3px 10px", borderRadius: 20, fontWeight: 500 },
  comment: { fontSize: 14, color: "#475569", lineHeight: 1.6, margin: "0 0 12px",
    cursor: "pointer" },
  readMore: { color: "#0284C7", fontWeight: 600, fontSize: 13 },
  cardActions: { borderTop: "1px solid #F1F5F9", paddingTop: 12, marginTop: 4 },
  nextBtn: { padding: "7px 14px", borderRadius: 10, border: "1.5px solid",
    background: "transparent", fontSize: 12, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit" },
};
