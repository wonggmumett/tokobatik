import { useState } from "react";
import { Link,useLocation,useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function Login(){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false); const {login}=useAuth(); const nav=useNavigate(); const loc=useLocation();
 async function submit(e){e.preventDefault();setBusy(true);setError("");const r=await login(email,password);setBusy(false);if(!r.success)return setError(r.error);nav(loc.state?.from?.pathname||"/");}
 return <main className="auth-page"><div className="auth-panel"><span className="eyebrow">WELCOME BACK</span><h1>Masuk ke ruangmu.</h1><p>Simpan koleksi, pantau pesanan, dan nikmati pengalaman belanja yang lebih personal.</p>{error&&<div className="error">{error}</div>}<form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="button dark wide" disabled={busy}>{busy?"Memproses...":"Masuk"}</button></form><div className="auth-foot">Belum punya akun? <Link to="/register">Daftar sekarang</Link></div></div></main>
}