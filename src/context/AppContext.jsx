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
  const [votesOpen, setVotesOpenState] = useState(false);
  const [tour, setTourState] = useState(1);
  const [finaleStarted, setFinaleStartedState] = useState(false);

  const roomRef = ref(database, "rooms/miss2026");

  // ------------------------------
  // INIT ROOM
  // ------------------------------
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

  // ------------------------------
  // SYNC PLAYERS
  // ------------------------------
  useEffect(() => {
    const playersRef = ref(database, "rooms/miss2026/players");
    return onValue(playersRef, (snap) => setPlayers(snap.val() || {}));
  }, []);

  // ------------------------------
  // SYNC ADMIN SELECTIONS
  // ------------------------------
  useEffect(() => {
    const adminRef = ref(database, "rooms/miss2026/adminSelections");
    return onValue(adminRef, (snap) =>
      setAdminSelections(
        snap.val() || { tour1: [], tour2: [], tour3: [] }
      )
    );
  }, []);

  // ------------------------------
  // SYNC VOTES OPEN / TOUR / FINALE
  // ------------------------------
  useEffect(() => {
    const vRef = ref(database, "rooms/miss2026/votesOpen");
    const tRef = ref(database, "rooms/miss2026/tour");
    const fRef = ref(database, "rooms/miss2026/finaleStarted");

    const unsubV = onValue(vRef, (snap) =>
      setVotesOpenState(Boolean(snap.val()))
    );
    const unsubT = onValue(tRef, (snap) => setTourState(snap.val() ?? 1));
    const unsubF = onValue(fRef, (snap) =>
      setFinaleStartedState(Boolean(snap.val()))
    );

    return () => {
      unsubV();
      unsubT();
      unsubF();
    };
  }, []);

  // ------------------------------
  // FUNCTIONS
  // ------------------------------

  const addPlayer = (pseudo) => {
    update(ref(database, `rooms/miss2026/players/${pseudo}`), {
      connected: true,
      lastSeen: Date.now(),
    });
  };

  const resetPlayerVotes = (pseudo) => {
    remove(ref(database, `rooms/miss2026/players/${pseudo}/tour1`));
    remove(ref(database, `rooms/miss2026/players/${pseudo}/tour2`));
    remove(ref(database, `rooms/miss2026/players/${pseudo}/tour3`));
  };

  const updatePlayerVote = (pseudo, tourNum, selection) => {
    set(ref(database, `rooms/miss2026/players/${pseudo}/tour${tourNum}`), selection);
  };

  const updateAdminSelections = (num, list) =>
    update(ref(database, "rooms/miss2026/adminSelections"), {
      [`tour${num}`]: list,
    });

  const updateTour = (num) =>
    set(ref(database, "rooms/miss2026/tour"), num);

  const updateVotesOpen = (state) =>
    set(ref(database, "rooms/miss2026/votesOpen"), state);

  const updateFinaleStarted = (state) =>
    set(ref(database, "rooms/miss2026/finaleStarted"), state);

  const resetGame = () => {
    if (!window.confirm("Réinitialiser toute la partie ?")) return;

    set(ref(database, "rooms/miss2026"), {
      players: {},
      adminSelections: { tour1: [], tour2: [], tour3: [] },
      votesOpen: false,
      tour: 1,
      finaleStarted: false,
    });
  };

  // ------------------------------
  // PROVIDER
  // ------------------------------
  return (
    <AppContext.Provider
      value={{
        players,
        adminSelections,
        votesOpen,
        tour,
        finaleStarted,
        addPlayer,
        resetPlayerVotes,
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
