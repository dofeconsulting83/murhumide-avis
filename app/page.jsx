"use client";

import { useState, useCallback, useEffect } from "react";
import { LOCATIONS } from "@/lib/locations";

// Config chargée dynamiquement selon ?id=mh13 dans l'URL du QR code

const PRESTATIONS = [
  "Traitement remontées capillaires",
  "Traitement anti-salpêtre",
  "Traitement des moisissures",
  "Traitement d'infiltrations",
  "Cuvelage / Murs enterrés",
  "Étanchéité toiture ou terrasse",
  "Ventilation positive",
  "Déshumidification",
  "Diagnostic humidité",
];

const OPTIONS_BY_RATING = {
  positive: {
    label: "Qu'avez-vous le plus apprécié ?",
    hint: "Vous pouvez en sélectionner plusieurs",
    items: [
      "Diagnostic sérieux et précis", "Expertise technique",
      "Explication claire du problème", "Rapidité d'intervention",
      "Professionnalisme des techniciens", "Résultats visibles",
      "Propreté du chantier", "Rapport qualité/prix",
      "Conseils personnalisés", "Garantie rassurante",
    ],
  },
  neutral: {
    label: "Comment décririez-vous l'intervention ?",
    hint: "Choisissez ce qui correspond le mieux",
    items: [
      "Travail correct dans l'ensemble", "Résultats partiels pour l'instant",
      "Personnel sympathique", "Délais un peu longs",
      "Prix dans la moyenne", "Quelques ajustements à prévoir",
      "Bonne communication", "Résultats à confirmer dans le temps",
    ],
  },
};

const STAR_LABELS = ["", "Décevant", "Pas terrible", "Correct", "Très bien", "Excellent"];
const STAR_COLORS = { 1: "#EF4444", 2: "#F97316", 3: "#EAB308", 4: "#84CC16", 5: "#22C55E" };

const getOptions = (r) => r >= 4 ? OPTIONS_BY_RATING.positive : OPTIONS_BY_RATING.neutral;

/* ══════════════════════════════════════════════════════════
   COMPOSANT
   Steps: 0 accueil | 1 étoiles | 2 prestation | 3 options
          4 ville | 5 commentaire | 6 loading | 7 avis
          8 feedback négatif | 9 merci (négatif)
   ══════════════════════════════════════════════════════════ */
