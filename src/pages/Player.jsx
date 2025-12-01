// src/pages/Player.jsx

import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import Leaderboard from "../components/Leaderboard";
import ChatBubble from "../components/ChatBubble"; // ⭐ AJOUT ICI ⭐
import { CANDIDATES } from "../data/candidates";

// Animation douce pour "VOTES OUVERTS !!!"
const votePulseKeyframes = `
@keyframes votePulse {
  0% { transform: scale(1); box-shadow: 0 0 10px rgba(0,255,120,0.6); }
  50% { transform: scale(1.03); box-shadow: 0 0 20px rgba(0,255,180,0.9); }
  100% { transform: scale(1); box-shadow: 0 0 10px rgba(0,255,120,0.6); }
}
`;

export default function Player({ user }) {
  const {
    tour,
    votesOpen,
    adminSelections,
    updatePlayerVote,
    addPlayer,
    players,
  } = useContext(AppContext);

  const navigate = useNavigate();
  const [selection, setSelection] = useState([]); 
  const [ranking, setRanking] = useState({});
  const [showVoteBanner, setShowVoteBanner] = useState(true);

  // Bannière réapparaît à chaque tour
  useEffect(() => {
    setShowVoteBanner(true);
  }, [tour]);

  // Enregistrer le joueur
  useEffect(() => {
    addPlayer(user.pseudo);
  }, [user.pseudo]);

  const playerData = players[user.pseudo] || {};
  const currentKey = `tour${tour}`;
  const hasVotedThisTour =
    Array.isArray(playerData[currentKey]) &&
    playerData[currentKey].length > 0;

  const maxSelect = tour === 1 ? 15 : tour === 2 ? 5 : 5;

  // Liste candidates selon tour
  const candidateIds =
    tour === 1
      ? CANDIDATES.map((c) => c.id)
      : tour === 2
      ? adminSelections.tour1 || []
      : adminSelections.tour2 || [];

  const candidates = candidateIds
    .map((id) => CANDIDATES.find((c) => c.id === id))
    .filter(Boolean);

  // Aller en attente si déjà voté
  useEffect(() => {
    if (hasVotedThisTour) navigate("/waiting");
  }, [hasVotedThisTour, navigate]);

  // Charger sélection locale
  useEffect(() => {
    if (hasVotedThisTour) return;

    if (tour === 3) {
      const key = `miss2026_ranking_tour3_${user.pseudo}`;
      const saved = localStorage.getItem(key);
      setRanking(saved ? JSON.parse(saved) : {});
    } else {
      const key = `miss2026_selection_tour${tour}_${user.pseudo}`;
      const saved = localStorage.getItem(key);
      setSelection(saved ? JSON.parse(saved) : []);
    }
  }, [tour, hasVotedThisTour, user.pseudo]);

  // Sauvegarde locale tour 1 & 2
  useEffect(() => {
    if (hasVotedThisTour || tour === 3) return;
    const key = `miss2026_selection_tour${tour}_${user.pseudo}`;
    localStorage.setItem(key, JSON.stringify(selection));
  }, [selection, tour, hasVotedThisTour, user.pseudo]);

  // Sauvegarde classement finale
  useEffect(() => {
    if (hasVotedThisTour || tour !== 3) return;
    const key = `miss2026_ranking_tour3_${user.pseudo}`;
    localStorage.setItem(key, JSON.stringify(ranking));
  }, [ranking, tour, hasVotedThisTour, user.pseudo]);

  // Sélection (tour 1 & 2)
  const handleClickMiss = (id) => {
    if (tour === 3 || !votesOpen || hasVotedThisTour) return;

    if (selection.includes(id)) {
      setSelection(selection.filter((x) => x !== id));
    } else if (selection.length < maxSelect) {
      setSelection([...selection, id]);
    }
  };

  const getRankLabel = (rank) => {
    if (rank === 1) return "Miss France";
    if (rank === 2) return "1ère dauphine";
    if (rank === 3) return "2ème dauphine";
    if (rank === 4) return "3ème dauphine";
    return "4ème dauphine";
  };

  // Validation vote
  const handleValidate = () => {
    if (!votesOpen) {
      alert("Les votes ne sont pas ouverts.");
      return;
    }

    if (tour === 1 || tour === 2) {
      if (selection.length !== maxSelect) {
        alert(`Tu dois sélectionner ${maxSelect} miss.`);
        return;
      }

      if (!window.confirm("Envoyer ton vote ? Tu ne pourras plus le modifier."))
        return;

      updatePlayerVote(user.pseudo, tour, selection);
      alert("Vote enregistré !");
      navigate("/waiting");
      return;
    }

    // Finale
    if (tour === 3) {
      const ranks = Object.values(ranking).filter(Boolean);
      const nb = candidates.length;

      if (ranks.length !== nb) {
        alert("Tu dois classer toutes les finalistes.");
        return;
      }

      const needed = Array.from({ length: nb }, (_, i) => i + 1);
      if (!needed.every((r) => ranks.includes(r))) {
        alert("Chaque place doit être utilisée une seule fois.");
        return;
      }

      if (!window.confirm("Envoyer ton classement final ?"))
        return;

      const ordered = [];
      for (let r = 1; r <= nb; r++) {
        const entry = Object.entries(ranking).find(([, rank]) => rank === r);
        if (entry) ordered.push(Number(entry[0]));
      }

      updatePlayerVote(user.pseudo, 3, ordered);
      alert("Classement final enregistré !");
      navigate("/waiting");
    }
  };

  // Couleurs cadres
  const getBorderColor = (id) => {
    const t1P = playerData.tour1 || [];
    const t2P = playerData.tour2 || [];
    const t1A = adminSelections.tour1 || [];
    const t2A = adminSelections.tour2 || [];

    if (tour !== 3 && !hasVotedThisTour && selection.includes(id)) {
      return "blue";
    }

    if (t1P.includes(id) && t1A.includes(id)) return "green";
    if (tour >= 2 && t2P.includes(id) && t2A.includes(id)) return "gold";
    return "grey";
  };

  const getBorderClass = (id) => {
    const c = getBorderColor(id);
    if (c === "blue") return "border-blue";
    if (c === "green") return "border-green";
    if (c === "gold") return "border-yellow";
    return "border-grey";
  };

  const usedRanks = Object.values(ranking).filter(Boolean);

  let subtitle = "";
  if (tour === 1) subtitle = `Tour 1 — sélectionne ${maxSelect} miss`;
  else if (tour === 2) subtitle = `Tour 2 — sélectionne ${maxSelect} miss`;
  else subtitle = "Tour 3 — classe les finalistes";

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <style>{votePulseKeyframes}</style>

      {/* ⭐ BANNIÈRE VERTE FIXE ⭐ */}
      {votesOpen && showVoteBanner && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(135deg, #0f0, #32cd32)",
            color: "#003300",
            fontWeight: "bold",
            padding: "15px 20px",
            textAlign: "center",
            fontSize: 18,
            zIndex: 9999,
            boxShadow: "0 6px 14px rgba(0,0,0,0.3)",
            animation: "votePulse 2s infinite",
          }}
        >
          <div>
            📢 <b>Les votes sont ouverts !!!</b><br />
            Le temps limite pour valider votre vote est le même qu'à la télé.
          </div>

          <button
            onClick={() => setShowVoteBanner(false)}
            style={{
              marginTop: 10,
              background: "white",
              color: "green",
              border: "none",
              padding: "6px 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            }}
          >
            J’ai compris
          </button>
        </div>
      )}

      <h1>Bienvenue {user.pseudo}</h1>
      <p style={{ textAlign: "center" }}>{subtitle}</p>

      {/* BANNIÈRE VOTES FERMÉS */}
      {!votesOpen && (
        <div
          style={{
            margin: "0 auto 15px",
            maxWidth: 600,
            padding: "12px 18px",
            borderRadius: 12,
            background: "rgba(180,0,0,0.9)",
            color: "white",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: 18,
            boxShadow: "0 0 18px rgba(255,0,0,0.7)",
          }}
        >
          <div>LES VOTES SONT FERMÉS</div>
          <div style={{ fontSize: 15, marginTop: 4 }}>
            Patientez que Ludo ouvre les votes.
          </div>
        </div>
      )}

      {/* LÉGENDE */}
      <div
        style={{
          margin: "20px auto",
          padding: 15,
          borderRadius: 10,
          background: "rgba(0,0,0,0.45)",
          maxWidth: 600,
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Légende :</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <LegendItem colorClass="border-blue" text="Sélection en cours" />
          <LegendItem colorClass="border-green" text="Bonne au tour 1" />
          <LegendItem colorClass="border-yellow" text="Bonne au tour 2" />
          <LegendItem colorClass="border-grey" text="Jamais sélectionnée" />
        </div>
      </div>

      {/* TOURS 1 & 2 */}
      {tour !== 3 && (
        <div className="grid">
          {candidates.map((miss) => (
            <div
              key={miss.id}
              className={`miss-card ${getBorderClass(miss.id)}`}
              onClick={() => handleClickMiss(miss.id)}
              style={{
                cursor:
                  !votesOpen || hasVotedThisTour ? "default" : "pointer",
                textAlign: "center",
                borderWidth: 5,
                boxShadow: selection.includes(miss.id)
                  ? "0 0 16px rgba(76,161,255,0.9)"
                  : "0 0 10px rgba(255,255,255,0.18)",
              }}
            >
              <img
                src={miss.image}
                alt={miss.label}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 10,
                  marginBottom: 4,
                  objectFit: "cover",
                }}
              />
              <div>{miss.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* TOUR 3 */}
      {tour === 3 && (
        <div className="grid">
          {candidates.map((miss) => (
            <div
              key={miss.id}
              className={`miss-card ${getBorderClass(miss.id)}`}
              style={{
                textAlign: "center",
                borderWidth: 5,
                boxShadow: "0 0 14px rgba(0,0,0,0.6)",
              }}
            >
              <img
                src={miss.image}
                alt={miss.label}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 10,
                  marginBottom: 8,
                  objectFit: "cover",
                }}
              />
              <div style={{ marginBottom: 8 }}>{miss.label}</div>

              <select
                value={ranking[miss.id] || ""}
                onChange={(e) => {
                  const newRank = Number(e.target.value);
                  setRanking((prev) => {
                    const updated = { ...prev };
                    delete updated[miss.id];
                    Object.keys(updated).forEach((mid) => {
                      if (updated[mid] === newRank) delete updated[mid];
                    });
                    updated[miss.id] = newRank;
                    return updated;
                  });
                }}
                disabled={hasVotedThisTour || !votesOpen}
                style={{
                  width: "100%",
                  padding: 6,
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                <option value="">— Choisir un rang —</option>
                {[1, 2, 3, 4, 5].map((r) => (
                  <option
                    key={r}
                    value={r}
                    disabled={usedRanks.includes(r) && ranking[miss.id] !== r}
                  >
                    {getRankLabel(r)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* VALIDATION */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          onClick={handleValidate}
          disabled={!votesOpen || hasVotedThisTour}
        >
          {tour === 3 ? "Valider mon classement" : "Valider mon vote"}
        </button>
      </div>

      <Leaderboard />

      {/* ⭐⭐ BULLE DE CHAT ⭐⭐ */}
      <ChatBubble user={user} />

    </div>
  );
}

function LegendItem({ colorClass, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        className={`miss-card ${colorClass}`}
        style={{
          width: 40,
          height: 20,
          padding: 0,
          boxShadow: "none",
          borderWidth: 4,
        }}
      ></span>
      <span>{text}</span>
    </div>
  );
}
