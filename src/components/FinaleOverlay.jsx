// src/components/FinaleOverlay.jsx

import React, { useEffect, useMemo, useState, useContext } from "react";
import confetti from "canvas-confetti";
import { calculatePoints } from "../services/points";
import { AppContext } from "../context/AppContext";

// -----------------------
// STYLES DE BASE
// -----------------------
const baseStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background:
      "radial-gradient(circle at top, #150817 0, #05030a 40%, #000 100%)",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  inner: {
    maxWidth: 1000,
    width: "100%",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
    boxShadow: "0 0 40px rgba(0,0,0,0.9)",
    background:
      "radial-gradient(circle at top, rgba(255,255,255,0.04), rgba(0,0,0,0.9))",
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.8,
    marginBottom: 12,
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

// PHASES : countdown -> list -> podium
const PHASES = {
  COUNTDOWN: "countdown",
  LIST_REVEAL: "list-reveal",
  PODIUM: "podium",
};

const COUNTDOWN_START = 5;

export default function FinaleOverlay({ players, adminSelections, isAdmin }) {
  const { updateFinaleStarted } = useContext(AppContext) || {};
  const [phase, setPhase] = useState(PHASES.COUNTDOWN);
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [podiumStep, setPodiumStep] = useState(0); // 0 = pas encore / 1 = 3e / 2 = 2e / 3 = 1er

  // -----------------------
  // CLASSEMENT COMPLET
  // -----------------------
  const rankingDesc = useMemo(() => {
    return Object.entries(players)
      .map(([pseudo, votes]) => ({
        pseudo,
        points: calculatePoints(votes, adminSelections),
      }))
      .sort((a, b) => b.points - a.points);
  }, [players, adminSelections]);

  const rankingAsc = useMemo(
    () => [...rankingDesc].reverse(), // dernier -> premier
    [rankingDesc]
  );

  // joueurs du dernier jusqu'au 4e (on retire le top 3)
  const nonTop3Asc = useMemo(() => {
    if (rankingDesc.length <= 3) return [];
    const nbNonTop3 = rankingDesc.length - 3;
    return rankingAsc.slice(0, nbNonTop3); // du dernier jusqu'au 4e
  }, [rankingAsc, rankingDesc.length]);

  const top3 = rankingDesc.slice(0, 3); // [1er, 2e, 3e]

  // -----------------------
  // COMPTE À REBOURS
  // -----------------------
  useEffect(() => {
    if (phase !== PHASES.COUNTDOWN) return;

    if (countdown < -1) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    if (countdown === 0) {
      // lancement ouverture rideaux + passage à la phase liste
      setCurtainsOpen(true);
      setTimeout(() => {
        setPhase(PHASES.LIST_REVEAL);
      }, 1700); // laisse le temps aux rideaux de s'ouvrir
    }

    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // -----------------------
  // RÉVÉLATION PROGRESSIVE LISTE (dernier -> 4e)
  // -----------------------
  useEffect(() => {
    if (phase !== PHASES.LIST_REVEAL) return;

    if (nonTop3Asc.length === 0) {
      // s'il n'y a pas de joueurs à révéler en liste
      setPhase(PHASES.PODIUM);
      return;
    }

    if (revealedCount >= nonTop3Asc.length) {
      // tout le monde est révélé -> on passe au podium
      const t = setTimeout(() => setPhase(PHASES.PODIUM), 1500);
      return () => clearTimeout(t);
    }

    const interval = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= nonTop3Asc.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 4000); // 4 secondes entre chaque joueur

    return () => clearInterval(interval);
  }, [phase, revealedCount, nonTop3Asc.length]);

  // -----------------------
  // PODIUM : 3e -> 2e -> 1er
  // -----------------------
  useEffect(() => {
    if (phase !== PHASES.PODIUM) return;
    if (!top3.length) return;

    setPodiumStep(0);

    // 3ème
    const t1 = setTimeout(() => {
      setPodiumStep(1);
    }, 500);

    // 2ème
    const t2 = setTimeout(() => {
      setPodiumStep(2);
    }, 3500);

    // 1er + confettis
    const t3 = setTimeout(() => {
      setPodiumStep(3);

      const duration = 2500;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#ff4da6", "#ffd700", "#ffffff"],
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#ff4da6", "#ffd700", "#ffffff"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }, 7000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase, top3.length]);

  // -----------------------
  // QUITTER LE SHOW
  // -----------------------
  const handleQuit = () => {
    if (
      !window.confirm(
        "Quitter le show final ? Les joueurs ne verront plus l'animation."
      )
    )
      return;

    if (updateFinaleStarted) updateFinaleStarted(false);
  };

  // -----------------------
  // AFFICHAGES PAR PHASE
  // -----------------------

  const renderCountdown = () => {
    const text =
      countdown > 0 ? countdown : countdown === 0 ? "RÉSULTAT !!!" : "";

    return (
      <div className="fo-countdown-wrapper">
        {text && (
          <div
            key={text} // pour relancer l'anim à chaque changement
            className="fo-countdown-number fo-neon"
          >
            {text}
          </div>
        )}
      </div>
    );
  };

  const renderListReveal = () => {
    const revealedPlayers = nonTop3Asc.slice(0, revealedCount);

    return (
      <div className="fo-list-wrapper">
        <div className="fo-list-subtitle">
          Du dernier au 4ᵉ, place par place…
        </div>

        <div className="fo-list-scroll">
          {revealedPlayers.map((p, index) => {
            // position globale (1 = meilleur)
            const position = rankingDesc.length - (nonTop3Asc.length - index);
            const label = `${position}ᵉ`;

            return (
              <div
                key={p.pseudo}
                className="fo-list-row fo-list-row-neon"
              >
                <span className="fo-list-rank">{label}</span>
                <span className="fo-list-name fo-neon-text">
                  {p.pseudo}
                </span>
                <span className="fo-list-points">{p.points} pts</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPodium = () => {
    if (!top3.length) {
      return (
        <div style={{ marginTop: 30, fontSize: 18 }}>
          Pas assez de joueurs pour afficher un podium.
        </div>
      );
    }

    const [first, second, third] = top3;

    const showThird = podiumStep >= 1 && third;
    const showSecond = podiumStep >= 2 && second;
    const showFirst = podiumStep >= 3 && first;

    return (
      <div className="fo-podium-wrapper">
        <div className="fo-podium-title">Podium final</div>
        <div className="fo-podium-subtitle">
          Bravo à tous, et félicitations à{" "}
          {first && <span className="fo-neon-text">{first.pseudo}</span>} !
        </div>

        {/* FLASH PAPARAZZI pour top 2 & 1 */}
        {podiumStep >= 2 && (
          <div className="fo-paparazzi-layer fo-paparazzi-on" />
        )}

        <div className="fo-podium">
          {/* 2ème */}
          <div className="fo-podium-col fo-podium-col-2">
            {showSecond && (
              <div className="fo-podium-content fo-podium-content-2">
                <div className="fo-medal">2ᵉ</div>
                <div className="fo-podium-name fo-neon-text">
                  {second.pseudo}
                </div>
                <div className="fo-podium-points">
                  {second.points} pts
                </div>
              </div>
            )}
          </div>

          {/* 1er */}
          <div className="fo-podium-col fo-podium-col-1">
            {showFirst && (
              <div className="fo-podium-content fo-podium-content-1">
                <div className="fo-crown">👑</div>
                <div className="fo-medal fo-medal-gold">1er</div>
                <div className="fo-podium-name fo-neon-text">
                  {first.pseudo}
                </div>
                <div className="fo-podium-points">
                  {first.points} pts
                </div>
              </div>
            )}
          </div>

          {/* 3ème */}
          <div className="fo-podium-col fo-podium-col-3">
            {showThird && (
              <div className="fo-podium-content fo-podium-content-3">
                <div className="fo-medal">3ᵉ</div>
                <div className="fo-podium-name fo-neon-text">
                  {third.pseudo}
                </div>
                <div className="fo-podium-points">
                  {third.points} pts
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={baseStyles.overlay}>
      {/* KEYFRAMES & CSS LOCAL POUR LE SHOW */}
      <style>
        {`
          /* ------ Rideaux rouges ------ */
          .fo-stage {
            position: relative;
            overflow: hidden;
            border-radius: 20px;
            min-height: 520px;
            padding: 50px 20px 30px;
          }

          .fo-curtains {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 20;
            display: flex;
            justify-content: space-between;
          }

          .fo-curtain {
            width: 52%;
            background: radial-gradient(circle at top, #ff4d4d 0, #b30000 45%, #4d0000 100%);
            box-shadow: 0 0 25px rgba(0,0,0,0.9);
            transition: transform 1.6s ease-in-out;
          }
          .fo-curtain-left {
            border-radius: 0 40px 0 0;
            transform: translateX(0);
          }
          .fo-curtain-right {
            border-radius: 40px 0 0 0;
            transform: translateX(0);
          }
          .fo-curtains-open .fo-curtain-left {
            transform: translateX(-110%);
          }
          .fo-curtains-open .fo-curtain-right {
            transform: translateX(110%);
          }

          /* Petits plis verticals */
          .fo-curtain::before {
            content: "";
            position: absolute;
            inset: 0;
            background-image: repeating-linear-gradient(
              90deg,
              rgba(0,0,0,0.35) 0px,
              rgba(0,0,0,0.35) 8px,
              rgba(255,255,255,0.08) 8px,
              rgba(255,255,255,0.08) 12px
            );
            mix-blend-mode: multiply;
            opacity: 0.35;
          }

          /* ------ Décor de scène ------ */
          .fo-stage-bg {
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at top, rgba(255,255,255,0.08) 0, transparent 40%),
              radial-gradient(circle at bottom, rgba(255,77,166,0.26) 0, transparent 50%),
              radial-gradient(circle at center, #050010 0, #020006 55%, #000 100%);
            z-index: 1;
          }

          .fo-spotlight {
            position: absolute;
            width: 160%;
            height: 160%;
            top: -20%;
            left: -30%;
            background: conic-gradient(
              from 180deg,
              rgba(255,77,166,0.0),
              rgba(255,77,166,0.3),
              rgba(153,102,255,0.0),
              rgba(153,102,255,0.35),
              rgba(255,77,166,0.0)
            );
            mix-blend-mode: screen;
            opacity: 0.85;
            filter: blur(2px);
            animation: foSpotRotate 16s linear infinite;
          }

          .fo-ground-halo {
            position: absolute;
            width: 70%;
            height: 140px;
            left: 15%;
            bottom: 10px;
            background: radial-gradient(ellipse at center, rgba(255,77,166,0.6), transparent 65%);
            filter: blur(6px);
            opacity: 0.8;
          }

          @keyframes foSpotRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* ------ Compte à rebours ------ */
          .fo-countdown-wrapper {
            position: relative;
            z-index: 15;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
          }

          .fo-countdown-number {
            font-size: 90px;
            font-weight: 900;
            letter-spacing: 4px;
            animation: foCountdownPop 0.7s ease-out;
          }

          @keyframes foCountdownPop {
            0% { transform: scale(0.3); opacity: 0; }
            45% { transform: scale(1.4); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }

          /* ------ Neon pink glow ------ */
          .fo-neon {
            color: #ffffff;
            text-shadow:
              0 0 8px rgba(255,77,166,0.9),
              0 0 18px rgba(255,77,166,0.9),
              0 0 32px rgba(255,0,133,0.9);
          }

          .fo-neon-text {
            color: #ffffff;
            text-shadow:
              0 0 4px rgba(255,255,255,0.9),
              0 0 8px rgba(255,77,166,1),
              0 0 16px rgba(255,0,140,1),
              0 0 34px rgba(255,0,140,0.9);
            animation: foNeonPulse 2.6s ease-in-out infinite;
          }

          @keyframes foNeonPulse {
            0%, 100% { text-shadow:
              0 0 4px rgba(255,255,255,0.9),
              0 0 8px rgba(255,77,166,0.9),
              0 0 18px rgba(255,0,140,0.9);
            }
            50% { text-shadow:
              0 0 6px rgba(255,255,255,1),
              0 0 14px rgba(255,140,200,1),
              0 0 30px rgba(255,0,160,1);
            }
          }

          /* ------ Liste classement (dernier -> 4e) ------ */
          .fo-list-wrapper {
            position: relative;
            z-index: 10;
            margin-top: 10px;
          }

          .fo-list-subtitle {
            font-size: 18px;
            opacity: 0.9;
            margin-bottom: 12px;
          }

          .fo-list-scroll {
            max-height: 260px;
            overflow-y: auto;
            padding: 0 12px 4px;
          }

          .fo-list-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            margin-bottom: 6px;
            border-radius: 999px;
            background: linear-gradient(
              90deg,
              rgba(10,0,20,0.85),
              rgba(40,0,60,0.9),
              rgba(10,0,20,0.85)
            );
            box-shadow: 0 0 12px rgba(0,0,0,0.8);
            animation: foRowIn 0.5s ease-out;
          }

          .fo-list-row-neon {
            border: 1px solid rgba(255,77,166,0.7);
          }

          .fo-list-rank {
            font-weight: 700;
            margin-right: 10px;
            min-width: 52px;
            text-align: left;
          }

          .fo-list-name {
            flex: 1;
            text-align: left;
            font-size: 18px;
          }

          .fo-list-points {
            min-width: 80px;
            text-align: right;
            font-weight: 600;
            opacity: 0.9;
          }

          @keyframes foRowIn {
            from { transform: translateY(16px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          /* ------ Podium coupe du monde ------ */
          .fo-podium-wrapper {
            position: relative;
            zIndex: 10;
            margin-top: 20px;
            padding: 10px 10px 20px;
          }

          .fo-podium-title {
            font-size: 24px;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }

          .fo-podium-subtitle {
            font-size: 16px;
            opacity: 0.9;
          }

          .fo-podium {
            display: flex;
            justify-content: center;
            align-items: flex-end;
            gap: 16px;
            margin-top: 26px;
          }

          .fo-podium-col {
            position: relative;
            width: 140px;
            border-radius: 18px 18px 0 0;
            background: linear-gradient(180deg, #444, #111);
            box-shadow: 0 0 16px rgba(0,0,0,0.9);
            overflow: hidden;
          }

          .fo-podium-col-1 {
            height: 200px;
            background: linear-gradient(180deg, #ffd700, #b8860b);
            box-shadow: 0 0 30px rgba(255,215,0,0.8);
            animation: foPodiumRise 0.9s ease-out forwards;
          }

          .fo-podium-col-2 {
            height: 170px;
            background: linear-gradient(180deg, #e0e0e0, #888);
            animation: foPodiumRise 0.9s ease-out forwards;
          }

          .fo-podium-col-3 {
            height: 150px;
            background: linear-gradient(180deg, #cd7f32, #7a4b1e);
            animation: foPodiumRise 0.9s ease-out forwards;
          }

          @keyframes foPodiumRise {
            from { transform: translateY(80px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          .fo-podium-content {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            padding: 14px 8px;
          }

          .fo-podium-content-1 {
            animation: foWinnerPulse 1.8s ease-in-out infinite;
          }

          .fo-medal {
            font-weight: 800;
            margin-bottom: 4px;
          }

          .fo-medal-gold {
            text-shadow: 0 0 8px rgba(255,215,0,0.9);
          }

          .fo-podium-name {
            font-size: 18px;
            margin-bottom: 4px;
          }

          .fo-podium-points {
            font-size: 14px;
            opacity: 0.9;
          }

          .fo-crown {
            position: absolute;
            top: -32px;
            font-size: 32px;
            animation: foCrownDrop 1s ease-out forwards;
            filter: drop-shadow(0 0 8px rgba(255,215,0,1));
          }

          @keyframes foCrownDrop {
            0% { transform: translateY(-40px) scale(0.4); opacity: 0; }
            60% { transform: translateY(4px) scale(1.1); opacity: 1; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }

          @keyframes foWinnerPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.03); }
          }

          /* ------ Paparazzi flashes ------ */
          .fo-paparazzi-layer {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 5;
            opacity: 0;
          }

          .fo-paparazzi-on {
            animation: foPaparazziFlashes 2.8s linear infinite;
          }

          @keyframes foPaparazziFlashes {
            0%, 8%, 16%, 100% { opacity: 0; }
            4%, 12% { opacity: 0.9; background: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.9), transparent 55%); }
            20% { opacity: 0.8; background: radial-gradient(circle at 70% 35%, rgba(255,255,255,0.85), transparent 55%); }
            40% { opacity: 0.7; background: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.8), transparent 55%); }
            60% { opacity: 0.65; background: radial-gradient(circle at 80% 80%, rgba(255,255,255,0.75), transparent 55%); }
          }
        `}
      </style>

      <div style={baseStyles.inner}>
        {isAdmin && (
          <button style={baseStyles.quitButton} onClick={handleQuit}>
            Quitter le show
          </button>
        )}

        <h1 style={baseStyles.title}>Classement officiel des joueurs</h1>
        <div style={baseStyles.subtitle}>
          Miss 2026 — présenté par la bière Malounette 🍺
        </div>

        <div className="fo-stage">
          {/* Décor de scène */}
          <div className="fo-stage-bg" />
          <div className="fo-spotlight" />
          <div className="fo-ground-halo" />

          {/* Phases de contenu */}
          {phase === PHASES.COUNTDOWN && renderCountdown()}
          {phase === PHASES.LIST_REVEAL && renderListReveal()}
          {phase === PHASES.PODIUM && renderPodium()}

          {/* Rideaux */}
          <div
            className={
              "fo-curtains " + (curtainsOpen ? "fo-curtains-open" : "")
            }
          >
            <div className="fo-curtain fo-curtain-left" />
            <div className="fo-curtain fo-curtain-right" />
          </div>
        </div>
      </div>
    </div>
  );
}
