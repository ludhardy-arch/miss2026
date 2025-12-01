// src/pages/Admin.jsx

import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import Leaderboard from "../components/Leaderboard";
import FinaleOverlay from "../components/FinaleOverlay";
import { CANDIDATES } from "../data/candidates";

// Petite animation douce pour "VOTES OUVERTS !!!"
const votePulseKeyframes = `
@keyframes votePulse {
  0% { transform: scale(1); box-shadow: 0 0 10px rgba(0,255,120,0.6); }
  50% { transform: scale(1.03); box-shadow: 0 0 20px rgba(0,255,180,0.9); }
  100% { transform: scale(1); box-shadow: 0 0 10px rgba(0,255,120,0.6); }
}
`;

export default function Admin({ user }) {
  const {
    votesOpen,
    updateVotesOpen,
    tour,
    updateTour,
    adminSelections,
    updateAdminSelections,
    resetGame,
    players,
    finaleStarted,
    updateFinaleStarted,
  } = useContext(AppContext);

  const [selection, setSelection] = useState([]);   // tours 1 & 2
  const [ranking, setRanking] = useState({});       // tour 3

  // Charger sélection / classement existant
  useEffect(() => {
    const current = adminSelections[`tour${tour}`];

    if (tour === 3 && Array.isArray(current) && current.length === 5) {
      const obj = {};
      current.forEach((missId, index) => (obj[missId] = index + 1));
      setRanking(obj);
    } else {
      setSelection(current || []);
    }
  }, [tour, adminSelections]);

  // IDs des candidates selon le tour
  const candidateIds =
    tour === 1
      ? CANDIDATES.map((m) => m.id)
      : tour === 2
      ? adminSelections.tour1 || []
      : adminSelections.tour2 || [];

  // Objets candidates
  const candidates = candidateIds
    .map((id) => CANDIDATES.find((m) => m.id === id))
    .filter(Boolean);

  const maxSelect = tour === 1 ? 15 : 5;

  const handleClickMiss = (id) => {
    if (tour === 3) return;

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

  // Validation tour 1 / 2 / 3
  const handleValidate = () => {
    // TOURS 1 & 2
    if (tour < 3) {
      if (selection.length !== maxSelect) {
        alert(`Vous devez sélectionner ${maxSelect} miss.`);
        return;
      }

      if (
        !window.confirm(
          `Confirmer la sélection du tour ${tour} ? Cette action est définitive.`
        )
      ) {
        return;
      }

      updateAdminSelections(tour, selection);
      alert("Tour validé !");
      updateTour(tour + 1);
      return;
    }

    // TOUR 3 — classement final
    const ranks = Object.values(ranking).filter(Boolean);
    if (ranks.length !== 5) {
      alert("Classez les 5 miss de la 1ère à la 5ème place.");
      return;
    }

    const needed = [1, 2, 3, 4, 5];
    const ok = needed.every((r) => ranks.includes(r));
    if (!ok) {
      alert("Chaque place doit être utilisée une seule fois.");
      return;
    }

    if (
      !window.confirm(
        "Confirmer le classement final ? Cette action est définitive."
      )
    ) {
      return;
    }

    const ordered = [];
    for (let r = 1; r <= 5; r++) {
      const entry = Object.entries(ranking).find(([, rank]) => rank === r);
      if (entry) ordered.push(Number(entry[0]));
    }

    updateAdminSelections(3, ordered);
    alert("Finale validée !");
  };

  // Joueur a voté au tour courant ?
  const playerHasVoted = (p) => {
    if (!p) return false;
    const t = p[`tour${tour}`];
    if (!t) return false;
    return Array.isArray(t) ? t.length > 0 : Object.keys(t).length > 0;
  };

  const getBorderClass = (id) =>
    selection.includes(id) ? "border-blue" : "border-grey";

  const usedRanks = Object.values(ranking).filter(Boolean);

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      {/* keyframes pour l'animation votes ouverts */}
      <style>{votePulseKeyframes}</style>

      {/* SHOW FINAL (overlay) */}
      {finaleStarted && (
        <FinaleOverlay
          players={players}
          adminSelections={adminSelections}
          isAdmin={true}
        />
      )}

      {/* HEADER ADMIN */}
      <h1>ADMIN — {user.pseudo}</h1>

      {/* BANNIÈRE VOTES OUVERTS */}
      {votesOpen && (
        <div
          style={{
            margin: "0 auto 15px",
            maxWidth: 500,
            padding: "10px 18px",
            borderRadius: 999,
            background:
              "linear-gradient(135deg, rgba(0,200,120,0.95), rgba(0,255,180,0.95))",
            color: "#012",
            fontWeight: "bold",
            textAlign: "center",
            animation: "votePulse 1.6s infinite",
          }}
        >
          ✅ VOTES OUVERTS !!!
        </div>
      )}

      {/* BARRE DE CONTRÔLES */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <button onClick={() => updateVotesOpen(!votesOpen)}>
          {votesOpen ? "Fermer les votes" : "Ouvrir les votes"}
        </button>

        <button
          onClick={resetGame}
          style={{ background: "crimson", color: "white" }}
        >
          RESET
        </button>

        {tour === 3 && (
          <button
            onClick={() => updateFinaleStarted(true)}
            style={{
              background: "linear-gradient(135deg, #ffd700, #ff00aa)",
              color: "white",
            }}
          >
            🎉 Lancer le show final
          </button>
        )}
      </div>

      {/* LISTE DES JOUEURS */}
      <div
        style={{
          margin: "0 auto 20px",
          maxWidth: 500,
          padding: 15,
          borderRadius: 12,
          background: "rgba(0,0,0,0.45)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Joueurs</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {Object.keys(players).map((pseudo) => {
            const p = players[pseudo];
            const voted = playerHasVoted(p);

            return (
              <li
                key={pseudo}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 18,
                  padding: "4px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <span>{pseudo}</span>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    backgroundColor: voted ? "limegreen" : "gold",
                    borderRadius: "50%",
                    display: "inline-block",
                    boxShadow: voted
                      ? "0 0 8px rgba(0,255,0,0.8)"
                      : "0 0 8px rgba(255,255,0,0.8)",
                  }}
                ></span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* TOURS 1 & 2 — SÉLECTION AVEC PHOTOS */}
      {tour !== 3 && (
        <>
          <h2>Tour {tour} — Sélection des miss</h2>
          <p style={{ textAlign: "center" }}>
            Sélectionnez <b>{maxSelect}</b> miss.
          </p>

          <div className="grid">
            {candidates.map((miss) => (
              <div
                key={miss.id}
                className={`miss-card ${getBorderClass(miss.id)}`}
                onClick={() => handleClickMiss(miss.id)}
                style={{
                  cursor: "pointer",
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
                    marginBottom: 8,
                    objectFit: "cover",
                  }}
                />
                <div style={{ fontSize: 18 }}>{miss.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* TOUR 3 — CLASSEMENT FINAL AVEC PHOTOS */}
      {tour === 3 && (
        <>
          <h2>Classement final (1 → 5)</h2>

          <div className="grid">
            {candidates.map((miss) => (
              <div
                key={miss.id}
                className="miss-card border-grey"
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
                <div style={{ fontSize: 18, marginBottom: 8 }}>
                  {miss.label}
                </div>

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
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    fontSize: 16,
                  }}
                >
                  <option value="">— Choisir —</option>
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
        </>
      )}

      {/* BOUTON VALIDATION */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button onClick={handleValidate}>
          Valider {tour === 3 ? "le classement" : "la sélection"}
        </button>
      </div>

      <Leaderboard />
    </div>
  );
}
