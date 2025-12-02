// src/components/FinaleOverlay.jsx

import React, { useEffect, useMemo, useState, useContext, useRef } from "react";
import confetti from "canvas-confetti";
import { calculatePoints } from "../services/points";
import { AppContext } from "../context/AppContext";

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9998,
    // Fond plateau TV Miss France (image + dégradé)
    backgroundImage:
      'radial-gradient(circle at top, rgba(10,10,40,0.9), rgba(0,0,0,0.98)), url("/images/plateau-missfrance.jpg")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
  inner: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    padding: 20,
    color: "white",
    fontFamily: "Poppins, Arial, sans-serif",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    textTransform: "uppercase",
    letterSpacing: 3,
    textAlign: "center",
    flex: 1,
    textShadow: "0 0 10px rgba(0,0,0,0.9)",
  },
  quitButton: {
    padding: "6px 14px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    background: "rgba(0,0,0,0.7)",
    color: "white",
    fontSize: 13,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 360px) minmax(0, 1fr)",
    gap: 20,
    flex: 1,
    alignItems: "stretch",
  },
  rankingPanel: {
    background: "rgba(0,0,0,0.65)",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 0 20px rgba(0,0,0,0.8)",
    border: "1px solid rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  rankingTitle: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: "center",
  },
  rankingList: {
    maxHeight: "100%",
    overflowY: "auto",
    paddingRight: 4,
  },
  rankingRow: (highlight) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 8px",
    marginBottom: 4,
    borderRadius: 8,
    background: highlight
      ? "linear-gradient(90deg, rgba(255,215,0,0.3), rgba(0,0,0,0.8))"
      : "rgba(0,0,0,0.45)",
    fontSize: 14,
    transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
    transform: highlight ? "scale(1.02)" : "scale(1)",
    boxShadow: highlight
      ? "0 0 14px rgba(255,215,0,0.6)"
      : "0 0 6px rgba(0,0,0,0.7)",
  }),
  rankingPos: {
    width: 30,
    fontWeight: "bold",
    opacity: 0.9,
  },
  rankingName: {
    flex: 1,
    textAlign: "left",
    paddingLeft: 6,
  },
  rankingPoints: {
    width: 60,
    textAlign: "right",
    opacity: 0.85,
  },
  stage: {
    position: "relative",
    background: "linear-gradient(160deg, rgba(10,10,30,0.95), rgba(5,5,15,0.98))",
    borderRadius: 20,
    boxShadow: "0 0 28px rgba(0,0,0,0.9)",
    border: "1px solid rgba(255,255,255,0.15)",
    padding: 20,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  stageTopText: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 10,
  },
  centerName: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 34,
    fontWeight: "bold",
    textShadow:
      "0 0 12px rgba(0,0,0,1), 0 0 24px rgba(0,0,0,1), 0 0 30px rgba(255,215,0,0.9)",
  },
  centerSub: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 6,
    opacity: 0.85,
  },
  countdownBig: {
    textAlign: "center",
    fontSize: 80,
    fontWeight: "bold",
    marginTop: 40,
    textShadow:
      "0 0 16px rgba(0,0,0,1), 0 0 40px rgba(255,215,0,0.9)",
  },
  top5Wrapper: {
    marginTop: 16,
  },
  top5Title: {
    textAlign: "center",
    fontSize: 20,
    marginBottom: 10,
  },
  top5Grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 10,
  },
  top5Card: (isWinner) => ({
    position: "relative",
    background: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    padding: "10px 8px",
    textAlign: "center",
    border: isWinner
      ? "2px solid rgba(255,215,0,0.9)"
      : "1px solid rgba(255,255,255,0.15)",
    boxShadow: isWinner
      ? "0 0 18px rgba(255,215,0,0.8)"
      : "0 0 10px rgba(0,0,0,0.8)",
    transform: isWinner ? "scale(1.04)" : "scale(1)",
    transition: "transform 0.25s, box-shadow 0.25s, border 0.25s",
  }),
  top5Pos: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  top5Name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  crown: {
    position: "absolute",
    top: -18,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 22,
    textShadow: "0 0 10px rgba(255,215,0,0.9)",
  },
  winnerBadge: {
    marginTop: 30,
    textAlign: "center",
  },
  winnerCircle: {
    position: "relative",
    margin: "0 auto",
    width: 200,
    height: 200,
    borderRadius: "50%",
    background:
      "radial-gradient(circle at center, #ffffff, #ffe8a3, #ffb347, #c27c2c)",
    boxShadow:
      "0 0 30px rgba(255,215,0,0.9), 0 0 70px rgba(255,255,255,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    animation: "winnerGlow 2.5s ease-in-out infinite",
  },
  winnerName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#3b1a00",
    textAlign: "center",
    padding: "0 10px",
    textShadow: "0 0 5px rgba(255,255,255,0.8)",
  },
  winnerCrown: {
    position: "absolute",
    top: -40,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 40,
    filter: "drop-shadow(0 0 10px rgba(255,215,0,1))",
  },
  winnerRibbon: {
    position: "absolute",
    bottom: -8,
    left: "50%",
    transform: "translateX(-50%) rotate(-3deg)",
    background:
      "linear-gradient(90deg, #001f54, #004aad, #d5006d, #ffcc00)",
    color: "white",
    padding: "4px 18px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    boxShadow: "0 0 10px rgba(0,0,0,0.8)",
  },
};

