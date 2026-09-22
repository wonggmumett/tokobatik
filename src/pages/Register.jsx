import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  function change(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setInfo("");

    if (!form.fullName.trim()) {
      setError("Nama lengkap wajib diisi.");
      setBusy(false);
      return;
    }

    if (!form.phone.trim()) {
      setError("Nomor WhatsApp wajib diisi.");
      setBusy(false);
      return;
    }

    if (!form.address.trim()) {
      setError("Alamat lengkap wajib diisi.");
      setBusy(false);
      return;
    }

    const result = await register(form);

    setBusy(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setInfo(
        "Akun berhasil dibuat. Cek email untuk konfirmasi sebelum masuk."
      );
      return;
    }

    navigate("/", { replace: true });
  }

  return (
    <main className="auth-page">
      <div className="auth-panel register-panel">
        <span className="eyebrow">JOIN THE STORY</span>

        <h1>Buat akun.</h1>

        <p>
          Jadilah bagian dari perjalanan batik modern Nusantara dan simpan
          informasi pengirimanmu untuk checkout yang lebih cepat.
        </p>

        {error && <div className="error">{error}</div>}

        {info && <div className="notice success">{info}</div>}

        <form onSubmit={submit}>
          <label>
            Nama lengkap
            <input
              type="text"
              required
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => change("fullName", e.target.value)}
              placeholder="Nama lengkap"
            />
          </label>

          <label>
            No. WhatsApp
            <input
              type="tel"
              required
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => change("phone", e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </label>

          <label>
            Alamat lengkap
            <textarea
              required
              rows="4"
              autoComplete="street-address"
              value={form.address}
              onChange={(e) => change("address", e.target.value)}
              placeholder="Contoh: Jl. Merdeka No. 10, Kelurahan..., Kecamatan..., Kota..."
            />
          </label>

          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => change("email", e.target.value)}
              placeholder="nama@email.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              minLength="6"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => change("password", e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </label>

          <button
            type="submit"
            className="button dark wide"
            disabled={busy}
          >
            {busy ? "Membuat akun..." : "Daftar"}
          </button>
        </form>

        <div className="auth-foot">
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </div>
      </div>
    </main>
  );
}