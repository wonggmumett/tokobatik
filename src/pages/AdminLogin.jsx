import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { login, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const result = await login(email, password);
    setBusy(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.user && profile?.role !== "admin") {
      // Profile state can update immediately after login, but AdminDashboard
      // also performs the final role check through ProtectedRoute.
    }

    navigate(location.state?.from?.pathname || "/admin", { replace: true });
  }

  return (
    <main className="auth-page admin-auth">
      <div className="auth-panel">
        <span className="eyebrow">NUSANTARA BATIK / ADMIN</span>
        <h1>Ruang pengelola.</h1>
        <p>Masuk menggunakan akun Supabase yang memiliki role <b>admin</b>.</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={submit}>
          <label>
            Email
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label>
            Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          <button className="button dark wide" disabled={busy}>
            {busy ? "Memeriksa..." : "Masuk ke dashboard"}
          </button>
        </form>

        <div className="auth-foot">
          <Link to="/">← Kembali ke toko</Link>
        </div>
      </div>
    </main>
  );
}