const introKeyframes = `
@keyframes textFlyIn {
  0% { transform: translate3d(0, 80px, -400px) scale(0.6) rotateX(40deg); opacity: 0; }
  60% { transform: translate3d(0, 0, 0) scale(1.05) rotateX(0); opacity: 1; }
  100% { transform: translate3d(0, 0, 0) scale(1) rotateX(0); opacity: 1; }
}
@keyframes nameFromFar {
  0% { transform: translate3d(0, 100px, -500px) scale(0.4) rotateX(45deg); opacity: 0; }
  60% { transform: translate3d(0, -4px, 0) scale(1.1) rotateX(0); opacity: 1; }
  100% { transform: translate3d(0, 0, 0) scale(1) rotateX(0); opacity: 1; }
}
@keyframes spotlights {
  0% { opacity: 0.3; transform: rotate(-12deg); }
  50% { opacity: 0.9; transform: rotate(8deg); }
  100% { opacity: 0.3; transform: rotate(-12deg); }
}
@keyframes winnerGlow {
  0% { box-shadow: 0 0 15px rgba(255,215,0,0.5), 0 0 40px rgba(255,255,255,0.3); }
  50% { box-shadow: 0 0 35px rgba(255,215,0,1), 0 0 80px rgba(255,255,255,0.8); }
  100% { box-shadow: 0 0 15px rgba(255,215,0,0.5), 0 0 40px rgba(255,255,255,0.3); }
}
@keyframes pulseCountdown {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
`;

