// src/services/points.js

// Normalise les données Firebase (tableau ou objets {0:"Miss1"} )
const norm = (d) => {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return Object.values(d).map((v) => Number(v));
};

/**
 * 🎯 NOUVEAU SYSTÈME DE POINTS (validé)
 *
 * TOUR 1 :
 *    +5 points par bonne miss
 *
 * TOUR 2 :
 *    VERT  = bonne T1 + bonne T2 = +10 pts
 *    JAUNE = bonne T2 seulement  = +5 pts
 *
 * FINALE (place admin) :
 *
 *         ┌───────────────┬───────────┬─────────┬───────────┐
 *         │   Couleur     │  Verte    │  Jaune  │  Neutre   │
 * ┌───────┼───────────────┼───────────┼─────────┼───────────┤
 * │ 1ère  │ Miss France   │   20 pts  │  10 pts │    5 pts  │
 * │ 2ème  │ 1ère dauph.   │   12 pts  │   6 pts │    4 pts  │
 * │ 3ème  │ 2ème dauph.   │   10 pts  │   5 pts │    3 pts  │
 * │ 4-5e  │ 3-4e dauph.   │    6 pts  │   3 pts │    2 pts  │
 * └───────┴───────────────┴───────────┴─────────┴───────────┘
 */

export function calculatePoints(playerVotes, adminSelections) {
  // Normalisation des données
  const t1P = norm(playerVotes.tour1);
  const t2P = norm(playerVotes.tour2);
  const t3P = norm(playerVotes.tour3);

  const t1A = norm(adminSelections.tour1);
  const t2A = norm(adminSelections.tour2);
  const t3A = norm(adminSelections.tour3);

  let total = 0;

  // ----------------------------------------------------------
  // 🔵 TOUR 1 — +3 pts par bonne miss
  // ----------------------------------------------------------
  t1P.forEach((miss) => {
    if (t1A.includes(miss)) total += 3;
  });

  // ----------------------------------------------------------
  // 🟩 TOUR 2 — +6 pts (verte) / +3 pts (jaune)
  // ----------------------------------------------------------
  t2P.forEach((miss) => {
    if (!t2A.includes(miss)) return; // mauvaise au T2 → 0

    const isGreen = t1P.includes(miss) && t1A.includes(miss); // bonne T1 + T2

    if (isGreen) total += 6;
    else total += 3; // jaune
  });

  // ----------------------------------------------------------
  // 🟪 FINALE — comparaison rang par rang
  // ----------------------------------------------------------
  if (t3P.length === 5 && t3A.length === 5) {
    t3P.forEach((miss, index) => {
      const adminRank = t3A.indexOf(miss) + 1;

      if (adminRank <= 0) return; // pas dans le top 5 admin

      const green = t1P.includes(miss) && t1A.includes(miss);
      const yellow = t2P.includes(miss) && t2A.includes(miss) && !green;

      // Détermine la couleur
      const color = green ? "green" : yellow ? "yellow" : "neutral";

      // Points selon la place
      const pointsTable = {
        1: { green: 20, yellow: 8, neutral: 4 },
        2: { green: 12, yellow: 6, neutral: 3 },
        3: { green: 10, yellow: 5, neutral: 2 },
        4: { green: 6, yellow: 3, neutral: 1 },
        5: { green: 6, yellow: 3, neutral: 1 },
      };

      total += pointsTable[adminRank][color];
    });
  }

  return total;
}
