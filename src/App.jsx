import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState("login");
  const [msg, setMsg] = useState("");

  const [tournamentName, setTournamentName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [myTournaments, setMyTournaments] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadMyTournaments = async () => {
    setMsg("");
    const { data, error } = await supabase
      .from("tournaments")
      .select("id,name,join_code,created_at,created_by")
      .order("created_at", { ascending: false });

    if (error) setMsg(error.message);
    else setMyTournaments(data ?? []);
  };

  useEffect(() => {
    if (session) loadMyTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    const res =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password: pw })
        : await supabase.auth.signInWithPassword({ email, password: pw });

    if (res.error) {
      setMsg(res.error.message);
      return;
    }

    const { data } = await supabase.auth.getSession();
    setSession(data.session ?? null);
  };

  const createTournament = async (e) => {
    e.preventDefault();
    setMsg("");
    const name = tournamentName.trim();
    if (!name) return setMsg("Enter a tournament name.");

    const { data, error } = await supabase.rpc("create_tournament", { p_name: name });
    if (error) return setMsg(error.message);

    const created = data?.[0];
    setTournamentName("");
    await loadMyTournaments();
    if (created?.join_code) setMsg(`Created! Join code: ${created.join_code}`);
  };

  const joinTournament = async (e) => {
    e.preventDefault();
    setMsg("");
    const code = joinCode.trim();
    if (!code) return setMsg("Enter a join code.");

    const { error } = await supabase.rpc("join_tournament", { p_join_code: code });
    if (error) return setMsg(error.message);

    setJoinCode("");
    await loadMyTournaments();
    setMsg("Joined tournament ✅");
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
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1>Zeus Tackle Tournaments</h1>
        <button onClick={() => supabase.auth.signOut()}>Logout</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <form onSubmit={createTournament} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2>Create tournament</h2>
          <input
            placeholder="Tournament name"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            style={{ width: "100%", marginTop: 8 }}
          />
          <button type="submit" style={{ marginTop: 10 }}>
            Create
          </button>
          <p style={{ opacity: 0.7, marginTop: 8 }}>You’ll get a 6-character join code.</p>
        </form>

        <form onSubmit={joinTournament} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2>Join tournament</h2>
          <input
            placeholder="Enter join code (e.g. A2K9QF)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            style={{ width: "100%", marginTop: 8 }}
          />
          <button type="submit" style={{ marginTop: 10 }}>
            Join
          </button>
        </form>
      </div>

      {msg && <p style={{ marginTop: 14 }}>{msg}</p>}

      <div style={{ marginTop: 24 }}>
        <h2>My tournaments</h2>
        <button onClick={loadMyTournaments}>Refresh</button>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {myTournaments.map((t) => (
            <div key={t.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{t.name}</strong>
                <span style={{ opacity: 0.7 }}>Code: {t.join_code}</span>
              </div>
              <div style={{ opacity: 0.7, marginTop: 4 }}>Created: {new Date(t.created_at).toLocaleString()}</div>
            </div>
          ))}
          {myTournaments.length === 0 && <p style={{ opacity: 0.7 }}>No tournaments yet.</p>}
        </div>
      </div>
    </div>
  );
}
