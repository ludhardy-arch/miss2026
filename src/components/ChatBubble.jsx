import React, { useState, useEffect, useRef } from "react";
import { database } from "../firebase";
import { ref, push, onValue } from "firebase/database";

export default function ChatBubble({ user }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);

  const messagesEndRef = useRef(null);

  // Charger messages Firebase
  useEffect(() => {
    const chatRef = ref(database, "rooms/miss2026/chat");

    return onValue(chatRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.values(data).sort((a, b) => a.date - b.date);
      setMessages(list);

      if (!open) {
        setUnread((u) => u + 1);
      }
    });
  }, [open]);

  // Scroll auto
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Envoi message
  const sendMessage = () => {
    if (!text.trim()) return;

    const chatRef = ref(database, "rooms/miss2026/chat");
    push(chatRef, {
      author: user.pseudo,
      text,
      date: Date.now(),
    });

    setText("");
  };

  return (
    <>
      {/* Bulle flottante */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 55,
          height: 55,
          borderRadius: "50%",
          background: "#ff4da6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
          animation: unread > 0 ? "pulseBubble 1.5s infinite" : "none",
        }}
        onClick={() => {
          setOpen(!open);
          setUnread(0);
        }}
      >
        💬
        {unread > 0 && !open && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              background: "red",
              color: "white",
              fontSize: 12,
              padding: "2px 6px",
              borderRadius: "50%",
              fontWeight: "bold",
            }}
          >
            {unread}
          </span>
        )}
      </div>

      {/* Fenêtre popup */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: 260,
            height: 330,
            background: "rgba(10,10,20,0.95)",
            borderRadius: 12,
            boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: 10,
              background: "rgba(255,255,255,0.1)",
              textAlign: "center",
              color: "white",
              fontWeight: "bold",
            }}
          >
            💬 Chat Miss2026
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf:
                    m.author === user.pseudo ? "flex-end" : "flex-start",
                  background:
                    m.author === user.pseudo
                      ? "#ff4da6"
                      : "rgba(255,255,255,0.15)",
                  padding: "6px 10px",
                  borderRadius: 10,
                  maxWidth: "80%",
                  color: "white",
                  fontSize: 14,
                }}
              >
                <b>{m.author}</b>
                <br />
                {m.text}
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              padding: 8,
              background: "rgba(255,255,255,0.08)",
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Écrire…"
              style={{
                flex: 1,
                borderRadius: 6,
                padding: 6,
                border: "none",
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                marginLeft: 6,
                background: "#ff4da6",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: 6,
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>
        {`
        @keyframes slideUp {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes pulseBubble {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}
      </style>
    </>
  );
}
