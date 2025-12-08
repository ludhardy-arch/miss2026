// src/context/AppContext.jsx

import React, { createContext, useEffect, useState } from "react";
import { database } from "../firebase";
import { ref, onValue, set, update, remove } from "firebase/database";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [players, setPlayers] = useState({});
  const [adminSelections, setAdminSelections] = useState({
    tour1: [],
    tour2: [],
    tour3: [],
  });
  const [votesOpen, setVotesOpen] = useState(false);
  const [tour, setTour] = useState(1);
  const [finaleStarted, setFinaleStarted] = useState(false);

  const roomRef = ref(database, "rooms/miss2026");

  // -----------------------------------------
  // INIT ROOM (si vide)
  // -----------------------------------------
  useEffect(() => {
    onValue(
      roomRef,
      (snap) => {
        if (snap.exists()) return;
        set(roomRef, {
          players: {},
          adminSelections: { tour1: [], tour2: [], tour3: [] },
          votesOpen: false,
          tour: 1,
          finaleStarted: false,
        });
      },
      { onlyOnce: true }
    );
  }, []);

  // -----------------------------------------
  // SYNC PLAYERS
  // -----------------------------------------
  useEffect(() => {
    const playersRef = ref(database, "rooms/miss2026/players");
    return onValue(playersRef, (snap) => {
      setPlayers(snap.val() || {});
    });
  }, []);

  // -----------------------------------------
  // SYNC ADMIN SELECTIONS
  // -----------------------------------------
  useEffect(() => {
    const adminRef = ref(database, "rooms/miss2026/adminSelections");

    return onValue(adminRef, (snap) => {
      setAdminSelections(
        snap.val() || { tour1: [], tour2: [], tour3: [] }
      );
    });
  }, []);

  // -----------------------------------------
  // SYNC TOUR / VOTES / FINALE
  // -----------------------------------------
  useEffect(() => {
    const votesRef = ref(database, "rooms/miss2026/votesOpen");
    const tourRef = ref(database, "rooms/miss2026/tour");
    const finaleRef = ref(database, "rooms/miss2026/finaleStarted");

    const unsubV = onValue(votesRef, (snap) =>
      setVotesOpen(Boolean(snap.val()))
    );
    const unsubT = onValue(tourRef, (snap) =>
      setTour(snap.val() || 1)
    );
    const unsubF = onValue(finaleRef, (snap) =>
      setFinaleStarted(Boolean(snap.val()))
    );

    return () => {
      unsubV();
      unsubT();
      unsubF();
    };
  }, []);

  // -----------------------------------------
  // FUNCTIONS
  // -----------------------------------------

  // Ajout ou connexion d’un joueur
  const addPlayer = (pseudo) => {
    if (!pseudo) return;

    update(ref(database, `rooms/miss2026/players/${pseudo}`), {
      connected: true,
      lastSeen: Date.now(),
    });
  };

  // Enregistrer VRAI vote (validation)
  const updatePlayerVote = (pseudo, tourNum, selection) => {
    set(
      ref(database, `rooms/miss2026/players/${pseudo}/tour${tourNum}`),
      selection
    );
  };

  // Reset total → supprime tout + localStorage
  const resetGame = () => {
    if (!window.confirm("Réinitialiser toute la partie ?")) return;

    localStorage.clear(); // RESET COMPLET côté joueur

    set(ref(database, "rooms/miss2026"), {
      players: {},
      adminSelections: { tour1: [], tour2: [], tour3: [] },
      votesOpen: false,
      tour: 1,
      finaleStarted: false,
    });
  };

  const updateAdminSelections = (num, list) =>
    update(ref(database, "rooms/miss2026/adminSelections"), {
      [`tour${num}`]: list,
    });

  const updateTour = (num) => set(ref(database, "rooms/miss2026/tour"), num);

  const updateVotesOpen = (state) =>
    set(ref(database, "rooms/miss2026/votesOpen"), state);

  const updateFinaleStarted = (state) =>
    set(ref(database, "rooms/miss2026/finaleStarted"), state);

  // -----------------------------------------
  // PROVIDER
  // -----------------------------------------
  return (
    <AppContext.Provider
      value={{
        players,
        adminSelections,
        votesOpen,
        tour,
        finaleStarted,
        addPlayer,
        updatePlayerVote,
        updateAdminSelections,
        updateTour,
        updateVotesOpen,
        updateFinaleStarted,
        resetGame,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
