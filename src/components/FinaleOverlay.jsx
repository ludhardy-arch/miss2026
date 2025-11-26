// src/components/FinaleOverlay.jsx

import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
} from "react";
import confetti from "canvas-confetti";
import { calculatePoints } from "../services/points";
import { AppContext } from "../context/AppContext";

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background:
      "radial-gradient(circle at top, #24163b 0, #05030a 40%, #000 100%)",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  inner: {
    maxWidth: 900,
    width: "100%",
    textAlign: "center",
    position: "relative",
  },
  title: {
    fontSize: 32,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.8,
    marginBottom: 20,
  },
  countdown: {
    fontSize: 80,
    fontWeight: "bold",
  },
  listContainer: {
    marginTop: 20,
    maxHeight: 400,
    overflowY: "auto",
    padding: "0 10px",
  },
  row: {
    padding: "8px 12px",
    marginBottom: 6,
    borderRadius: 8,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 18,
  },
  rowRank: {
    fontWeight: "bold",
    marginRight: 8,
  },
  rowName: {
    flex: 1,
    textAlign: "left",
  },
  rowPoints: {
    fontWeight: "bold",
    minWidth: 80,
    textAlign: "right",
  },
  podiumWrapper: {
    marginTop: 30,
  },
  podiumTitle: {
    fontSize: 28,
    marginBottom: 16,
  },
  podium: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 16,
    marginTop: 20,
  },
  podiumCol: (height, colorType) => {
    let gradient;
    if (colorType === "gold") {
      gradient = "linear-gradient(180deg, #ffd700, #b8860b)";
    } else if (colorType === "silver") {
      gradient = "linear-gradient(180deg, #dcdcdc, #808080)";
    } else {
      gradient = "linear-gradient(180deg, #cd7f32, #5e3b1f)"; // bronze
    }

    return {
      width: 120,
      height,
      borderRadius: "18px 18px 0 0",
      background: gradient,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "center",
      padding: "12px 8px",
      boxShadow:
        colorType === "gold"
          ? "0 0 25px rgba(255,215,0,0.8)"
          : "0 0 15px rgba(0,0,0,0.6)",
      position: "relative",
      overflow: "hidden",
    };
  },
  podiumName: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  podiumPoints: {
    fontSize: 14,
    opacity: 0.9,
  },
  crown: {
    position: "absolute",
    top: -40,
    fontSize: 32,
    filter: "drop-shadow(0 0 8px rgba(255,215,0,0.9))",
  },
  quitButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: "6px 12px",
    fontSize: 14,
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    background: "rgba(0,0,0,0.7)",
    color: "white",
  },
};

const keyframes = `
@keyframes sponsorFadeIn {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes logoPop {
  0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
  60% { transform: scale(1.08) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); }
}
@keyframes winnerPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.04); }
  100% { transform: scale(1); }
}
@keyframes cardDrop {
  0% { opacity: 0; transform: translateY(-30px); }
  70% { opacity: 1; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes podiumRise {
  0% { opacity: 0; transform: translateY(60px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes slideInLeft {
  0% { opacity: 0; transform: translateX(-80px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes goldShine {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}
@keyframes crownDrop {
  0% { transform: translateY(-60px) scale(0.8); opacity: 0; }
  60% { transform: translateY(4px) scale(1.05); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes flashScreen {
  0% { opacity: 0; }
  40% { opacity: 0.9; }
  100% { opacity: 0; }
}
`;