export default function ReviewApp() {
  const [location, setLocation] = useState(LOCATIONS["default"]);
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [prestations, setPrestations] = useState([]);
  const [pointsForts, setPointsForts] = useState([]);
  const [ville, setVille] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [review, setReview] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const togglePrestation = useCallback((p) =>
    setPrestations((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]), []);

  // Charge l'agence depuis ?id= au montage
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") || "default";
    setLocation(LOCATIONS[id] ?? LOCATIONS["default"]);
  }, []);

  const togglePoint = useCallback((p) =>
    setPointsForts((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]), []);

  /* ── Génération de l'avis (3-5 étoiles) ── */
  const generateReview = async () => {
    setStep(6);
    setError("");

    const nbPoints = pointsForts.length;
    const prompt = `Tu dois écrire un avis Google pour une entreprise de traitement de l'humidité (Mur Humide).

Voici exactement ce que le client a indiqué :
- Note : ${rating}/5 étoiles
- Traitement(s) réalisé(s) : ${prestations.join(", ")}
- Ce qu'il a sélectionné : ${pointsForts.join(", ")}
- Ville : ${ville}
${commentaire.trim() ? `- Détail ajouté : ${commentaire.trim()}` : ""}

Règles strictes :
- Rédige UNIQUEMENT à partir des éléments listés ci-dessus, rien d'autre
- Le ton doit être cohérent avec la note : ${rating >= 4 ? "positif et valorisant" : "nuancé, ni dithyrambique ni négatif"}
- Langage courant, comme un vrai client qui tape sur son téléphone
- ${nbPoints <= 1 ? "2 à 3 phrases maximum, reste concis" : "3 à 4 phrases, sans répéter"}
- Première personne
- Mentionner la ville et le(s) traitement(s) de façon fluide
- Orthographe et grammaire françaises irréprochables — aucune faute, aucune coquille
- Accents corrects sur tous les mots (é, è, ê, à, ù, ç…)
- Pas de guillemets, pas de titre, pas de mise en forme`;

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error || !data.text) throw new Error();
      setReview(data.text);
      setStep(7);
    } catch {
      setError("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
      setStep(5);
    }
  };

  /* ── Envoi du retour négatif par email ── */
  const submitFeedback = async () => {
    setSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          locationId: location.id,
          locationName: location.name,
          prestations,
          ville,
          commentaire,
        }),
      });
    } catch {}
    setSending(false);
    setStep(9);
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(review); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePublish = async () => {
    await handleCopy();
    setTimeout(() => window.open(location.googleReviewUrl, "_blank"), 500);
  };

  const reset = () => {
    setStep(0); setRating(0); setHoverRating(0);
    setPrestations([]); setPointsForts([]); setVille("");
    setCommentaire(""); setReview(""); setIsEditing(false); setError("");
  };

  const progress = step >= 1 && step <= 5 ? step / 5 : step >= 6 ? 1 : 0;
  const activeStar = hoverRating || rating;
  const starColor = STAR_COLORS[activeStar] || "#D1D5DB";
  const displayStars = (n) => [1,2,3,4,5].map((i) => i <= n ? "★" : "☆").join("");

  return (
    <div style={s.page}>
      {/* ── Progress bar ── */}
      {step >= 1 && step <= 5 && (
        <div style={s.progressWrap}>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: `${progress * 100}%` }} />
          </div>
          <div style={s.stepLabel}>Étape {step} sur 5</div>
        </div>
      )}

      {/* ── 0 : Accueil ── */}
      {step === 0 && (
        <div style={{ ...s.card, marginTop: 40, textAlign: "center" }}>
          <div style={s.logoWrap}>
            <img src="https://murhumide.fr/assets/img/logo-mur-humide.png"
              alt="Mur Humide" style={s.logoImg}
              onError={(e) => { e.target.style.display = "none"; }} />
          </div>
          <div style={s.welcomeStars}>★★★★★</div>
          <h1 style={s.h1}>Comment s'est passée votre intervention&nbsp;?</h1>
          <p style={s.body}>
            Partagez votre expérience avec <strong style={{ color: "#0F172A" }}>{location.shortName || location.name}</strong> pour aider les futurs clients.
          </p>
          <div style={s.pill}>⏱ 15 secondes</div>
          <button style={s.primaryBtn} onClick={() => setStep(1)}>Démarrer</button>
          <p style={s.disclaimer}>Votre avis nous aide à progresser et à être trouvés par ceux qui en ont besoin</p>
        </div>
      )}

      {/* ── 1 : Note étoiles ── */}
      {step === 1 && (
        <div style={s.card}>
          <p style={s.questionLabel}>Quelle note donneriez-vous&nbsp;?</p>
          <p style={s.hint}>Appuyez sur une étoile pour sélectionner</p>
          <div style={s.starPicker}>
            {[1,2,3,4,5].map((i) => (
              <button key={i}
                style={{ ...s.starBtn, color: i <= activeStar ? starColor : "#D1D5DB",
                  transform: i <= activeStar ? "scale(1.1)" : "scale(1)" }}
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(i)}
                aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
              >★</button>
            ))}
          </div>
          {activeStar > 0 && (
            <div style={{ ...s.starLabel, color: starColor }}>{STAR_LABELS[activeStar]}</div>
          )}
          <button
            style={{ ...s.primaryBtn, opacity: rating > 0 ? 1 : 0.4 }}
            disabled={rating === 0}
            onClick={() => { setPointsForts([]); setStep(rating <= 2 ? 8 : 2); }}
          >Continuer</button>
        </div>
      )}

      {/* ── 2 : Prestation(s) ── */}
      {step === 2 && (
        <div style={s.card}>
          <p style={s.questionLabel}>Quel(s) traitement(s) avons-nous réalisé&nbsp;?</p>
          <p style={s.hint}>Vous pouvez en sélectionner plusieurs</p>
          <div style={s.chipGrid}>
            {PRESTATIONS.map((opt) => {
              const sel = prestations.includes(opt);
              return (
                <button key={opt} style={chip(sel, rating)} onClick={() => togglePrestation(opt)}>
                  {sel ? "✓ " : ""}{opt}
                </button>
              );
            })}
          </div>
          <button
            style={{ ...s.primaryBtn, opacity: prestations.length > 0 ? 1 : 0.4 }}
            disabled={prestations.length === 0}
            onClick={() => setStep(3)}
          >Continuer</button>
        </div>
      )}

      {/* ── 3 : Options (positives ou nuancées) ── */}
      {step === 3 && (() => {
        const opts = getOptions(rating);
        return (
          <div style={s.card}>
            <p style={s.questionLabel}>{opts.label}</p>
            <p style={s.hint}>{opts.hint}</p>
            <div style={s.chipGrid}>
              {opts.items.map((opt) => {
                const sel = pointsForts.includes(opt);
                return (
                  <button key={opt} style={chip(sel, rating)} onClick={() => togglePoint(opt)}>
                    {sel ? "✓ " : ""}{opt}
                  </button>
                );
              })}
            </div>
            <button
              style={{ ...s.primaryBtn, opacity: pointsForts.length > 0 ? 1 : 0.4 }}
              disabled={pointsForts.length === 0}
              onClick={() => setStep(4)}
            >Continuer</button>
          </div>
        );
      })()}

      {/* ── 4 : Ville ── */}
      {step === 4 && (
        <div style={s.card}>
          <p style={s.questionLabel}>Dans quelle ville ou département&nbsp;?</p>
          <p style={s.hint}>Ville, code postal ou région</p>
          <input className="rv-input" style={s.input}
            value={ville} onChange={(e) => setVille(e.target.value)}
            placeholder="Ex : Marseille, Rouen, 44…" />
          <button
            style={{ ...s.primaryBtn, opacity: ville.trim() ? 1 : 0.4 }}
            disabled={!ville.trim()}
            onClick={() => setStep(5)}
          >Continuer</button>
        </div>
      )}

      {/* ── 5 : Commentaire ── */}
      {step === 5 && (
        <div style={s.card}>
          <p style={s.questionLabel}>Un détail à ajouter&nbsp;?</p>
          <p style={s.hint}>Optionnel — mais cela rend votre avis encore plus utile</p>
          {error && <div style={s.errorBox}>{error}</div>}
          <textarea className="rv-input" style={s.textarea}
            value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Ex : Intervention rapide après diagnostic gratuit, plus de moisissures depuis 6 mois…"
            rows={4} />
          <button style={s.primaryBtn} onClick={generateReview}>✨ Générer mon avis</button>
          <button style={s.ghostBtn} onClick={generateReview}>Passer cette étape</button>
        </div>
      )}

      {/* ── 6 : Chargement ── */}
      {step === 6 && (
        <div style={{ ...s.card, marginTop: 40 }}>
          <div style={s.loadingCenter}>
            <div className="rv-spinner" style={s.spinner} />
            <p style={{ ...s.h2, margin: "0 0 6px" }}>Rédaction en cours…</p>
            <p style={s.body}>Votre avis personnalisé est en préparation</p>
          </div>
        </div>
      )}

      {/* ── 7 : Avis généré ── */}
      {step === 7 && (
        <div style={s.card}>
          <div style={s.reviewHeader}>
            <span style={{ ...s.starsDisplay, color: STAR_COLORS[rating] }}>
              {displayStars(rating)}
            </span>
            <div>
              <p style={{ ...s.h2, margin: 0 }}>Voici votre avis</p>
              <p style={{ ...s.hint, marginBottom: 0 }}>Modifiez-le librement avant de publier</p>
            </div>
          </div>
          {isEditing ? (
            <textarea className="rv-input"
              style={{ ...s.textarea, minHeight: 150, marginTop: 12 }}
              value={review} onChange={(e) => setReview(e.target.value)}
              rows={6} autoFocus />
          ) : (
            <div style={s.reviewBox}><p style={s.reviewText}>{review}</p></div>
          )}
          <button style={{ ...s.ghostBtn, marginTop: 12 }}
            onClick={() => setIsEditing((v) => !v)}>
            {isEditing ? "✅ Valider les modifications" : "✏️ Modifier l'avis"}
          </button>
          <button style={{ ...s.primaryBtn, marginTop: 16 }} onClick={handlePublish}>
            {copied ? "✅ Copié ! Ouverture de Google…" : "Publier sur Google"}
          </button>
          <button style={s.copyBtn} onClick={handleCopy}>
            {copied ? "✅ Copié dans le presse-papiers" : "📋 Copier uniquement"}
          </button>
          <p style={s.disclaimer}>Collez l'avis dans la fenêtre Google qui s'ouvre, sélectionnez votre note et publiez.</p>
          <button style={s.resetBtn} onClick={reset}>Recommencer</button>
        </div>
      )}

      {/* ── 8 : Retour interne (1-2 étoiles) ── */}
      {step === 8 && (
        <div style={s.card}>
          <div style={{ ...s.reviewHeader, marginBottom: 16 }}>
            <span style={{ ...s.starsDisplay, color: STAR_COLORS[rating] }}>
              {displayStars(rating)}
            </span>
            <div>
              <p style={{ ...s.h2, margin: 0 }}>Nous sommes désolés</p>
              <p style={{ ...s.hint, marginBottom: 0 }}>Aidez-nous à comprendre ce qui s'est passé</p>
            </div>
          </div>
          <p style={s.questionLabel}>Quel(s) traitement(s) concernait l'intervention&nbsp;?</p>
          <div style={{ ...s.chipGrid, marginBottom: 20 }}>
            {PRESTATIONS.map((opt) => {
              const sel = prestations.includes(opt);
              return (
                <button key={opt} style={chip(sel, rating)} onClick={() => togglePrestation(opt)}>
                  {sel ? "✓ " : ""}{opt}
                </button>
              );
            })}
          </div>
          <p style={s.questionLabel}>Qu'est-ce qui ne s'est pas passé comme prévu&nbsp;?</p>
          <p style={s.hint}>Votre retour nous aide à nous améliorer — il ne sera pas publié</p>
          <textarea className="rv-input" style={s.textarea}
            value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Décrivez ce qui n'a pas fonctionné…" rows={5} />
          <button
            style={{ ...s.primaryBtn, background: "#64748B", marginTop: 20, opacity: sending ? 0.6 : 1 }}
            onClick={submitFeedback}
            disabled={sending}
          >
            {sending ? "Envoi en cours…" : "Envoyer mon retour"}
          </button>
          <p style={s.disclaimer}>Ce retour est transmis directement à notre équipe, il ne sera pas publié sur Google.</p>
        </div>
      )}

      {/* ── 9 : Merci (retour interne) ── */}
      {step === 9 && (
        <div style={{ ...s.card, marginTop: 40, textAlign: "center" }}>
          <div style={s.thankYouIcon}>🙏</div>
          <h1 style={s.h1}>Merci pour votre retour</h1>
          <p style={s.body}>
            Nous avons bien reçu votre message. Notre équipe va l'examiner et prendra contact avec vous si nécessaire.
          </p>
          <div style={s.separator} />
          <p style={{ ...s.hint, marginBottom: 16 }}>
            Si entre-temps votre situation s'est améliorée, nous serions heureux de le savoir.
          </p>
          <button style={s.resetBtn} onClick={reset}>Recommencer</button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════ */
const chip = (selected, rating = 5) => {
  const isNegative = rating <= 2;
  return {
    padding: "10px 14px", borderRadius: 10,
    border: selected ? `2px solid ${isNegative ? "#DC2626" : "#0369A1"}` : "2px solid #E2E8F0",
    background: selected ? (isNegative ? "#FEF2F2" : "#E0F2FE") : "#FFFFFF",
    fontSize: 13, fontWeight: selected ? 600 : 400,
    color: selected ? (isNegative ? "#991B1B" : "#0369A1") : "#475569",
    cursor: "pointer", transition: "all 0.12s",
    userSelect: "none", lineHeight: 1.3, textAlign: "left",
  };
};

const s = {
  page: { minHeight: "100vh", background: "#F0F9FF", display: "flex", flexDirection: "column",
    alignItems: "center", padding: "0 16px 56px" },
  progressWrap: { width: "100%", maxWidth: 460, padding: "20px 0 0" },
  progressTrack: { height: 3, background: "#BAE6FD", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", background: "#0284C7", borderRadius: 2,
    transition: "width 0.35s cubic-bezier(.4,0,.2,1)" },
  stepLabel: { fontSize: 11, color: "#7DD3FC", fontWeight: 500, textAlign: "right",
    marginTop: 6, letterSpacing: 0.3, textTransform: "uppercase" },
  card: { width: "100%", maxWidth: 460, background: "#FFFFFF", borderRadius: 20,
    padding: "28px 24px 24px", boxSizing: "border-box", marginTop: 16, border: "1px solid #E0F2FE" },
  logoWrap: { display: "flex", justifyContent: "center", marginBottom: 20 },
  logoImg: { height: 44, objectFit: "contain" },
  welcomeStars: { fontSize: 30, letterSpacing: 4, color: "#FBBF24", display: "block", marginBottom: 14 },
  h1: { fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 12px", lineHeight: 1.25 },
  h2: { fontSize: 18, fontWeight: 700, color: "#0F172A", margin: "0 0 8px", lineHeight: 1.3 },
  body: { fontSize: 15, color: "#64748B", margin: "0 0 24px", lineHeight: 1.55 },
  hint: { fontSize: 12, color: "#94A3B8", margin: "0 0 14px", letterSpacing: 0.1 },
  pill: { display: "inline-block", background: "#E0F2FE", color: "#0369A1", fontSize: 13,
    fontWeight: 600, padding: "6px 16px", borderRadius: 20, marginBottom: 28 },
  starPicker: { display: "flex", gap: 6, justifyContent: "center", margin: "24px 0 8px" },
  starBtn: { background: "none", border: "none", fontSize: 52, cursor: "pointer",
    padding: "0 2px", lineHeight: 1, transition: "color 0.1s, transform 0.1s" },
  starLabel: { textAlign: "center", fontSize: 15, fontWeight: 600, marginBottom: 4, minHeight: 22 },
  primaryBtn: { display: "block", width: "100%", padding: "15px", marginTop: 22,
    borderRadius: 14, background: "#0284C7", color: "#FFFFFF", fontSize: 15,
    fontWeight: 700, border: "none", cursor: "pointer", transition: "opacity 0.15s" },
  ghostBtn: { display: "block", width: "100%", padding: "13px", marginTop: 10,
    borderRadius: 14, background: "transparent", color: "#64748B", fontSize: 14,
    fontWeight: 500, border: "2px solid #E2E8F0", cursor: "pointer" },
  copyBtn: { display: "block", width: "100%", padding: "13px", marginTop: 10,
    borderRadius: 14, background: "#F0FDF4", color: "#15803D", fontSize: 14,
    fontWeight: 600, border: "2px solid #BBF7D0", cursor: "pointer" },
  resetBtn: { display: "block", width: "100%", padding: "10px", marginTop: 14,
    borderRadius: 14, background: "transparent", color: "#CBD5E1", fontSize: 12,
    fontWeight: 400, border: "none", cursor: "pointer" },
  questionLabel: { fontSize: 18, fontWeight: 700, color: "#0F172A", margin: "0 0 6px", lineHeight: 1.3 },
  chipGrid: { display: "flex", flexWrap: "wrap", gap: 9, marginTop: 4 },
  input: { display: "block", width: "100%", padding: "14px 16px", borderRadius: 12,
    border: "2px solid #E2E8F0", fontSize: 15, color: "#0F172A", background: "#FFFFFF",
    boxSizing: "border-box", fontFamily: "inherit" },
  textarea: { display: "block", width: "100%", padding: "14px 16px", borderRadius: 12,
    border: "2px solid #E2E8F0", fontSize: 14, color: "#0F172A", background: "#FFFFFF",
    resize: "none", lineHeight: 1.6, boxSizing: "border-box", fontFamily: "inherit" },
  errorBox: { background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10,
    padding: "12px 16px", fontSize: 13, color: "#991B1B", marginBottom: 16, lineHeight: 1.5 },
  loadingCenter: { textAlign: "center", padding: "32px 0" },
  spinner: { width: 44, height: 44, border: "3px solid #BAE6FD", borderTop: "3px solid #0284C7",
    borderRadius: "50%", margin: "0 auto 20px" },
  reviewHeader: { display: "flex", alignItems: "center", gap: 14, marginBottom: 4 },
  starsDisplay: { fontSize: 24, letterSpacing: 2, flexShrink: 0 },
  reviewBox: { background: "#F8FAFC", borderRadius: 14, padding: "18px",
    border: "1px solid #E2E8F0", marginTop: 14 },
  reviewText: { fontSize: 14, color: "#334155", lineHeight: 1.8, margin: 0 },
  disclaimer: { fontSize: 11, color: "#94A3B8", textAlign: "center",
    marginTop: 14, lineHeight: 1.6, padding: "0 4px" },
  thankYouIcon: { fontSize: 52, marginBottom: 20 },
  separator: { height: 1, background: "#E2E8F0", margin: "20px 0" },
};
