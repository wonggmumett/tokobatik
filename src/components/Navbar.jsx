import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  UserRound,
  Menu,
  X,
  Search,
  ClipboardList,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { count } = useCart();
  const { user, profile } = useAuth();

  const [open, setOpen] = useState(false);

  const nav = useNavigate();

  const links = [
    ["Beranda", "/"],
    ["Koleksi", "/products"],
    ["Cerita Batik", "/about"],
    ["Galeri", "/gallery"],
  ];

  function goProfile() {
    setOpen(false);

    if (profile?.role === "admin") {
      nav("/admin");
      return;
    }

    nav("/profile");
  }

  return (
    <header className="nav-wrap">
      <div className="nav-top">
        Gratis ongkir untuk pesanan tertentu • Kerajinan Indonesia, dikirim ke
        seluruh Nusantara
      </div>

      <nav className="nav">
        {/* MOBILE MENU */}
        <button
          type="button"
          className="icon-btn mobile"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>

        {/* BRAND */}
        <Link
          to="/"
          className="brand"
          onClick={() => setOpen(false)}
        >
          <span className="brand-mark">NB</span>

          <span>
            NUSANTARA
            <br />
            <b>BATIK</b>
          </span>
        </Link>

        {/* NAVIGATION */}
        <div className={`nav-links ${open ? "show" : ""}`}>
          {links.map(([title, path]) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setOpen(false)}
            >
              {title}
            </NavLink>
          ))}

          {user && (
            <NavLink
              to="/orders"
              onClick={() => setOpen(false)}
              className="mobile-order-link"
            >
              <ClipboardList size={17} />
              <span>Riwayat Pesanan</span>
            </NavLink>
          )}

          {user && profile?.role !== "admin" && (
            <button
              type="button"
              className="mobile-profile-link"
              onClick={goProfile}
            >
              <UserRound size={17} />
              <span>Profil Saya</span>
            </button>
          )}
        </div>

        {/* ACTIONS */}
        <div className="nav-actions">
          {/* SEARCH */}
          <Link
            to="/products"
            className="icon-btn"
            aria-label="Cari produk"
          >
            <Search />
          </Link>

          {/* ACCOUNT */}
          {user ? (
            <>
              {/* DESKTOP ORDER HISTORY */}
              <Link
                to="/orders"
                className="order-btn"
                aria-label="Riwayat pesanan"
              >
                <ClipboardList />
                <span>Pesanan</span>
              </Link>

              {/* PROFILE / ADMIN */}
              <button
                type="button"
                className="profile-chip"
                onClick={goProfile}
                title={
                  profile?.role === "admin"
                    ? "Dashboard Admin"
                    : "Profil Saya"
                }
              >
                <UserRound />

                <span>
                  {profile?.role === "admin"
                    ? "Admin"
                    : "Akun"}
                </span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="login-link"
              onClick={() => setOpen(false)}
            >
              Masuk
            </Link>
          )}

          {/* CART */}
          <Link
            to="/cart"
            className="cart-btn"
            aria-label={`Keranjang, ${count} item`}
          >
            <ShoppingBag />
            <i>{count}</i>
          </Link>
        </div>
      </nav>
    </header>
  );
}