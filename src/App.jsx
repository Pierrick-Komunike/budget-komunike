import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "./supabase";

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const SHORT_MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const DEFAULT_COMPTES = ["Revo Joint", "LCL 16W", "LCL 44B"];

const DEFAULT_MENSUALITES = [
  { id: 1, label: "Loyer", montant: 75, compte: "Revo Joint", jour: 5 },
  { id: 2, label: "EuroAssurance moto", montant: 66, compte: "Revo Joint", jour: 5 },
  { id: 3, label: "Mobil Home", montant: 357, compte: "Revo Joint", jour: 5 },
  { id: 4, label: "Free Estelle", montant: 20, compte: "Revo Joint", jour: 7 },
  { id: 5, label: "Macif Pierrick", montant: 41.20, compte: "Revo Joint", jour: 10 },
  { id: 6, label: "Apple", montant: 9, compte: "Revo Joint", jour: 11 },
  { id: 7, label: "Plv à la source", montant: 192, compte: "Revo Joint", jour: 15 },
  { id: 8, label: "Course", montant: 450, compte: "Revo Joint", jour: null },
  { id: 9, label: "Essence", montant: 160, compte: "Revo Joint", jour: null },
  { id: 10, label: "Assurance Moyen paiement", montant: 3, compte: "LCL 16W", jour: 19 },
  { id: 11, label: "CB 1554", montant: 4.20, compte: "LCL 16W", jour: 26 },
  { id: 12, label: "Assurance Immo 1", montant: 10, compte: "LCL 44B", jour: 10 },
  { id: 13, label: "Assurance Immo 2", montant: 10, compte: "LCL 44B", jour: 10 },
  { id: 14, label: "Charge Copro", montant: 70, compte: "LCL 44B", jour: 14 },
  { id: 15, label: "Prêt Immo", montant: 501.77, compte: "LCL 44B", jour: 15 },
  { id: 16, label: "Taxe foncière", montant: 67, compte: "LCL 44B", jour: 15 },
];
const DEFAULT_REVENUS = [
  { id: 1, label: "Pierrick", montant: 0, compte: "Revo Joint", jour: null },
  { id: 2, label: "Estelle", montant: 0, compte: "Revo Joint", jour: null },
  { id: 3, label: "Loyer", montant: 730, compte: "LCL 44B", jour: 5 },
];

function gid() { return Date.now() + Math.random(); }
function fmt(n) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n); }
function mk(m, y) { return `${y}-${String(m).padStart(2, "0")}`; }
function cl(d) { return JSON.parse(JSON.stringify(d)); }
function defMonth() { return { revenus: cl(DEFAULT_REVENUS), mensualites: cl(DEFAULT_MENSUALITES), extras: [], comptes: [...DEFAULT_COMPTES] }; }

