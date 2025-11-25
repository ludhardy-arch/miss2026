// src/pages/Login.jsx

import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Login({ setUser }) {
  const { addPlayer, resetPlayerVotes } = useContext(AppContext);
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const cleanLocalData = (pseudo) => {
    // Nettoyage total des sauvegardes locales d’un joueur
    localStorage.removeItem("miss_user");

    localStorage.removeItem(`miss2026_selection_tour1_${pseudo}`);
    localStorage.removeItem(`miss2026_selection_tour2_${pseudo}`);
    localStorage.removeItem(`miss2026_ranking_tour3_${pseudo}`);
  };

  const handleLogin = () => {
    if (!pseudo.trim()) return alert("Entrez un pseudo !");
    const p = pseudo.trim();

    // ---------------------------------
    // ADMIN
    // ---------------------------------
    if (password === "1234") {
      cleanLocalData(p);
      setUser({ pseudo: p, role: "admin" });
      navigate("/admin");
      return;
    }

    // ---------------------------------
    // PLAYER
    // ---------------------------------
    if (password === "ludo") {
      // Reset complet : Firebase + localStorage
      resetPlayerVotes(p);
      cleanLocalData(p);

      addPlayer(p); // recrée son profil propre

      setUser({ pseudo: p, role: "player" });
      navigate("/player");
      return;
    }

    // ---------------------------------
    // BAD PASSWORD
    // ---------------------------------
    alert("Mot de passe incorrect !");
  };

  return (
    <div
      style={{
        padding: 40,
        maxWidth: 500,
        margin: "0 auto",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: 36,
          marginBottom: 10,
          color: "#ff4da6",
          textShadow: "0px 0px 8px rgba(255, 50, 150, 0.4)",
          fontWeight: "bold",
        }}
      >
        🎉 Bienvenue sur Miss2026 !!! 🎉
      </h1>

      <p style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
        Qui aura le meilleur pronostic ?
      </p>

      <p
        style={{
          fontSize: 16,
          background: "rgba(255,255,255,0.85)",
          padding: 15,
          borderRadius: 10,
          marginBottom: 25,
          color: "#333",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        Quand les votes seront ouverts :
        <br />
        ✔ <b>15 miss</b> — premier tour <br />
        ✔ <b>5 miss</b> — deuxième tour <br />
        ✔ Puis <b>classer le top 5 final</b> ! <br />
        <br />
        Celui qui trouvera le plus de bonnes miss gagnera !
      </p>

      <p
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 10,
          color: "#444",
        }}
      >
        🍺 Site sponsorisé par la bière{" "}
        <span style={{ color: "#d23" }}>Malounette</span>
      </p>

      <img
        src="/images/malounette.jpeg"
        alt="Malounette"
        style={{
          width: "100%",
          maxWidth: 350,
          borderRadius: 12,
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          marginBottom: 25,
        }}
      />

      <input
        placeholder="Ton pseudo"
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          fontSize: 18,
          marginBottom: 15,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
      />

      <input
        placeholder="Mot de passe"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          fontSize: 18,
          marginBottom: 20,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
      />

      <button
        onClick={handleLogin}
        style={{
          padding: "12px 25px",
          fontSize: 20,
          borderRadius: 10,
          background: "#ff0088",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
          border: "none",
          width: "100%",
        }}
      >
        🚀 C'est parti !!!
      </button>
    </div>
  );
}
