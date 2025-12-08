// src/App.jsx

import React, { useEffect, useState, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Player from "./pages/Player";
import Waiting from "./pages/Waiting";

import { AppContext } from "./context/AppContext";
import FinaleOverlay from "./components/FinaleOverlay";

export default function App() {
  return (
    <Router>
      <RouterContent />
    </Router>
  );
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

  const { finaleStarted, players, adminSelections } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  // ⭐ 1. Sauvegarde du user (et suppression si déconnexion)
  useEffect(() => {
    if (user) localStorage.setItem("miss_user", JSON.stringify(user));
    else localStorage.removeItem("miss_user");
  }, [user]);

  // ⭐ 2. Reconnexion automatique
  useEffect(() => {
    const saved = localStorage.getItem("miss_user");
    if (saved && !user) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
      } catch {}
    }
  }, []);

  // ⭐ 3. Redirection automatique si refresh ou démarrage
  useEffect(() => {
    if (!user) return;

    // ADMIN
    if (user.role === "admin" && location.pathname !== "/admin") {
      navigate("/admin", { replace: true });
      return;
    }

    // PLAYER
    if (user.role === "player" && location.pathname !== "/player") {
      navigate("/player", { replace: true });
      return;
    }
  }, [user]);

  const shouldShowFinale =
    finaleStarted && user && location.pathname !== "/login";

  return (
    <>
      {/* ⭐ Show final toujours visible sauf sur login ⭐ */}
      {shouldShowFinale && (
        <FinaleOverlay
          players={players}
          adminSelections={adminSelections}
          isAdmin={user?.role === "admin"}
        />
      )}

      <Routes>
        {/* Page racine → Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* LOGIN */}
        <Route path="/login" element={<Login setUser={setUser} />} />

        {/* ADMIN */}
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

        {/* PLAYER */}
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

        {/* PAGE D'ATTENTE */}
        <Route
          path="/waiting"
          element={
            user ? <Waiting user={user} /> : <Navigate to="/login" replace />
          }
        />

        {/* Toute autre URL → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
