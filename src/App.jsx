import React, { useEffect, useState, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Player from "./pages/Player";
import Waiting from "./pages/Waiting";

import { AppContext } from "./context/AppContext";
import FinaleOverlay from "./components/FinaleOverlay";
import FlashVotes from "./components/FlashVotes"; // ⭐ NOUVEAU

export default function App() {
  return <RouterContent />;
}

function RouterContent() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("miss_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const { finaleStarted, players, adminSelections, flashVotes } =
    useContext(AppContext); // ⭐ flashVotes ajouté

  useEffect(() => {
    if (user) localStorage.setItem("miss_user", JSON.stringify(user));
    else localStorage.removeItem("miss_user");
  }, [user]);

  const isLogged = Boolean(user);

  const pathname = window.location.pathname;

  const shouldShowFinale =
    finaleStarted && isLogged && pathname !== "/login";

  return (
    <BrowserRouter>
      {/* ⭐ FLASH GLOBAL "VOTES OUVERTS !!!" ⭐ */}
      <FlashVotes flashSignal={flashVotes} />

      {/* ⭐ Le show final visible par TOUS (admin + joueurs) sauf login ⭐ */}
      {shouldShowFinale && (
        <FinaleOverlay
          players={players}
          adminSelections={adminSelections}
          isAdmin={user?.role === "admin"}
        />
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login setUser={setUser} />} />

        <Route
          path="/admin"
          element={
            user?.role === "admin" ? (
              <Admin user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/player"
          element={
            user?.role === "player" ? (
              <Player user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="/waiting" element={<Waiting />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
