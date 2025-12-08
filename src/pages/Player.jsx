// src/pages/Player.jsx

import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import Leaderboard from "../components/Leaderboard";
import ChatBubble from "../components/ChatBubble";
import SelectionBubble from "../components/SelectionBubble";
import { CANDIDATES } from "../data/candidates";

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

  // Déconnexion
  const handleLogout = () => {
    if (!window.confirm("Voulez-vous vraiment vous déconnecter ?")) return;

    localStorage.removeItem("miss_user");

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("miss2026_") && key.endsWith(`_${user.pseudo}`)) {
        localStorage.removeItem(key);
      }
    });

    navigate("/login", { replace: true });
  };

  const [selection, setSelection] = useState([]);
  const [ranking, setRanking] = useState({});
  const [showVoteBanner, setShowVoteBanner] = useState(true);

  useEffect(() => {
    setShowVoteBanner(true);
  }, [tour]);

  useEffect(() => {
    addPlayer(user.pseudo);
  }, [user.pseudo]);

  const playerData = players[user.pseudo] || {};
  const currentKey = `tour${tour}`;
  const hasVotedThisTour =
    Array.isArray(playerData[currentKey]) &&
    playerData[currentKey].length > 0;

  // ⭐ Nouveau : Tour 1 = 12 miss
  const maxSelect = tour === 1 ? 12 : tour === 2 ? 5 : 5;

  const candidateIds =
    tour === 1
      ? CANDIDATES.map((c) => c.id)
      : tour === 2
      ? adminSelections.tour1 || []
      : adminSelections.tour2 || [];

  const candidates = candidateIds
    .map((id) => CANDIDATES.find((c) => c.id === id))
    .filter(Boolean);

  useEffect(() => {
    if (hasVotedThisTour) navigate("/waiting");
  }, [hasVotedThisTour, navigate]);

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

  // Sauvegardes locales
  useEffect(() => {
    if (hasVotedThisTour || tour === 3) return;
    const key = `miss2026_selection_tour${tour}_${user.pseudo}`;
    localStorage.setItem(key, JSON.stringify(selection));
  }, [selection, tour, hasVotedThisTour, user.pseudo]);

  useEffect(() => {
    if (hasVotedThisTour || tour !== 3) return;
    const key = `miss2026_ranking_tour3_${user.pseudo}`;
    localStorage.setItem(key, JSON.stringify(ranking));
  }, [ranking, tour, hasVotedThisTour, user.pseudo]);

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

  const handleValidate = () => {
    if (!votesOpen) return alert("Les votes ne sont pas ouverts.");

    if (tour === 1 || tour === 2) {
      if (selection.length !== maxSelect)
        return alert(`Tu dois sélectionner ${maxSelect} miss.`);

      if (!window.confirm("Envoyer ton vote ?")) return;

      updatePlayerVote(user.pseudo, tour, selection);
      navigate("/waiting");
      return;
    }

    // Tour 3
    const ranks = Object.values(ranking).filter(Boolean);
    const nb = candidates.length;

    if (ranks.length !== nb)
      return alert("Tu dois classer toutes les finalistes.");

    const needed = Array.from({ length: nb }, (_, i) => i + 1);
    if (!needed.every((r) => ranks.includes(r)))
      return alert("Chaque place doit être utilisée une seule fois.");

    if (!window.confirm("Envoyer ton classement final ?")) return;

    const ordered = [];
    for (let r = 1; r <= nb; r++) {
      const entry = Object.entries(ranking).find(([, rank]) => rank === r);
      if (entry) ordered.push(Number(entry[0]));
    }

    updatePlayerVote(user.pseudo, 3, ordered);
    navigate("/waiting");
  };

  const getBorderColor = (id) => {
    const t1P = playerData.tour1 || [];
    const t2P = playerData.tour2 || [];
    const t1A = adminSelections.tour1 || [];
    const t2A = adminSelections.tour2 || [];

    if (tour !== 3 && !hasVotedThisTour && selection.includes(id))
      return "blue";
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

  const subtitle =
    tour === 1
      ? "Tour 1 — sélectionne 12 miss"
      : tour === 2
      ? "Tour 2 — sélectionne 5 miss"
      : "Tour 3 — classe les 5 finalistes";

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <style>{votePulseKeyframes}</style>

      {/* Bannière votes ouverts */}
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
            animation: "votePulse 2s infinite",
          }}
        >
          📢 <b>Les votes sont ouverts !!!</b>
          <br />
          Le temps limite est le même qu'à la télé.
          <br />
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
            }}
          >
            J’ai compris
          </button>
        </div>
      )}

      <h1>Bienvenue {user.pseudo}</h1>
      <p style={{ textAlign: "center" }}>{subtitle}</p>

      {/* Tours 1 & 2 */}
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
                }}
              />
              <div>{miss.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tour 3 */}
      {tour === 3 && (
        <div className="grid">
          {candidates.map((miss) => (
            <div
              key={miss.id}
              className={`miss-card ${getBorderClass(miss.id)}`}
              style={{
                textAlign: "center",
                borderWidth: 5,
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
                }}
              />
              <div style={{ marginBottom: 8 }}>{miss.label}</div>

              <select
                value={ranking[miss.id] || ""}
                onChange={(e) => {
                  const newRank = Number(e.target.value);
                  setRanking((prev) => {
                    const updated = { ...prev };

                    Object.keys(updated).forEach((mid) => {
                      if (updated[mid] === newRank) delete updated[mid];
                    });

                    updated[miss.id] = newRank;
                    return updated;
                  });
                }}
                disabled={hasVotedThisTour || !votesOpen}
                style={{ width: "100%", padding: 6 }}
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

      {/* Validation */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          onClick={handleValidate}
          disabled={!votesOpen || hasVotedThisTour}
        >
          {tour === 3 ? "Valider mon classement" : "Valider mon vote"}
        </button>
      </div>

      <Leaderboard />
      <ChatBubble user={user} />

      {/* 🟦 Bulle bleue sélection */}
      <SelectionBubble user={user} tour={tour} selection={selection} />

      {/* Déconnexion */}
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <button
          onClick={handleLogout}
          style={{
            background: "crimson",
            color: "white",
            padding: "10px 25px",
            borderRadius: 10,
            border: "none",
            fontSize: 18,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ⛔ Déconnexion
        </button>
      </div>
    </div>
  );
}
