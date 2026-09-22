import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserRound,
  Phone,
  MapPin,
  Mail,
  Save,
  ShoppingBag,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const {
    user,
    profile,
    updateProfile,
    logout,
  } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!profile) return;

    setForm({
      fullName: profile.full_name || "",
      phone: profile.phone || "",
      address: profile.address || "",
    });
  }, [profile]);

  function change(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.fullName.trim()) {
      setError("Nama lengkap wajib diisi.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Nomor WhatsApp wajib diisi.");
      return;
    }

    if (!form.address.trim()) {
      setError("Alamat lengkap wajib diisi.");
      return;
    }

    setBusy(true);

    const result = await updateProfile(form);

    setBusy(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSuccess("Profil berhasil diperbarui.");
  }

  async function handleLogout() {
    await logout();
  }

  if (!user) {
    return (
      <main className="profile-page">
        <div className="profile-empty">
          <span className="eyebrow">ACCOUNT</span>
          <h1>Silakan masuk.</h1>
          <p>
            Masuk terlebih dahulu untuk melihat dan mengubah informasi
            profilmu.
          </p>

          <Link to="/login" className="button dark">
            Masuk
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <div className="profile-shell">
        <header className="profile-header">
          <div>
            <span className="eyebrow">MY ACCOUNT</span>

            <h1>
              Profil <em>kamu.</em>
            </h1>

            <p>
              Kelola informasi pribadi dan alamat pengiriman untuk membuat
              proses checkout lebih praktis.
            </p>
          </div>

          <div className="profile-avatar">
            <UserRound size={34} strokeWidth={1.5} />
          </div>
        </header>

        <div className="profile-layout">
          <section className="profile-card">
            <div className="profile-card-head">
              <div>
                <span className="eyebrow">PERSONAL INFORMATION</span>
                <h2>Data pribadi</h2>
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            {success && (
              <div className="profile-success">
                <span>✓</span>
                {success}
              </div>
            )}

            <form className="profile-form" onSubmit={submit}>
              <label>
                <span className="profile-label">
                  <UserRound size={16} />
                  Nama lengkap
                </span>

                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) =>
                    change("fullName", e.target.value)
                  }
                  placeholder="Nama lengkap"
                />
              </label>

              <label>
                <span className="profile-label">
                  <Phone size={16} />
                  No. WhatsApp
                </span>

                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) =>
                    change("phone", e.target.value)
                  }
                  placeholder="08xxxxxxxxxx"
                />
              </label>

              <label>
                <span className="profile-label">
                  <MapPin size={16} />
                  Alamat pengiriman
                </span>

                <textarea
                  required
                  rows="6"
                  autoComplete="street-address"
                  value={form.address}
                  onChange={(e) =>
                    change("address", e.target.value)
                  }
                  placeholder="Masukkan alamat lengkap pengiriman"
                />
              </label>

              <div className="profile-email">
                <span className="profile-label">
                  <Mail size={16} />
                  Email
                </span>

                <strong>{user.email || "-"}</strong>

                <small>
                  Email akun digunakan untuk login dan tidak diubah dari
                  halaman ini.
                </small>
              </div>

              <button
                type="submit"
                className="button dark wide"
                disabled={busy}
              >
                <Save size={17} />

                {busy ? "Menyimpan..." : "Simpan perubahan"}
              </button>
            </form>
          </section>

          <aside className="profile-side">
            <div className="profile-info-card">
              <span className="eyebrow">QUICK ACCESS</span>

              <h3>Akun & pesanan</h3>

              <p>
                Gunakan alamat tersimpanmu saat checkout dan lihat perjalanan
                pesanan dari satu tempat.
              </p>

              <Link to="/orders" className="profile-link">
                <ShoppingBag size={18} />
                <span>Riwayat pesanan</span>
              </Link>

              <Link to="/products" className="profile-link">
                <span className="profile-link-dot" />
                <span>Jelajahi koleksi</span>
              </Link>
            </div>

            <button
              type="button"
              className="profile-logout"
              onClick={handleLogout}
            >
              <LogOut size={17} />
              Keluar dari akun
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}