export default function FinaleOverlay({ players, adminSelections, isAdmin }) {
  const { updateFinaleStarted } = useContext(AppContext) || {};

  const [phase, setPhase] = useState("intro"); // intro → bottom → top5 → dauphines → winner
  const [countdown, setCountdown] = useState(5);

  const [centerName, setCenterName] = useState("");
  const [revealedRanks, setRevealedRanks] = useState({});
  const [bottomIndex, setBottomIndex] = useState(0);

  const [currentDauphineStep, setCurrentDauphineStep] = useState(0);
  const [showDauphineName, setShowDauphineName] = useState(false);

  const confettiDoneRef = useRef(false);

  // Classement complet (du 1er au dernier)
  const rankingDesc = useMemo(() => {
    return Object.entries(players || {})
      .map(([pseudo, votes]) => ({
        pseudo,
        points: calculatePoints(votes, adminSelections),
      }))
      .sort((a, b) => b.points - a.points);
  }, [players, adminSelections]);

  const totalPlayers = rankingDesc.length;
  const top5 = rankingDesc.slice(0, 5);

  // Positions à révéler du dernier jusqu'au 6ème
  const bottomPositions = useMemo(() => {
    if (totalPlayers <= 5) return [];
    const arr = [];
    for (let p = totalPlayers; p >= 6; p--) {
      arr.push(p);
    }
    return arr;
  }, [totalPlayers]);

  // Config des dauphines (positions dans le classement global)
  const dauphineConfig = [
    { label: "4ème dauphine", position: 5 },
    { label: "3ème dauphine", position: 4 },
    { label: "2ème dauphine", position: 3 },
    { label: "1ère dauphine", position: 2 },
  ];

  // INTRO : compte à rebours
  useEffect(() => {
    if (phase !== "intro") return;
    if (countdown < -1) return;

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // Passage automatique à la phase suivante après le compte à rebours
  useEffect(() => {
    if (phase !== "intro") return;
    if (countdown === -1) {
      const timer = setTimeout(() => {
        if (totalPlayers === 0) {
          setPhase("winner");
        } else if (totalPlayers > 5) {
          setPhase("bottom");
        } else {
          setPhase("top5");
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [phase, countdown, totalPlayers]);

  // PHASE BOTTOM : du dernier au 6ème
  useEffect(() => {
    if (phase !== "bottom") return;

    // Tous révélés → on passe au top5
    if (bottomIndex >= bottomPositions.length) {
      const timer = setTimeout(() => {
        setCenterName("");
        setPhase("top5");
      }, 1500);
      return () => clearTimeout(timer);
    }

    const position = bottomPositions[bottomIndex];
    const player = rankingDesc[position - 1];

    if (!player) return;

    // On met le nom au centre avec animation
    setCenterName(player.pseudo);
    setRevealedRanks((prev) => ({
      ...prev,
      [position]: true,
    }));

    const timer = setTimeout(() => {
      setBottomIndex((i) => i + 1);
    }, 3000); // ~3 seconds par joueur

    return () => clearTimeout(timer);
  }, [phase, bottomIndex, bottomPositions, rankingDesc]);

  // PHASE TOP 5 : affichage groupé, petite pause avant les dauphines
  useEffect(() => {
    if (phase !== "top5") return;
    const timer = setTimeout(() => {
      setCenterName("");
      setPhase("dauphines");
    }, 3500);
    return () => clearTimeout(timer);
  }, [phase]);

  // PHASE DAUPHINES
  useEffect(() => {
    if (phase !== "dauphines") return;

    if (currentDauphineStep >= dauphineConfig.length) {
      // Toutes les dauphines ont été révélées → winner
      const timer = setTimeout(() => {
        setPhase("winner");
      }, 2500);
      return () => clearTimeout(timer);
    }

    setShowDauphineName(false);
    setCenterName("");

    const showTimer = setTimeout(() => {
      const step = dauphineConfig[currentDauphineStep];
      const player = rankingDesc[step.position - 1];
      if (player) {
        setCenterName(player.pseudo);
        setShowDauphineName(true);
        setRevealedRanks((prev) => ({
          ...prev,
          [step.position]: true,
        }));
      }
    }, 3000); // 3 sec de suspense

    const nextTimer = setTimeout(() => {
      setCurrentDauphineStep((s) => s + 1);
    }, 7000); // 3s suspense + 4s affichage

    return () => {
      clearTimeout(showTimer);
      clearTimeout(nextTimer);
    };
  }, [phase, currentDauphineStep, dauphineConfig, rankingDesc]);

  // PHASE WINNER : couronnement
  useEffect(() => {
    if (phase !== "winner") return;
    const winner = rankingDesc[0];
    if (winner) {
      setCenterName(winner.pseudo);
      setRevealedRanks((prev) => ({
        ...prev,
        1: true,
      }));
    }

    if (confettiDoneRef.current) return;
    confettiDoneRef.current = true;

    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 75,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 75,
        origin: { x: 1 },
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, [phase, rankingDesc]);

  const handleQuit = () => {
    if (
      !window.confirm(
        "Quitter le show final ? Les joueurs ne verront plus l’animation."
      )
    )
      return;

    if (updateFinaleStarted) {
      updateFinaleStarted(false);
    }
  };

  const renderIntro = () => (
    <>
      <div
        style={{
          fontSize: 22,
          textAlign: "center",
          marginTop: 25,
          animation: "textFlyIn 0.9s ease-out",
        }}
      >
        Miss France est élue…
        <br />
        <span style={{ fontSize: 18, opacity: 0.9 }}>
          mais pour nous… qui a gagné Miss Prono 2026 ?
        </span>
      </div>

      <div style={styles.countdownBig}>
        {countdown > 0 ? (
          <span style={{ animation: "pulseCountdown 0.9s ease-out" }}>
            {countdown}
          </span>
        ) : (
          <span style={{ fontSize: 40 }}>RÉSULTAT !!!</span>
        )}
      </div>
    </>
  );

  const renderStageTopText = () => {
    if (phase === "bottom") {
      const pos =
        bottomIndex < bottomPositions.length
          ? bottomPositions[bottomIndex]
          : null;

      if (pos) {
        return (
          <div style={styles.stageTopText}>
            Classement en cours…{" "}
            <span style={{ opacity: 0.85 }}>
              place <b>{pos}ème</b> en révélation
            </span>
          </div>
        );
      }
      return (
        <div style={styles.stageTopText}>
          Préparation du <b>TOP 5</b>…
        </div>
      );
    }

    if (phase === "top5") {
      return (
        <div style={styles.stageTopText}>
          Voici les <b>5 meilleurs pronostiqueurs</b> de Miss 2026 !
        </div>
      );
    }

    if (phase === "dauphines") {
      const stepCfg = dauphineConfig[currentDauphineStep];
      if (!stepCfg) return null;
      return (
        <div style={styles.stageTopText}>
          <span style={{ fontSize: 20 }}>
            {stepCfg.label}…
          </span>
          {!showDauphineName && (
            <span style={{ opacity: 0.8, marginLeft: 6 }}>
              Suspense…
            </span>
          )}
        </div>
      );
    }

    if (phase === "winner") {
      return (
        <div style={styles.stageTopText}>
          Et notre grande gagnante…
          <br />
          <span style={{ fontSize: 16, opacity: 0.85 }}>
            Miss Prono 2026 est…
          </span>
        </div>
      );
    }

    return null;
  };

  const renderCenterName = () => {
    if (!centerName) return null;

    return (
      <div
        style={{
          ...styles.centerName,
          animation: "nameFromFar 0.8s ease-out",
        }}
      >
        {centerName}
      </div>
    );
  };

  const renderTop5Block = () => {
    if (top5.length === 0) return null;

    const winnerName = rankingDesc[0]?.pseudo;

    return (
      <div style={styles.top5Wrapper}>
        <div style={styles.top5Title}>TOP 5 Miss Prono 2026</div>
        <div style={styles.top5Grid}>
          {top5.map((p, idx) => {
            const position = idx + 1;
            const isWinner = position === 1 && phase === "winner";
            const label =
              position === 1
                ? "Miss Prono 2026"
                : position === 2
                ? "1ère dauphine"
                : position === 3
                ? "2ème dauphine"
                : position === 4
                ? "3ème dauphine"
                : "4ème dauphine";

            return (
              <div key={p.pseudo} style={styles.top5Card(isWinner)}>
                {isWinner && <div style={styles.crown}>👑</div>}
                <div style={styles.top5Pos}>{label}</div>
                <div style={styles.top5Name}>{p.pseudo}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWinnerBadge = () => {
    if (phase !== "winner") return null;
    const winner = rankingDesc[0];
    if (!winner) return null;

    return (
      <div style={styles.winnerBadge}>
        <div style={styles.winnerCircle}>
          <div style={styles.winnerCrown}>👑</div>
          <div style={styles.winnerName}>{winner.pseudo}</div>
          <div style={styles.winnerRibbon}>Miss Prono 2026</div>
        </div>
      </div>
    );
  };

  const renderRankingList = () => {
    if (totalPlayers === 0) {
      return (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          Aucun joueur pour le moment.
        </div>
      );
    }

    return (
      <div style={styles.rankingList}>
        {rankingDesc.map((p, index) => {
          const position = index + 1;
          const revealed = !!revealedRanks[position];
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
              style={styles.rankingRow(revealed && position <= 5)}
            >
              <div style={styles.rankingPos}>{label}</div>
              <div style={styles.rankingName}>
                {revealed ? p.pseudo : "???"}
              </div>
              <div style={styles.rankingPoints}>
                {revealed ? `${p.points} pts` : ""}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStageContent = () => {
    if (phase === "intro") {
      return renderIntro();
    }

    return (
      <>
        {renderStageTopText()}
        {renderCenterName()}
        {renderTop5Block()}
        {renderWinnerBadge()}
      </>
    );
  };

  return (
    <>
      <style>{introKeyframes}</style>
      <div style={styles.overlay} />
      <div style={styles.inner}>
        <div style={styles.topBar}>
          {isAdmin ? (
            <button style={styles.quitButton} onClick={handleQuit}>
              Quitter le show
            </button>
          ) : (
            <div style={{ width: 120 }} />
          )}

          <div style={styles.title}>
            CLASSEMENT OFFICIEL — MISS PRONO 2026
          </div>

          <div style={{ width: 120 }} />
        </div>

        <div style={styles.main}>
          {/* PANNEAU CLASSEMENT */}
          <div style={styles.rankingPanel}>
            <div style={styles.rankingTitle}>Classement des joueurs</div>
            {renderRankingList()}
          </div>

          {/* SCÈNE CENTRALE */}
          <div style={styles.stage}>
            {/* Décor spotlights légers */}
            <div
              style={{
                position: "absolute",
                inset: -80,
                pointerEvents: "none",
                background:
                  "radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 60%)",
                mixBlendMode: "screen",
                opacity: 0.7,
                animation: "spotlights 8s ease-in-out infinite",
              }}
            />
            <div style={{ position: "relative", zIndex: 2 }}>
              {renderStageContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