// ── Themes ──
const themes = {
  dark: {
    bg: "linear-gradient(145deg, #0c1220 0%, #111827 40%, #0f172a 100%)",
    headerBg: "rgba(15,23,42,0.95)", card: "rgba(15,23,42,0.6)",
    cardBorder: "rgba(255,255,255,0.06)", inputBg: "rgba(255,255,255,0.06)",
    inputBorder: "rgba(255,255,255,0.1)", text: "#e2e8f0", textSoft: "#94a3b8",
    textMuted: "#64748b", textDim: "#475569", textFaint: "#334155",
    hoverBg: "rgba(255,255,255,0.035)", subgroupBg: "rgba(255,255,255,0.02)",
    subgroupBorder: "rgba(255,255,255,0.04)", divider: "rgba(255,255,255,0.08)",
    summaryCardBg: "rgba(255,255,255,0.04)",
    recapBg: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))",
    recapBorder: "rgba(99,102,241,0.2)", recapTitle: "#c7d2fe",
    modalBg: "linear-gradient(135deg, #1e293b, #0f172a)", modalOverlay: "rgba(0,0,0,0.6)",
    selectBg: "#1e293b", chipBg: "rgba(255,255,255,0.05)", gaugeBg: "rgba(255,255,255,0.06)",
    focusColor: "rgba(99,102,241,0.5)", badgePill: "rgba(255,255,255,0.05)", isDark: true,
  },
  light: {
    bg: "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 40%, #e2e8f0 100%)",
    headerBg: "rgba(248,250,252,0.95)", card: "rgba(255,255,255,0.85)",
    cardBorder: "rgba(0,0,0,0.08)", inputBg: "rgba(0,0,0,0.04)",
    inputBorder: "rgba(0,0,0,0.12)", text: "#1e293b", textSoft: "#475569",
    textMuted: "#64748b", textDim: "#94a3b8", textFaint: "#cbd5e1",
    hoverBg: "rgba(0,0,0,0.03)", subgroupBg: "rgba(0,0,0,0.02)",
    subgroupBorder: "rgba(0,0,0,0.06)", divider: "rgba(0,0,0,0.08)",
    summaryCardBg: "rgba(0,0,0,0.03)",
    recapBg: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
    recapBorder: "rgba(99,102,241,0.2)", recapTitle: "#4338ca",
    modalBg: "linear-gradient(135deg, #ffffff, #f8fafc)", modalOverlay: "rgba(0,0,0,0.3)",
    selectBg: "#ffffff", chipBg: "rgba(0,0,0,0.04)", gaugeBg: "rgba(0,0,0,0.06)",
    focusColor: "rgba(99,102,241,0.4)", badgePill: "rgba(0,0,0,0.06)", isDark: false,
  }
};

