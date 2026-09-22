import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [user,setUser] = useState(null);
  const [profile,setProfile] = useState(null);
  const [loading,setLoading] = useState(true);

  async function loadProfile(id){
    if(!id){setProfile(null); return null;}
    const {data} = await supabase.from("profiles").select("*").eq("id",id).maybeSingle();
    setProfile(data || null);
    return data || null;
  }

  useEffect(()=>{
    let mounted=true;
    supabase.auth.getSession().then(async ({data})=>{
      if(!mounted) return;
      setUser(data.session?.user || null);
      if(data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      if(!mounted) return;
      const u=session?.user || null;
      setUser(u);
      if(u) setTimeout(()=>mounted && loadProfile(u.id),0);
      else setProfile(null);
    });
    return ()=>{mounted=false; subscription.unsubscribe();};
  },[]);

  async function login(email,password){
    const {data,error}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
    if(error) return {success:false,error:error.message};
    setUser(data.user);
    await loadProfile(data.user?.id);
    return {success:true,user:data.user};
  }

  async function register({email,password,fullName,phone}){
    const {data,error}=await supabase.auth.signUp({
      email:email.trim().toLowerCase(),password,
      options:{data:{full_name:fullName,phone:phone||""}}
    });
    if(error) return {success:false,error:error.message};
    if(data.session && data.user){
      await supabase.from("profiles").upsert({
        id:data.user.id,full_name:fullName,phone:phone||null
      },{onConflict:"id"});
      await loadProfile(data.user.id);
    }
    return {success:true,user:data.user,needsEmailConfirmation:!data.session};
  }

  async function logout(){
    const {error}=await supabase.auth.signOut({scope:"local"});
    if(!error){setUser(null);setProfile(null);}
    return {success:!error,error:error?.message};
  }

  return <AuthContext.Provider value={{user,profile,loading,login,register,logout}}>
    {children}
  </AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);