export default function FinaleOverlay({ players, adminSelections, isAdmin }) {
  const { updateFinaleStarted } = useContext(AppContext) || {};
  const [phase, setPhase] = useState("sponsor"); // sponsor → countdown → revealList → podium
  const [countdown, setCountdown] = useState(5);
  const [revealedCount, setRevealedCount] = useState(0);
  const [podiumStep, setPodiumStep] = useState(0); // 0 = rien, 1 = 3e, 2 = 2e, 3 = 1er
  const [flash, setFlash] = useState(false);

  // Classement global (du 1er au dernier)
  const rankingDesc = useMemo(() => {
    return Object.entries(players)
      .map(([pseudo, votes]) => ({
        pseudo,
        points: calculatePoints(votes, adminSelections),
      }))
      .sort((a, b) => b.points - a.points);
  }, [players, adminSelections]);

  const rankingAsc = useMemo(
    () => [...rankingDesc].reverse(), // du dernier au premier
    [rankingDesc]
  );

  const totalPlayers = rankingDesc.length;
  const nonTopCount = Math.max(0, totalPlayers - 3); // on révèle jusqu'au 4e

  const top3 = rankingDesc.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  // 🎬 Phase sponsor
  useEffect(() => {
    if (phase !== "sponsor") return;
    const timer = setTimeout(() => setPhase("countdown"), 4000);
    return () => clearTimeout(timer);
  }, [phase]);

  // ⏱️ Compte à rebours
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown < -1) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
      // petit flash sur chaque nombre
      if (countdown > 0) {
        setFlash(true);
        setTimeout(() => setFlash(false), 250);
      }
    }, 1000);

    if (countdown === -1) {
      // si peu de joueurs, on peut passer directement au podium
      if (nonTopCount === 0) {
        setPhase("podium");
      } else {
        setPhase("revealList");
      }
    }

    return () => clearTimeout(timer);
  }, [phase, countdown, nonTopCount]);

  // 📜 Révélation du dernier au 4ème
  useEffect(() => {
    if (phase !== "revealList") return;

    if (nonTopCount === 0) {
      setPhase("podium");
      return;
    }

    if (revealedCount >= nonTopCount) {
      const t = setTimeout(() => setPhase("podium"), 1500);
      return () => clearTimeout(t);
    }

    const interval = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= nonTopCount) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2200); // rythme adaptatif

    return () => clearInterval(interval);
  }, [phase, revealedCount, nonTopCount]);

  // 🏆 Podium : 3e -> 2e -> 1er
  useEffect(() => {
    if (phase !== "podium") return;

    setPodiumStep(0);
    // petite pause noire / tension avant de montrer le podium
    const startTimer = setTimeout(() => {
      setPodiumStep(1); // 3e
    }, 800);

    return () => clearTimeout(startTimer);
  }, [phase]);

  // Enchaînement des steps du podium
  useEffect(() => {
    if (phase !== "podium") return;

    if (podiumStep === 1) {
      const t = setTimeout(() => setPodiumStep(2), 2200);
      return () => clearTimeout(t);
    }

    if (podiumStep === 2) {
      const t = setTimeout(() => setPodiumStep(3), 2500);
      return () => clearTimeout(t);
    }
  }, [phase, podiumStep]);

  // 🎇 Confettis pour le 1er
  useEffect(() => {
    if (phase !== "podium" || podiumStep !== 3) return;

    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, [phase, podiumStep]);

  const handleQuit = () => {
    if (
      !window.confirm(
        "Quitter le show final ? Les joueurs ne verront plus le classement animé."
      )
    )
      return;
    if (updateFinaleStarted) {
      updateFinaleStarted(false);
    }
  };

  // ----------------------
  // RENDUS PHASES
  // ----------------------

  const renderSponsor = () => (
    <div style={{ animation: "sponsorFadeIn 0.7s ease-out" }}>
      <h2 style={{ fontSize: 26, marginBottom: 10 }}>
        Cette finale Miss 2026 vous est présentée par…
      </h2>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            padding: "12px 26px",
            borderRadius: 999,
            background:
              "radial-gradient(circle at top, #ffe066, #ffb300, #ff8800)",
            color: "#3b1600",
            fontWeight: "bold",
            fontSize: 26,
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            animation: "logoPop 0.9s ease-out",
          }}
        >
          <span>🍺 Malounette</span>
          <span
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            La bière qui mérite sa couronne
          </span>
        </div>
      </div>
    </div>
  );

  const renderCountdown = () => (
    <>
      <h2 style={styles.subtitle}>Préparez-vous au classement final…</h2>
      <div style={{ position: "relative", display: "inline-block" }}>
        <div style={styles.countdown}>
          {countdown > 0 ? countdown : "RÉSULTAT !!!"}
        </div>
        {flash && (
          <div
            style={{
              position: "absolute",
              inset: "-30px",
              background: "white",
              opacity: 0,
              animation: "flashScreen 0.3s ease-out",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </>
  );

  const renderRevealList = () => {
    // joueurs révélables (tous sauf le top 3)
    const revealable = rankingAsc.slice(0, nonTopCount);
    const visible = revealable.slice(0, revealedCount);

    return (
      <>
        <h2 style={styles.subtitle}>
          Du dernier joueur jusqu&apos;au 4ème…
        </h2>
        <div style={styles.listContainer}>
          {visible.map((p, index) => {
            const globalIndex = index; // index dans la liste des révélés
            const posFromEnd = globalIndex; // 0 = dernier
            const position = totalPlayers - posFromEnd; // 1 = meilleur

            const label =
              position === 1
                ? "1er"
                : position === 2
                ? "2ème"
                : position === 3
                ? "3ème"
                : `${position}ème`;

            return (
              <div
                key={p.pseudo}
                style={{
                  ...styles.row,
                  animation: "cardDrop 0.45s ease-out",
                  background:
                    position <= 4
                      ? "linear-gradient(90deg, rgba(255,215,0,0.15), rgba(0,0,0,0.7))"
                      : "rgba(0,0,0,0.65)",
                }}
              >
                <span style={styles.rowRank}>{label}</span>
                <span style={styles.rowName}>{p.pseudo}</span>
                <span style={styles.rowPoints}>{p.points} pts</span>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderPodium = () => {
    if (top3.length === 0) {
      return (
        <div style={{ marginTop: 30 }}>
          <h2 style={styles.podiumTitle}>Pas assez de joueurs 😅</h2>
          <p>Il faut au moins 1 joueur pour afficher un podium.</p>
        </div>
      );
    }

    return (
      <div style={styles.podiumWrapper}>
        <h2 style={styles.podiumTitle}>Podium final</h2>

        {first && (
          <div style={{ fontSize: 18, opacity: 0.85, marginBottom: 10 }}>
            Bravo à tous, et félicitations à{" "}
            <strong>{first.pseudo}</strong> 🏆
          </div>
        )}

        <div style={styles.podium}>
          {/* 2ème */}
          {second && (
            <div
              style={{
                ...styles.podiumCol(130, "silver"),
                opacity: podiumStep >= 2 ? 1 : 0,
                animation:
                  podiumStep === 2
                    ? "slideInLeft 0.6s ease-out"
                    : podiumStep > 2
                    ? "none"
                    : "none",
                transition: "opacity 0.3s ease-out",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 6 }}>2ème</div>
              <div style={styles.podiumName}>{second.pseudo}</div>
              <div style={styles.podiumPoints}>{second.points} pts</div>
            </div>
          )}

          {/* 1er */}
          {first && (
            <div
              style={{
                ...styles.podiumCol(170, "gold"),
                position: "relative",
                opacity: podiumStep >= 3 ? 1 : 0,
                animation:
                  podiumStep === 3
                    ? "podiumRise 0.6s ease-out"
                    : podiumStep > 3
                    ? "none"
                    : "none",
                transition: "opacity 0.3s ease-out",
              }}
            >
              {podiumStep >= 3 && (
                <div
                  style={{
                    position: "absolute",
                    inset: "-10px",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(255,215,0,0.35), transparent 60%)",
                    filter: "blur(8px)",
                    opacity: 0.8,
                    pointerEvents: "none",
                  }}
                />
              )}

              {podiumStep >= 3 && (
                <div
                  style={{
                    ...styles.crown,
                    animation: "crownDrop 0.7s ease-out",
                  }}
                >
                  👑
                </div>
              )}

              <div
                style={{
                  fontSize: 20,
                  marginBottom: 6,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                1er
              </div>

              <div
                style={{
                  ...styles.podiumName,
                  position: "relative",
                  zIndex: 1,
                  backgroundImage:
                    podiumStep >= 3
                      ? "linear-gradient(90deg, #fff7c2, #ffe066, #ffffff)"
                      : "none",
                  WebkitBackgroundClip:
                    podiumStep >= 3 ? "text" : "initial",
                  color: podiumStep >= 3 ? "transparent" : "inherit",
                  backgroundSize: "200px 100%",
                  animation:
                    podiumStep >= 3
                      ? "goldShine 2.5s linear infinite"
                      : "none",
                }}
              >
                {first.pseudo}
              </div>

              <div
                style={{
                  ...styles.podiumPoints,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {first.points} pts
              </div>
            </div>
          )}

          {/* 3ème */}
          {third && (
            <div
              style={{
                ...styles.podiumCol(110, "bronze"),
                opacity: podiumStep >= 1 ? 1 : 0,
                animation:
                  podiumStep === 1
                    ? "podiumRise 0.6s ease-out"
                    : podiumStep > 1
                    ? "none"
                    : "none",
                transition: "opacity 0.3s ease-out",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 6 }}>3ème</div>
              <div style={styles.podiumName}>{third.pseudo}</div>
              <div style={styles.podiumPoints}>{third.points} pts</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.overlay}>
      <style>{keyframes}</style>

      <div style={styles.inner}>
        {isAdmin && (
          <button style={styles.quitButton} onClick={handleQuit}>
            Quitter le show
          </button>
        )}

        <h1 style={styles.title}>Classement officiel des joueurs</h1>

        {phase === "sponsor" && renderSponsor()}
        {phase === "countdown" && renderCountdown()}
        {phase === "revealList" && renderRevealList()}
        {phase === "podium" && renderPodium()}
      </div>
    </div>
  );
}
