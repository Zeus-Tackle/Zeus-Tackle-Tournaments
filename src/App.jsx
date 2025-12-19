import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState("login");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password: pw })
        : await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) setMsg(error.message);
  };

  if (!session) {
    return (
      <div style={{ maxWidth: 420, margin: "40px auto", fontFamily: "system-ui" }}>
        <h1>Zeus Tackle Tournaments</h1>
        <h2>{mode === "signup" ? "Create account" : "Log in"}</h2>
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button type="submit">{mode === "signup" ? "Sign up" : "Log in"}</button>
        </form>
        <button style={{ marginTop: 10 }} onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
          Switch to {mode === "signup" ? "login" : "signup"}
        </button>
        {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Zeus Tackle Tournaments</h1>
      <p>Logged in ✅</p>
      <button onClick={() => supabase.auth.signOut()}>Logout</button>
    </div>
  );
}