// ═══════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect" : error.message);
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères"); return; }
    setLoading(true); setError(""); setSuccess("");
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } }
    });
    if (error) { setError(error.message); }
    else { setSuccess("Compte créé ! Vérifie tes emails pour confirmer ton compte."); setMode("login"); }
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) setError(error.message);
    else setSuccess("Email de réinitialisation envoyé ! Vérifie ta boîte mail.");
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)", color: "#e2e8f0", fontSize: 15, outline: "none",
    transition: "border 0.2s",
  };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #0c1220 0%, #111827 40%, #0f172a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      fontFamily: "'DM Sans', 'Outfit', -apple-system, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, animation: "fadeIn 0.4s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💰</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "Outfit", color: "#e2e8f0", letterSpacing: "-0.03em", margin: 0 }}>Mon Budget</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>par Komunike</p>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(15,23,42,0.8)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }}>

          {/* Tabs */}
          {mode !== "forgot" && (
            <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4 }}>
              {[["login", "Connexion"], ["signup", "Inscription"]].map(([m, label]) => (
                <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                    background: mode === m ? "rgba(99,102,241,0.2)" : "transparent",
                    color: mode === m ? "#818cf8" : "#64748b",
                    fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {mode === "forgot" && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0 }}>
                ← Retour à la connexion
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0", marginTop: 12, fontFamily: "Outfit" }}>Mot de passe oublié</h2>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Entre ton email, on t'envoie un lien de réinitialisation.</p>
            </div>
          )}

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
              {success}
            </div>
          )}

          <form onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {mode === "signup" && (
              <div>
                <label style={labelStyle}>Prénom</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ton prénom"
                  style={inputStyle} onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
            )}

            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.com" required
                style={inputStyle} onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>

            {mode !== "forgot" && (
              <div>
                <label style={labelStyle}>Mot de passe</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Minimum 6 caractères" : "Ton mot de passe"} required
                  style={inputStyle} onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ padding: "14px 0", borderRadius: 12, border: "none",
                background: loading ? "#334155" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer",
                transition: "all 0.2s", marginTop: 4 }}>
              {loading ? <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                : mode === "login" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer le lien"}
            </button>
          </form>

          {mode === "login" && (
            <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer",
                fontSize: 13, marginTop: 16, width: "100%", textAlign: "center" }}>
              Mot de passe oublié ?
            </button>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <div style={{ fontSize: 12, color: "#475569" }}>Créée avec ❤️ par <span style={{ fontWeight: 700, color: "#64748b" }}>Komunike</span></div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// REUSABLE UI COMPONENTS
// ═══════════════════════════════════════════
function AnimNum({ value }) {
  const [d, setD] = useState(value);
  const ref = useRef(null);
  useEffect(() => {
    let s = d, e = value;
    if (Math.abs(s - e) < 0.01) return;
    let dur = 300, st = null;
    function tick(ts) { if (!st) st = ts; let p = Math.min((ts - st) / dur, 1); p = 1 - Math.pow(1 - p, 3); setD(s + (e - s) * p); if (p < 1) ref.current = requestAnimationFrame(tick); }
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);
  return <span>{fmt(d)}</span>;
}

function EditableRow({ children, onDelete, t }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 10,
        background: h ? t.hoverBg : "transparent", transition: "background 0.15s" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>{children}</div>
      {onDelete && <button onClick={onDelete} style={{ opacity: h ? 0.8 : 0, transition: "opacity 0.15s",
        background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 15, padding: "2px 6px", borderRadius: 6 }}>✕</button>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", t, style = {} }) {
  return <input type={type} value={value ?? ""} onChange={e => onChange(type === "number" ? (e.target.value === "" ? "" : parseFloat(e.target.value)) : e.target.value)}
    placeholder={placeholder} style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`,
      borderRadius: 8, padding: "7px 10px", color: t.text, fontSize: 13, outline: "none", transition: "border 0.2s", ...style }}
    onFocus={e => e.target.style.borderColor = t.focusColor}
    onBlur={e => e.target.style.borderColor = t.inputBorder} />;
}

function Select({ value, onChange, options, t, style = {} }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={{ background: t.inputBg,
    border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: "7px 10px", color: t.text, fontSize: 13, outline: "none", cursor: "pointer", ...style }}>
    {options.map(o => <option key={o} value={o} style={{ background: t.selectBg }}>{o}</option>)}
  </select>;
}

function AddBtn({ onClick, label, t }) {
  return <button onClick={onClick} style={{ background: "none", border: `1px dashed ${t.inputBorder}`,
    borderRadius: 10, padding: "8px 16px", color: t.textMuted, fontSize: 13, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", width: "100%", justifyContent: "center" }}
    onMouseEnter={e => { e.target.style.borderColor = t.focusColor; e.target.style.color = "#818cf8"; }}
    onMouseLeave={e => { e.target.style.borderColor = t.inputBorder; e.target.style.color = t.textMuted; }}>
    + {label}
  </button>;
}

function AlertBadge({ ratio }) {
  if (ratio < 0.8) return null;
  const over = ratio >= 1;
  return (
    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10, marginLeft: 6,
      background: over ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
      color: over ? "#ef4444" : "#f59e0b", animation: over ? "pulse 1.5s infinite" : "none" }}>
      {over ? "⚠ DÉPASSÉ" : "⚡ ATTENTION"}
    </span>
  );
}

function Section({ title, icon, color, total, children, defaultOpen = true, t, alertRatio }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: t.card, backdropFilter: "blur(20px)", border: `1px solid ${t.cardBorder}`, borderRadius: 16, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", cursor: "pointer", borderBottom: open ? `1px solid ${t.cardBorder}` : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 10, background: `linear-gradient(135deg, ${color}22, ${color}11)` }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: t.text, letterSpacing: "-0.02em" }}>{title}</span>
          {alertRatio !== undefined && <AlertBadge ratio={alertRatio} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {total !== undefined && <span style={{ fontWeight: 800, fontSize: 15, color, fontFeatureSettings: '"tnum"' }}><AnimNum value={total} /></span>}
          <span style={{ color: t.textDim, fontSize: 18, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s", display: "inline-block" }}>▾</span>
        </div>
      </div>
      {open && <div style={{ padding: "8px 8px 12px" }}>{children}</div>}
    </div>
  );
}

function BankGroup({ compte, items, total, onUpdateItem, onDeleteItem, t }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ margin: "4px 4px 8px", background: t.subgroupBg, borderRadius: 12, border: `1px solid ${t.subgroupBorder}`, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", cursor: "pointer", transition: "background 0.15s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ transform: open ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.25s", display: "inline-block", fontSize: 10, color: t.textDim }}>▶</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.textSoft }}>🏦 {compte}</span>
          <span style={{ fontSize: 11, color: t.textDim, fontWeight: 600, background: t.badgePill, padding: "2px 8px", borderRadius: 10 }}>{items.length}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b" }}>{fmt(total)}</span>
      </div>
      {open && <div style={{ padding: "2px 4px 6px" }}>
        {items.map(m => (
          <EditableRow key={m.id} onDelete={() => onDeleteItem(m.id)} t={t}>
            <Input value={m.label} onChange={v => onUpdateItem(m.id, "label", v)} placeholder="Libellé" t={t} style={{ flex: 1, minWidth: 100 }} />
            <Input value={m.montant} onChange={v => onUpdateItem(m.id, "montant", v)} placeholder="0" type="number" t={t} style={{ width: 80, textAlign: "right", fontWeight: 700 }} />
            <Input value={m.jour || ""} onChange={v => onUpdateItem(m.id, "jour", v)} placeholder="Jour" type="number" t={t} style={{ width: 50, textAlign: "center" }} />
          </EditableRow>
        ))}
      </div>}
    </div>
  );
}

function GaugeBar({ spent, budget, label, t }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over = spent > budget;
  const c = over ? "#ef4444" : pct > 80 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: t.textSoft, marginBottom: 4 }}>
        <span>{label}</span><span style={{ color: c, fontWeight: 700 }}>{fmt(spent)} / {fmt(budget)}</span>
      </div>
      <div style={{ height: 6, background: t.gaugeBg, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${c}, ${c}cc)`, borderRadius: 10, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
    </div>
  );
}

function AddMensualiteModal({ comptes, onAdd, onAddCompte, onClose, t }) {
  const [label, setLabel] = useState("");
  const [montant, setMontant] = useState("");
  const [jour, setJour] = useState("");
  const [compte, setCompte] = useState(comptes[0] || "");
  const [showNew, setShowNew] = useState(false);
  const [newCompte, setNewCompte] = useState("");
  const submit = () => { if (!label) return; onAdd({ id: gid(), label, montant: parseFloat(montant) || 0, jour: jour ? parseInt(jour) : null, compte }); onClose(); };
  const addC = () => { if (!newCompte.trim()) return; onAddCompte(newCompte.trim()); setCompte(newCompte.trim()); setNewCompte(""); setShowNew(false); };
  const lbl = { fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };
  return (
    <div style={{ position: "fixed", inset: 0, background: t.modalOverlay, backdropFilter: "blur(8px)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.2s ease" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.modalBg, border: `1px solid ${t.cardBorder}`,
        borderRadius: 20, padding: 24, width: "100%", maxWidth: 400, animation: "slideUp 0.25s ease" }}>
        <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 800, fontFamily: "Outfit", color: t.text }}>📅 Nouvelle mensualité</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label style={lbl}>Libellé</label><Input value={label} onChange={setLabel} placeholder="Ex: Netflix" t={t} style={{ width: "100%" }} /></div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><label style={lbl}>Montant</label><Input value={montant} onChange={setMontant} placeholder="0" type="number" t={t} style={{ width: "100%" }} /></div>
            <div style={{ width: 80 }}><label style={lbl}>Jour</label><Input value={jour} onChange={setJour} placeholder="—" type="number" t={t} style={{ width: "100%" }} /></div>
          </div>
          <div>
            <label style={lbl}>Compte bancaire</label>
            <div style={{ display: "flex", gap: 8 }}>
              <Select value={compte} onChange={setCompte} options={comptes} t={t} style={{ flex: 1 }} />
              <button onClick={() => setShowNew(!showNew)} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 8, padding: "0 12px", color: "#818cf8", cursor: "pointer", fontSize: 18, fontWeight: 600 }}>+</button>
            </div>
          </div>
          {showNew && <div style={{ background: "rgba(99,102,241,0.08)", borderRadius: 10, padding: 12, display: "flex", gap: 8, border: "1px solid rgba(99,102,241,0.15)" }}>
            <Input value={newCompte} onChange={setNewCompte} placeholder="Nom du nouveau compte" t={t} style={{ flex: 1 }} />
            <button onClick={addC} style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "0 14px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>OK</button>
          </div>}
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: t.inputBg,
              border: `1px solid ${t.inputBorder}`, color: t.textSoft, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Annuler</button>
            <button onClick={submit} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "linear-gradient(135deg, #f59e0b, #d97706)",
              border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>Ajouter</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvolutionChart({ allData, currentMonth, currentYear, t }) {
  const [open, setOpen] = useState(true);
  const chartData = [];
  for (let i = 11; i >= 0; i--) {
    let m = currentMonth - i, y = currentYear;
    if (m < 0) { m += 12; y -= 1; }
    const k = mk(m, y);
    const d = allData[k];
    if (d) {
      const rev = d.revenus.reduce((s, r) => s + (parseFloat(r.montant) || 0), 0);
      const mens = d.mensualites.reduce((s, x) => s + (parseFloat(x.montant) || 0), 0);
      const ext = (d.extras || []).reduce((s, x) => s + (parseFloat(x.montant) || 0), 0);
      chartData.push({ name: SHORT_MONTHS[m], revenus: rev, depenses: mens + ext });
    }
  }
  if (chartData.length < 2) return null;
  return (
    <div style={{ background: t.card, backdropFilter: "blur(20px)", border: `1px solid ${t.cardBorder}`, borderRadius: 16, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", cursor: "pointer", borderBottom: open ? `1px solid ${t.cardBorder}` : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 10, background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.1))" }}>📈</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: t.text }}>Évolution</span>
        </div>
        <span style={{ color: t.textDim, fontSize: 18, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s", display: "inline-block" }}>▾</span>
      </div>
      {open && (
        <div style={{ padding: "12px 8px 8px" }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} />
              <XAxis dataKey="name" tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: t.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: t.isDark ? "#1e293b" : "#fff", border: `1px solid ${t.cardBorder}`, borderRadius: 10, fontSize: 12, color: t.text }} formatter={(v) => fmt(v)} />
              <Area type="monotone" dataKey="revenus" stroke="#22c55e" strokeWidth={2} fill="url(#gRev)" name="Revenus" />
              <Area type="monotone" dataKey="depenses" stroke="#f43f5e" strokeWidth={2} fill="url(#gDep)" name="Dépenses" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "8px 0 4px" }}>
            <span style={{ fontSize: 11, color: t.textSoft, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "#22c55e", display: "inline-block" }} /> Revenus
            </span>
            <span style={{ fontSize: 11, color: t.textSoft, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "#f43f5e", display: "inline-block" }} /> Dépenses
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// BUDGET DASHBOARD (logged in)
// ═══════════════════════════════════════════
function BudgetDashboard({ user }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [allData, setAllData] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("budget-theme") || "dark");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  const t = themes[theme];
  const key = mk(month, year);
  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "";

  // Load all months from Supabase on mount
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("budget_months")
        .select("month_key, data")
        .eq("user_id", user.id);
      if (!error && data) {
        const loaded = {};
        data.forEach(row => { loaded[row.month_key] = row.data; });
        setAllData(loaded);
      }
      setLoaded(true);
    })();
  }, [user.id]);

  // Autosave to Supabase with debounce
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      // Upsert all changed months
      const rows = Object.entries(allData).map(([month_key, data]) => ({
        user_id: user.id, month_key, data, updated_at: new Date().toISOString(),
      }));
      if (rows.length > 0) {
        await supabase.from("budget_months").upsert(rows, { onConflict: "user_id,month_key" });
      }
      setTimeout(() => setSaving(false), 600);
    }, 1200);
  }, [allData, loaded, user.id]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("budget-theme", next);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getData = useCallback(() => allData[key] || defMonth(), [allData, key]);
  const data = getData();

  const update = (field, fn) => {
    setAllData(prev => {
      const current = prev[key] || defMonth();
      return { ...prev, [key]: { ...current, [field]: typeof fn === "function" ? fn(current[field]) : fn } };
    });
  };

  const { revenus, mensualites, extras, comptes } = data;
  const totalRevenus = revenus.reduce((s, r) => s + (parseFloat(r.montant) || 0), 0);
  const totalMensualites = mensualites.reduce((s, m) => s + (parseFloat(m.montant) || 0), 0);
  const totalExtras = extras.reduce((s, d) => s + (parseFloat(d.montant) || 0), 0);
  const totalDepenses = totalMensualites + totalExtras;
  const solde = totalRevenus - totalDepenses;
  const totalRatio = totalRevenus > 0 ? totalDepenses / totalRevenus : 0;

  const grouped = {};
  comptes.forEach(c => { grouped[c] = []; });
  mensualites.forEach(m => { if (!grouped[m.compte]) grouped[m.compte] = []; grouped[m.compte].push(m); });
  const totalByCompte = {};
  Object.keys(grouped).forEach(c => { totalByCompte[c] = grouped[c].reduce((s, m) => s + (parseFloat(m.montant) || 0), 0); });

  const nav = (dir) => {
    if (dir > 0) { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }
    else { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  };

  const duplicateToNext = () => {
    let nm = month + 1, ny = year;
    if (nm > 11) { nm = 0; ny += 1; }
    setAllData(prev => ({ ...prev, [mk(nm, ny)]: cl(data) }));
    setMonth(nm); setYear(ny);
  };

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 30, height: 30, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1",
          borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ color: "#94a3b8", fontSize: 14 }}>Chargement...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: "'DM Sans', 'Outfit', -apple-system, sans-serif", color: t.text, transition: "background 0.4s, color 0.3s" }}>

      {/* Header */}
      <div style={{ padding: "20px 24px 20px", background: t.headerBg, position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px)", transition: "background 0.4s" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, fontFamily: "Outfit", letterSpacing: "-0.03em", color: t.text }}>
                💰 {userName ? `Salut ${userName}` : "Mon Budget"}
              </h1>
              {saving && <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600, animation: "saveDot 1s ease", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} /> Sauvé
              </span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={toggleTheme} style={{ background: t.chipBg, border: `1px solid ${t.cardBorder}`,
                borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", transition: "all 0.3s" }}>
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button onClick={duplicateToNext} style={{ background: t.chipBg, border: `1px solid ${t.cardBorder}`,
                borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 13, color: t.textSoft, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 4, transition: "all 0.3s" }} title="Dupliquer vers le mois suivant">
                📋→
              </button>
              <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 12, color: "#f87171", fontWeight: 700,
                display: "flex", alignItems: "center", gap: 4, transition: "all 0.3s" }} title="Déconnexion">
                ↪
              </button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            background: t.chipBg, borderRadius: 12, padding: "4px 6px", marginBottom: 14 }}>
            <button onClick={() => nav(-1)} style={{ background: "none", border: "none", color: t.textSoft, cursor: "pointer", fontSize: 20, padding: "4px 12px", borderRadius: 8 }}>‹</button>
            <span style={{ fontWeight: 700, fontSize: 15, minWidth: 140, textAlign: "center", color: t.text, fontFamily: "Outfit" }}>{MONTHS[month]} {year}</span>
            <button onClick={() => nav(1)} style={{ background: "none", border: "none", color: t.textSoft, cursor: "pointer", fontSize: 20, padding: "4px 12px", borderRadius: 8 }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Revenus", value: totalRevenus, color: "#22c55e", icon: "↗" },
              { label: "Dépenses", value: totalDepenses, color: "#f43f5e", icon: "↘" },
              { label: "Solde", value: solde, color: solde >= 0 ? "#22c55e" : "#ef4444", icon: solde >= 0 ? "✓" : "!" },
            ].map((c, i) => (
              <div key={i} style={{ background: t.summaryCardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14, padding: "14px 12px", textAlign: "center", transition: "background 0.3s" }}>
                <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.icon} {c.label}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: c.color, fontFeatureSettings: '"tnum"', fontFamily: "Outfit" }}><AnimNum value={c.value} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div key={key} style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: 14, animation: "fadeIn 0.3s ease" }}>

        <div style={{ background: t.card, backdropFilter: "blur(20px)", border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: "16px 20px" }}>
          <GaugeBar spent={totalMensualites} budget={totalRevenus} label="Mensualités vs Revenus" t={t} />
          <div style={{ height: 8 }} />
          <GaugeBar spent={totalDepenses} budget={totalRevenus} label="Total Dépenses vs Revenus" t={t} />
        </div>

        <EvolutionChart allData={allData} currentMonth={month} currentYear={year} t={t} />

        <Section title="Revenus" icon="💶" color="#22c55e" total={totalRevenus} t={t}>
          {revenus.map(r => (
            <EditableRow key={r.id} onDelete={revenus.length > 1 ? () => update("revenus", p => p.filter(x => x.id !== r.id)) : null} t={t}>
              <Input value={r.label} onChange={v => update("revenus", p => p.map(x => x.id === r.id ? { ...x, label: v } : x))} placeholder="Libellé" t={t} style={{ flex: 1, minWidth: 100 }} />
              <Input value={r.montant} onChange={v => update("revenus", p => p.map(x => x.id === r.id ? { ...x, montant: v } : x))} placeholder="0" type="number" t={t} style={{ width: 90, textAlign: "right", fontWeight: 700 }} />
              <Select value={r.compte} onChange={v => update("revenus", p => p.map(x => x.id === r.id ? { ...x, compte: v } : x))} options={comptes} t={t} style={{ width: 110 }} />
            </EditableRow>
          ))}
          <div style={{ padding: "4px 12px" }}>
            <AddBtn onClick={() => update("revenus", p => [...p, { id: gid(), label: "", montant: 0, compte: comptes[0], jour: null }])} label="Ajouter un revenu" t={t} />
          </div>
        </Section>

        <Section title="Mensualités" icon="📅" color="#f59e0b" total={totalMensualites} t={t} alertRatio={totalRatio}>
          {comptes.map(compte => {
            const items = grouped[compte] || [];
            if (items.length === 0) return (
              <div key={compte} style={{ margin: "4px 4px", padding: "10px 14px", borderRadius: 12,
                background: t.subgroupBg, border: `1px solid ${t.subgroupBorder}`,
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: t.textDim }}>🏦 {compte}</span>
                <span style={{ fontSize: 12, color: t.textFaint }}>Aucune</span>
              </div>
            );
            return <BankGroup key={compte} compte={compte} items={items} total={totalByCompte[compte] || 0}
              onUpdateItem={(id, f, v) => update("mensualites", p => p.map(x => x.id === id ? { ...x, [f]: v } : x))}
              onDeleteItem={(id) => update("mensualites", p => p.filter(x => x.id !== id))} t={t} />;
          })}
          <div style={{ padding: "6px 12px" }}>
            <AddBtn onClick={() => setShowAddModal(true)} label="Ajouter une mensualité" t={t} />
          </div>
        </Section>

        <Section title="Dépenses Extra" icon="🛍️" color="#ec4899" total={totalExtras} t={t} alertRatio={totalRatio}>
          {extras.map(d => (
            <EditableRow key={d.id} onDelete={() => update("extras", p => p.filter(x => x.id !== d.id))} t={t}>
              <Input value={d.label} onChange={v => update("extras", p => p.map(x => x.id === d.id ? { ...x, label: v } : x))} placeholder="Libellé" t={t} style={{ flex: 1, minWidth: 100 }} />
              <Input value={d.montant} onChange={v => update("extras", p => p.map(x => x.id === d.id ? { ...x, montant: v } : x))} placeholder="0" type="number" t={t} style={{ width: 90, textAlign: "right", fontWeight: 700 }} />
              <Select value={d.compte || comptes[0]} onChange={v => update("extras", p => p.map(x => x.id === d.id ? { ...x, compte: v } : x))} options={comptes} t={t} style={{ width: 110 }} />
            </EditableRow>
          ))}
          {extras.length === 0 && <div style={{ padding: "12px 16px", textAlign: "center", color: t.textFaint, fontSize: 13 }}>Aucune dépense extra ce mois</div>}
          <div style={{ padding: "4px 12px" }}>
            <AddBtn onClick={() => update("extras", p => [...p, { id: gid(), label: "", montant: 0, compte: comptes[0] }])} label="Ajouter une dépense" t={t} />
          </div>
        </Section>

        {/* RÉCAP */}
        <div style={{ background: t.recapBg, border: `1px solid ${t.recapBorder}`, borderRadius: 16, padding: "20px 24px" }}>
          <h3 style={{ margin: "0 0 14px", fontFamily: "Outfit", fontWeight: 800, fontSize: 16, color: t.recapTitle }}>
            📊 Récap — {MONTHS[month]} {year}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {comptes.filter(c => (totalByCompte[c] || 0) > 0).map(c => (
              <div key={c} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.textSoft }}>Total {c}</span>
                <span style={{ fontWeight: 700, color: "#f59e0b" }}>{fmt(totalByCompte[c])}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${t.divider}`, margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: t.textSoft }}>Total Mensualités</span>
              <span style={{ fontWeight: 800, color: "#f59e0b" }}>{fmt(totalMensualites)}</span>
            </div>
            {totalExtras > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: t.textSoft }}>Total Extras</span>
              <span style={{ fontWeight: 800, color: "#ec4899" }}>{fmt(totalExtras)}</span>
            </div>}
            <div style={{ borderTop: `1px solid ${t.divider}`, margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
              <span style={{ color: t.text, fontWeight: 700 }}>Revenus</span>
              <span style={{ fontWeight: 800, color: "#22c55e" }}>{fmt(totalRevenus)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
              <span style={{ color: t.text, fontWeight: 700 }}>Dépenses Totales</span>
              <span style={{ fontWeight: 800, color: "#f43f5e" }}>{fmt(totalDepenses)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, padding: "12px 16px", borderRadius: 12, marginTop: 4,
              background: solde >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${solde >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
              <span style={{ fontWeight: 800, fontFamily: "Outfit" }}>{solde >= 0 ? "🟢" : "🔴"} Salaires (Reste)</span>
              <span style={{ fontWeight: 800, color: solde >= 0 ? "#22c55e" : "#ef4444", fontFamily: "Outfit" }}><AnimNum value={solde} /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "20px 16px 40px", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontSize: 13, color: t.textMuted, fontWeight: 500 }}>Créée avec ❤️ par <span style={{ fontWeight: 700, color: t.textSoft }}>Komunike</span></div>
        <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>© {new Date().getFullYear()} Komunike — Tous droits réservés</div>
      </div>

      {showAddModal && <AddMensualiteModal comptes={comptes}
        onAdd={(item) => { update("mensualites", p => [...p, item]); if (!comptes.includes(item.compte)) update("comptes", p => [...p, item.compte]); }}
        onAddCompte={(nom) => { if (!comptes.includes(nom)) update("comptes", p => [...p, nom]); }}
        onClose={() => setShowAddModal(false)} t={t} />}
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP - AUTH WRAPPER
// ═══════════════════════════════════════════
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #0c1220 0%, #111827 40%, #0f172a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 30, height: 30, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1",
          borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ color: "#94a3b8", fontSize: 14 }}>Chargement...</div>
      </div>
    </div>
  );

  if (!session) return <AuthScreen />;

  return <BudgetDashboard user={session.user} />;
}
