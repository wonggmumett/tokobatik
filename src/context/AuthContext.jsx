import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(id) {
    if (!id) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("LOAD PROFILE ERROR:", error);
      setProfile(null);
      return null;
    }

    setProfile(data || null);
    return data || null;
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      const currentUser = session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        await loadProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      if (mounted) {
        setLoading(false);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (!mounted) return;

      const currentUser = session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        setTimeout(() => {
          if (mounted) {
            loadProfile(currentUser.id);
          }
        }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    setUser(data.user);

    await loadProfile(data.user?.id);

    return {
      success: true,
      user: data.user,
    };
  }

  async function register({
    email,
    password,
    fullName,
    phone,
    address,
  }) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          phone: cleanPhone,
          address: cleanAddress,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    /*
      Jika Supabase langsung membuat session,
      kita simpan data profil sekarang.
    */
    if (data.session && data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            full_name: cleanName,
            phone: cleanPhone || null,
            address: cleanAddress || null,
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        console.error("REGISTER PROFILE ERROR:", profileError);

        return {
          success: false,
          error:
            "Akun berhasil dibuat, tetapi data profil belum berhasil disimpan: " +
            profileError.message,
        };
      }

      await loadProfile(data.user.id);
    }

    return {
      success: true,
      user: data.user,
      needsEmailConfirmation: !data.session,
    };
  }

  async function updateProfile(updates) {
    if (!user?.id) {
      return {
        success: false,
        error: "Sesi login tidak ditemukan.",
      };
    }

    const payload = {
      full_name: updates.fullName?.trim() || "",
      phone: updates.phone?.trim() || null,
      address: updates.address?.trim() || null,
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("UPDATE PROFILE ERROR:", error);

      return {
        success: false,
        error: error.message,
      };
    }

    setProfile(data);

    return {
      success: true,
      profile: data,
    };
  }

  async function logout() {
    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (!error) {
      setUser(null);
      setProfile(null);
    }

    return {
      success: !error,
      error: error?.message,
    };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        updateProfile,
        loadProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);