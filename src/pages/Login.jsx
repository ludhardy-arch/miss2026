// src/pages/Login.jsx

import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Login({ setUser }) {
  const { addPlayer, resetPlayerVotes } = useContext(AppContext);
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!pseudo) return alert("Entrez un pseudo !");

    // ADMIN
    if (password === "1234") {
      setUser({ pseudo, role: "admin" });
      navigate("/admin");
      return;
    }

    // PLAYER
    if (password === "ludo") {

      // 🔥 VIDER L’HISTORIQUE LOCAL POUR CE PSEUDO
      localStorage.removeItem(`miss2026_selection_tour1_${pseudo}`);
      localStorage.removeItem(`miss2026_selection_tour2_${pseudo}`);
      localStorage.removeItem(`miss2026_ranking_tour3_${pseudo}`);

      // 🔥 RÉINITIALISER LES VOTES DANS FIREBASE
      resetPlayerVotes(pseudo);
      addPlayer(pseudo);

      // Connexion joueur
      setUser({ pseudo, role: "player" });
      navigate("/player");
      return;
    }

    alert("Mot de passe incorrect !");
  };

  return (
    <div style={{ padding: 40, maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
      {/* ... reste de ton UI identique ... */}
    </div>
  );
}
