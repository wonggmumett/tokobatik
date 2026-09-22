import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
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

    navigate(location.state?.from?.pathname || "/", { replace: true });
  }

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <span className="eyebrow">WELCOME BACK</span>
        <h1>Masuk ke ruangmu.</h1>
        <p>Simpan koleksi, pantau pesanan, dan nikmati pengalaman belanja yang lebih personal.</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button className="button dark wide" disabled={busy}>
            {busy ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="auth-foot">
          Belum punya akun? <Link to="/register">Daftar sekarang</Link>
        </div>
        <div className="auth-foot admin-entry">
          Pengelola toko? <Link to="/admin/login">Masuk sebagai admin</Link>
        </div>
      </div>
    </main>
  );
}
