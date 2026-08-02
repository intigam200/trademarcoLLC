import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { ADMIN_COLORS } from "../theme";
import Icon from "../../components/Icon";

export default function Login() {
  const { status, login } = useAdminAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Admin Login | TradeMarco";
  }, []);

  if (status === "authenticated") {
    const from = location.state?.from?.pathname || "/admin";
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    setError("");
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) setError(result.error);
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px 12px 40px", fontSize: 14, fontFamily: "inherit",
    border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 6, outline: "none",
    color: ADMIN_COLORS.darkGray, background: ADMIN_COLORS.white,
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: ADMIN_COLORS.navy,
      backgroundImage: "radial-gradient(ellipse 700px 500px at 30% 0%, rgba(45,114,210,0.18), transparent 60%)",
      padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <img src="/images/products/logo.png" alt="TradeMarco" style={{ height: 40, width: "auto" }} />
        </div>

        <div style={{ background: ADMIN_COLORS.white, borderRadius: 10, padding: "36px 32px", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", background: ADMIN_COLORS.iconBlueBg,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
            }}>
              <Icon type="lock" size={20} color={ADMIN_COLORS.iconBlue} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: ADMIN_COLORS.navy, margin: "0 0 4px" }}>Admin Sign In</h1>
            <p style={{ fontSize: 13, color: ADMIN_COLORS.medGray, margin: 0 }}>Internal access only</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: ADMIN_COLORS.navy, display: "block", marginBottom: 6 }}>Email</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
                  <Icon type="mail" size={16} color={ADMIN_COLORS.medGray} />
                </span>
                <input
                  style={inputStyle}
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@trademarco.com"
                  onFocus={(e) => (e.target.style.borderColor = ADMIN_COLORS.navy)}
                  onBlur={(e) => (e.target.style.borderColor = ADMIN_COLORS.border)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: ADMIN_COLORS.navy, display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
                  <Icon type="lock" size={16} color={ADMIN_COLORS.medGray} />
                </span>
                <input
                  style={{ ...inputStyle, paddingRight: 40 }}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onFocus={(e) => (e.target.style.borderColor = ADMIN_COLORS.navy)}
                  onBlur={(e) => (e.target.style.borderColor = ADMIN_COLORS.border)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon type={showPassword ? "eye-off" : "eye"} size={16} color={ADMIN_COLORS.medGray} />
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: ADMIN_COLORS.danger, background: ADMIN_COLORS.dangerBg, padding: "10px 12px", borderRadius: 6 }}>
                <Icon type="alert-triangle" size={15} color={ADMIN_COLORS.danger} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%", padding: "13px 24px", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                border: "none", borderRadius: 6, cursor: submitting ? "default" : "pointer",
                background: ADMIN_COLORS.accent, color: ADMIN_COLORS.white, opacity: submitting ? 0.7 : 1,
                marginTop: 4,
              }}
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 20 }}>
          TradeMarco internal admin panel &middot; access is restricted to authorized staff.
        </p>
      </div>
    </div>
  );
}
