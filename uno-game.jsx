import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// CONSTANTS & CARD DEFINITIONS
// ============================================================
const COLORS = ["red", "yellow", "green", "blue"];
const COLOR_HEX = {
  red: "#FF2D55",
  yellow: "#FFD60A",
  green: "#30D158",
  blue: "#0A84FF",
  wild: "#BF5AF2",
};

function createDeck() {
  const deck = [];
  COLORS.forEach((color) => {
    deck.push({ color, value: "0", type: "number" });
    for (let i = 1; i <= 9; i++) {
      deck.push({ color, value: `${i}`, type: "number" });
      deck.push({ color, value: `${i}`, type: "number" });
    }
    ["Skip", "Reverse", "+2"].forEach((v) => {
      deck.push({ color, value: v, type: "action" });
      deck.push({ color, value: v, type: "action" });
    });
  });
  ["Wild", "Wild +4", "Wild", "Wild +4"].forEach((v) => {
    deck.push({ color: "wild", value: v, type: "wild" });
  });
  return deck;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canPlay(card, topCard, currentColor) {
  if (card.type === "wild") return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}

const CARD_VALUE_ICONS = {
  Skip: "⊘",
  Reverse: "⇄",
  "+2": "+2",
  Wild: "★",
  "Wild +4": "+4",
};

// ============================================================
// CARD COMPONENT
// ============================================================
function UnoCard({ card, onClick, isPlayable, isSmall, selected, faceDown, style }) {
  const col = faceDown ? "#1a1a2e" : COLOR_HEX[card?.color] || "#BF5AF2";
  const isWild = card?.type === "wild";
  const displayVal = CARD_VALUE_ICONS[card?.value] || card?.value;

  return (
    <div
      onClick={isPlayable && onClick ? onClick : undefined}
      style={{
        width: isSmall ? 48 : 72,
        height: isSmall ? 72 : 108,
        borderRadius: 12,
        background: faceDown
          ? "linear-gradient(135deg, #0d0d1a 0%, #1a1a3e 100%)"
          : `linear-gradient(145deg, ${col}ee, ${col}99)`,
        border: selected
          ? "3px solid #fff"
          : isPlayable
          ? `2px solid ${col}cc`
          : "2px solid rgba(255,255,255,0.08)",
        boxShadow: selected
          ? `0 0 24px 6px ${col}, 0 8px 24px rgba(0,0,0,0.5)`
          : isPlayable
          ? `0 4px 16px ${col}66, 0 2px 8px rgba(0,0,0,0.4)`
          : "0 2px 8px rgba(0,0,0,0.3)",
        cursor: isPlayable ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        transform: selected ? "translateY(-18px) scale(1.08)" : isPlayable ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.2s cubic-bezier(.34,1.56,.64,1)",
        flexShrink: 0,
        userSelect: "none",
        ...style,
      }}
    >
      {faceDown ? (
        <div style={{ fontSize: isSmall ? 18 : 28, color: "#BF5AF2", fontWeight: 900, fontFamily: "'Exo 2', sans-serif" }}>
          UNO
        </div>
      ) : (
        <>
          {/* Top-left value */}
          <div
            style={{
              position: "absolute",
              top: 4,
              left: 6,
              fontSize: isSmall ? 10 : 14,
              fontWeight: 900,
              color: "#fff",
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              fontFamily: "'Exo 2', sans-serif",
              lineHeight: 1,
            }}
          >
            {displayVal}
          </div>
          {/* Center */}
          <div
            style={{
              fontSize: isSmall ? 20 : 30,
              fontWeight: 900,
              color: "#fff",
              textShadow: `0 0 16px rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.5)`,
              fontFamily: "'Exo 2', sans-serif",
              background: isWild
                ? "conic-gradient(#FF2D55 0% 25%, #FFD60A 25% 50%, #30D158 50% 75%, #0A84FF 75% 100%)"
                : "rgba(255,255,255,0.15)",
              WebkitBackgroundClip: isWild ? "text" : undefined,
              WebkitTextFillColor: isWild ? "transparent" : undefined,
              borderRadius: isSmall ? 6 : 8,
              width: isSmall ? 28 : 44,
              height: isSmall ? 28 : 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid rgba(255,255,255,0.25)",
            }}
          >
            {displayVal}
          </div>
          {/* Bottom-right value (rotated) */}
          <div
            style={{
              position: "absolute",
              bottom: 4,
              right: 6,
              fontSize: isSmall ? 10 : 14,
              fontWeight: 900,
              color: "#fff",
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              fontFamily: "'Exo 2', sans-serif",
              transform: "rotate(180deg)",
              lineHeight: 1,
            }}
          >
            {displayVal}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// COLOR PICKER
// ============================================================
function ColorPicker({ onSelect }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #0d0d1a, #1a1a3e)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 24,
          padding: 40,
          textAlign: "center",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 28,
            fontFamily: "'Exo 2', sans-serif",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Choose a Color
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onSelect(c)}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: COLOR_HEX[c],
                border: "3px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
                boxShadow: `0 0 24px ${COLOR_HEX[c]}88`,
                transition: "all 0.15s ease",
                fontSize: 0,
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.2)";
                e.target.style.boxShadow = `0 0 40px ${COLOR_HEX[c]}`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = `0 0 24px ${COLOR_HEX[c]}88`;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function Toast({ messages }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            background: m.color ? `${COLOR_HEX[m.color] || m.color}cc` : "rgba(255,255,255,0.15)",
            backdropFilter: "blur(16px)",
            border: `1px solid ${m.color ? COLOR_HEX[m.color] || m.color : "rgba(255,255,255,0.2)"}55`,
            borderRadius: 50,
            padding: "10px 24px",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            fontFamily: "'Exo 2', sans-serif",
            letterSpacing: 1,
            boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
            animation: "toastIn 0.3s cubic-bezier(.34,1.56,.64,1)",
            whiteSpace: "nowrap",
          }}
        >
          {m.text}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// PLAYER AVATAR
// ============================================================
function PlayerAvatar({ player, isActive, cardCount, isUno }) {
  const colors = ["#FF2D55", "#0A84FF", "#30D158", "#FFD60A", "#BF5AF2", "#FF9F0A"];
  const col = colors[player.id % colors.length];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "12px 16px",
        borderRadius: 16,
        background: isActive ? `${col}22` : "rgba(255,255,255,0.03)",
        border: isActive ? `2px solid ${col}` : "2px solid rgba(255,255,255,0.06)",
        boxShadow: isActive ? `0 0 20px ${col}44` : "none",
        transition: "all 0.3s ease",
        minWidth: 80,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${col}, ${col}88)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 900,
          color: "#fff",
          fontFamily: "'Exo 2', sans-serif",
          boxShadow: isActive ? `0 0 16px ${col}` : "none",
          border: isUno ? "3px solid #FFD60A" : "2px solid rgba(255,255,255,0.2)",
          animation: isUno ? "unoPulse 0.8s ease infinite" : "none",
        }}
      >
        {player.name[0]}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? "#fff" : "rgba(255,255,255,0.5)", fontFamily: "'Exo 2', sans-serif", letterSpacing: 0.5 }}>
        {player.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 12, color: isActive ? col : "rgba(255,255,255,0.4)", fontWeight: 800, fontFamily: "'Exo 2', sans-serif" }}>
          {cardCount}
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'Exo 2', sans-serif" }}>cards</span>
        {isUno && (
          <span style={{ fontSize: 10, fontWeight: 900, color: "#FFD60A", fontFamily: "'Exo 2', sans-serif", marginLeft: 2 }}>
            UNO!
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// GAME OVER SCREEN
// ============================================================
function GameOverScreen({ winner, onRestart }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 150,
        flexDirection: "column",
        gap: 32,
      }}
    >
      <div style={{ textAlign: "center", animation: "popIn 0.5s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ fontSize: 80, marginBottom: 8 }}>🎉</div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            background: "linear-gradient(135deg, #FFD60A, #FF9F0A, #FF2D55)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "'Exo 2', sans-serif",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          {winner} Wins!
        </div>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", fontFamily: "'Exo 2', sans-serif", letterSpacing: 1 }}>
          Game Over
        </div>
      </div>
      <button
        onClick={onRestart}
        style={{
          padding: "16px 48px",
          borderRadius: 50,
          background: "linear-gradient(135deg, #BF5AF2, #0A84FF)",
          border: "none",
          color: "#fff",
          fontSize: 18,
          fontWeight: 800,
          fontFamily: "'Exo 2', sans-serif",
          letterSpacing: 2,
          textTransform: "uppercase",
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(191,90,242,0.5)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => { e.target.style.transform = "scale(1.05)"; e.target.style.boxShadow = "0 12px 40px rgba(191,90,242,0.7)"; }}
        onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; e.target.style.boxShadow = "0 8px 32px rgba(191,90,242,0.5)"; }}
      >
        Play Again
      </button>
    </div>
  );
}

// ============================================================
// MAIN GAME
// ============================================================
const PLAYER_COUNT = 4;
const HUMAN_ID = 0;

function initGame() {
  let deck = shuffle(createDeck());
  const players = Array.from({ length: PLAYER_COUNT }, (_, i) => ({
    id: i,
    name: i === 0 ? "You" : `Bot ${i}`,
    hand: [],
    isHuman: i === 0,
  }));
  // Deal 7 cards
  for (let i = 0; i < 7; i++) {
    players.forEach((p) => {
      p.hand.push(deck.pop());
    });
  }
  // Find valid start card
  let topCard;
  do {
    topCard = deck.pop();
    if (topCard.type === "wild") deck.unshift(topCard);
  } while (topCard.type === "wild");

  return {
    deck,
    discardPile: [topCard],
    players,
    currentPlayer: 0,
    direction: 1,
    currentColor: topCard.color,
    gameOver: false,
    winner: null,
    drawStack: 0,
    skipped: false,
  };
}

export default function UnoGame() {
  const [game, setGame] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWild, setPendingWild] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const botTimeout = useRef(null);
  const [started, setStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(3);

  const addToast = useCallback((text, color) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-3), { id, text, color }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  const startGame = useCallback(() => {
    const newGame = initGame();
    // Trim to playerCount
    newGame.players = newGame.players.slice(0, playerCount);
    setGame(newGame);
    setStarted(true);
    setSelectedCard(null);
    addToast("Game Started! Good luck 🎮", "#BF5AF2");
  }, [playerCount, addToast]);

  // Process special effects of played card
  const applyCardEffect = useCallback((g, card, playerId) => {
    const n = g.players.length;
    let next = (g.currentPlayer + g.direction + n) % n;

    if (card.value === "Reverse") {
      g.direction *= -1;
      if (n === 2) {
        // Reverse acts as Skip in 2-player
        next = (g.currentPlayer + g.direction + n) % n;
      } else {
        next = (g.currentPlayer + g.direction + n) % n;
      }
      addToast(`${g.players[playerId].name} reversed direction!`, "wild");
    } else if (card.value === "Skip") {
      next = (next + g.direction + n) % n;
      addToast(`${g.players[next === (g.currentPlayer + g.direction + n) % n ? playerId : (next - g.direction + n) % n].name} skipped ${g.players[next].name}!`, card.color);
    } else if (card.value === "+2") {
      g.drawStack += 2;
      addToast(`+2 cards for ${g.players[next].name}!`, card.color);
    } else if (card.value === "Wild +4") {
      g.drawStack += 4;
      addToast(`Wild +4! ${g.players[next].name} draws 4!`, "wild");
    }

    g.currentPlayer = next;
    return g;
  }, [addToast]);

  const drawCards = useCallback((g, playerId, count) => {
    for (let i = 0; i < count; i++) {
      if (g.deck.length === 0) {
        const top = g.discardPile.pop();
        g.deck = shuffle(g.discardPile);
        g.discardPile = [top];
      }
      if (g.deck.length > 0) {
        g.players[playerId].hand.push(g.deck.pop());
      }
    }
    return g;
  }, []);

  const playCard = useCallback((cardIdx, chosenColor) => {
    setGame((prev) => {
      if (!prev || prev.currentPlayer !== HUMAN_ID || prev.gameOver) return prev;
      const g = JSON.parse(JSON.stringify(prev));
      const card = g.players[HUMAN_ID].hand[cardIdx];
      const topCard = g.discardPile[g.discardPile.length - 1];
      if (!canPlay(card, topCard, g.currentColor)) return prev;

      g.players[HUMAN_ID].hand.splice(cardIdx, 1);
      g.discardPile.push(card);
      g.currentColor = card.type === "wild" ? chosenColor : card.color;

      addToast(`You played ${card.value}!`, card.color === "wild" ? chosenColor : card.color);

      if (g.players[HUMAN_ID].hand.length === 0) {
        g.gameOver = true;
        g.winner = "You";
        return g;
      }
      if (g.players[HUMAN_ID].hand.length === 1) {
        addToast("UNO! 🃏", "#FFD60A");
      }

      return applyCardEffect(g, card, HUMAN_ID);
    });
    setSelectedCard(null);
  }, [addToast, applyCardEffect]);

  const handleCardClick = useCallback((idx) => {
    if (!game || game.currentPlayer !== HUMAN_ID || game.gameOver) return;
    const card = game.players[HUMAN_ID].hand[idx];
    const topCard = game.discardPile[game.discardPile.length - 1];
    if (!canPlay(card, topCard, game.currentColor)) {
      addToast("Can't play that card!", "#FF2D55");
      return;
    }
    if (card.type === "wild") {
      setSelectedCard(idx);
      setPendingWild(idx);
      setShowColorPicker(true);
    } else {
      setSelectedCard(idx);
      setTimeout(() => playCard(idx, null), 150);
    }
  }, [game, addToast, playCard]);

  const handleDraw = useCallback(() => {
    setGame((prev) => {
      if (!prev || prev.currentPlayer !== HUMAN_ID || prev.gameOver) return prev;
      const g = JSON.parse(JSON.stringify(prev));
      const drawCount = g.drawStack > 0 ? g.drawStack : 1;
      drawCards(g, HUMAN_ID, drawCount);
      g.drawStack = 0;
      addToast(`You drew ${drawCount} card${drawCount > 1 ? "s" : ""}`, "#0A84FF");
      const n = g.players.length;
      g.currentPlayer = (g.currentPlayer + g.direction + n) % n;
      return g;
    });
  }, [drawCards, addToast]);

  // BOT AI
  useEffect(() => {
    if (!game || game.gameOver || game.currentPlayer === HUMAN_ID) return;
    botTimeout.current = setTimeout(() => {
      setGame((prev) => {
        if (!prev || prev.currentPlayer === HUMAN_ID || prev.gameOver) return prev;
        const g = JSON.parse(JSON.stringify(prev));
        const botId = g.currentPlayer;
        const bot = g.players[botId];
        const topCard = g.discardPile[g.discardPile.length - 1];

        // If drawStack, must draw
        if (g.drawStack > 0) {
          const nextPlayer = g.players[(botId + g.direction + g.players.length) % g.players.length];
          const hasCounter = bot.hand.some((c) =>
            (c.value === "+2" && g.drawStack <= 2) ||
            (c.value === "Wild +4")
          );
          if (!hasCounter) {
            drawCards(g, botId, g.drawStack);
            g.drawStack = 0;
            addToast(`${bot.name} drew ${g.drawStack || "forced"} cards`, "#0A84FF");
            g.currentPlayer = (botId + g.direction + g.players.length) % g.players.length;
            return g;
          }
        }

        // Find best card to play
        const playable = bot.hand
          .map((c, i) => ({ card: c, idx: i }))
          .filter(({ card }) => canPlay(card, topCard, g.currentColor));

        if (playable.length === 0) {
          drawCards(g, botId, 1);
          addToast(`${bot.name} drew a card`, "rgba(255,255,255,0.4)");
          g.currentPlayer = (botId + g.direction + g.players.length) % g.players.length;
          return g;
        }

        // Priority: action > number, avoid wild if possible
        let chosen = playable.find((p) => p.card.type === "action") || playable[0];

        const card = chosen.card;
        bot.hand.splice(chosen.idx, 1);
        g.discardPile.push(card);

        let chosenColor = card.color;
        if (card.type === "wild") {
          const counts = {};
          COLORS.forEach((c) => (counts[c] = 0));
          bot.hand.forEach((c) => { if (c.color !== "wild") counts[c.color]++; });
          chosenColor = COLORS.reduce((a, b) => (counts[a] >= counts[b] ? a : b));
        }
        g.currentColor = card.type === "wild" ? chosenColor : card.color;

        addToast(`${bot.name} played ${card.value}`, card.color === "wild" ? chosenColor : card.color);

        if (bot.hand.length === 0) {
          g.gameOver = true;
          g.winner = bot.name;
          return g;
        }
        if (bot.hand.length === 1) {
          addToast(`${bot.name} says UNO! 🃏`, "#FFD60A");
        }

        return applyCardEffect(g, card, botId);
      });
    }, 900 + Math.random() * 600);

    return () => clearTimeout(botTimeout.current);
  }, [game, addToast, applyCardEffect, drawCards]);

  const humanHand = game?.players[HUMAN_ID]?.hand || [];
  const topCard = game?.discardPile?.[game.discardPile.length - 1];
  const isMyTurn = game?.currentPlayer === HUMAN_ID;

  if (!started) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;800;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #080812; overflow: hidden; }
          @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(5deg)} }
          @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
          @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        `}</style>
        <div style={{
          width: "100vw", height: "100vh", background: "#080812",
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
          fontFamily: "'Exo 2', sans-serif", overflow: "hidden", position: "relative",
        }}>
          {/* Animated background cards */}
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              width: 60, height: 90, borderRadius: 10,
              background: `linear-gradient(135deg, ${Object.values(COLOR_HEX)[i % 5]}88, ${Object.values(COLOR_HEX)[(i+2)%5]}44)`,
              border: `1px solid ${Object.values(COLOR_HEX)[i % 5]}44`,
              left: `${10 + i * 15}%`, top: `${10 + (i % 3) * 25}%`,
              animation: `float ${3 + i * 0.7}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
              opacity: 0.3,
            }} />
          ))}

          {/* Logo */}
          <div style={{
            fontSize: 96, fontWeight: 900,
            background: "linear-gradient(135deg, #FF2D55 0%, #FFD60A 25%, #30D158 50%, #0A84FF 75%, #BF5AF2 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: 8, textTransform: "uppercase", marginBottom: 8,
            filter: "drop-shadow(0 0 40px rgba(191,90,242,0.4))",
          }}>UNO</div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", letterSpacing: 6, marginBottom: 60, textTransform: "uppercase" }}>
            Card Game
          </div>

          {/* Player count */}
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 3, marginBottom: 16, textTransform: "uppercase" }}>
              Players
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[2, 3, 4].map((n) => (
                <button key={n} onClick={() => setPlayerCount(n)} style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: playerCount === n ? "linear-gradient(135deg, #BF5AF2, #0A84FF)" : "rgba(255,255,255,0.05)",
                  border: playerCount === n ? "2px solid #BF5AF2" : "2px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 20, fontWeight: 900, cursor: "pointer",
                  fontFamily: "'Exo 2', sans-serif",
                  boxShadow: playerCount === n ? "0 0 24px rgba(191,90,242,0.5)" : "none",
                  transition: "all 0.2s ease",
                }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button onClick={startGame} style={{
            padding: "18px 64px", borderRadius: 50,
            background: "linear-gradient(135deg, #FF2D55, #BF5AF2, #0A84FF)",
            border: "none", color: "#fff", fontSize: 20, fontWeight: 900,
            fontFamily: "'Exo 2', sans-serif", letterSpacing: 3, textTransform: "uppercase",
            cursor: "pointer", boxShadow: "0 12px 40px rgba(191,90,242,0.5)",
            transition: "all 0.2s ease",
          }}
            onMouseEnter={(e) => { e.target.style.transform = "scale(1.05)"; e.target.style.boxShadow = "0 16px 48px rgba(191,90,242,0.7)"; }}
            onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; e.target.style.boxShadow = "0 12px 40px rgba(191,90,242,0.5)"; }}
          >
            Play Now
          </button>

          {/* Rules */}
          <div style={{ marginTop: 48, display: "flex", gap: 24, opacity: 0.4 }}>
            {[["🃏", "Match color"], ["⇄", "Reverse flow"], ["⊘", "Skip turn"], ["+2", "Draw cards"], ["★", "Wild colors"]].map(([icon, label]) => (
              <div key={label} style={{ textAlign: "center", fontSize: 12, color: "#fff", letterSpacing: 0.5 }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080812; overflow: hidden; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes toastIn { from{opacity:0;transform:translateY(-12px) scale(0.9)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes popIn { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
        @keyframes unoPulse { 0%,100%{box-shadow:0 0 8px #FFD60A} 50%{box-shadow:0 0 24px #FFD60A,0 0 48px #FFD60A88} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        ::-webkit-scrollbar { height: 4px; background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      <Toast messages={toasts} />
      {showColorPicker && (
        <ColorPicker onSelect={(c) => {
          setShowColorPicker(false);
          playCard(pendingWild, c);
          setPendingWild(null);
        }} />
      )}
      {game?.gameOver && <GameOverScreen winner={game.winner} onRestart={startGame} />}

      <div style={{
        width: "100vw", height: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #080812 60%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "space-between",
        fontFamily: "'Exo 2', sans-serif",
        padding: "16px 24px",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", width: 600, height: 300, borderRadius: "50%",
          background: `radial-gradient(ellipse, ${game?.currentColor ? COLOR_HEX[game.currentColor] : "#BF5AF2"}22 0%, transparent 70%)`,
          top: "30%", left: "50%", transform: "translate(-50%,-50%)",
          transition: "background 0.5s ease",
          pointerEvents: "none",
        }} />

        {/* TOP: Opponents */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%", justifyContent: "center" }}>
          {game?.players.slice(1).map((p) => (
            <div key={p.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <PlayerAvatar
                player={p}
                isActive={game.currentPlayer === p.id}
                cardCount={p.hand.length}
                isUno={p.hand.length === 1}
              />
              {/* Bot cards (face down) */}
              <div style={{ display: "flex", gap: -8 }}>
                {p.hand.slice(0, Math.min(p.hand.length, 8)).map((_, i) => (
                  <UnoCard
                    key={i}
                    card={null}
                    faceDown
                    isSmall
                    style={{ marginLeft: i > 0 ? -16 : 0, zIndex: i }}
                  />
                ))}
                {p.hand.length > 8 && (
                  <div style={{ width: 48, height: 72, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 700 }}>
                    +{p.hand.length - 8}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* MIDDLE: Table */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 48,
          flex: 1, position: "relative",
        }}>
          {/* Direction & Color indicator */}
          <div style={{
            position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              padding: "4px 16px", borderRadius: 50,
              background: `${COLOR_HEX[game?.currentColor] || "#BF5AF2"}33`,
              border: `1px solid ${COLOR_HEX[game?.currentColor] || "#BF5AF2"}66`,
              color: COLOR_HEX[game?.currentColor] || "#BF5AF2",
              fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
            }}>
              {game?.currentColor} {game?.direction === 1 ? "→" : "←"}
            </div>
            {game?.drawStack > 0 && (
              <div style={{
                padding: "4px 16px", borderRadius: 50,
                background: "rgba(255,45,85,0.2)", border: "1px solid rgba(255,45,85,0.5)",
                color: "#FF2D55", fontSize: 12, fontWeight: 800, letterSpacing: 1,
              }}>
                Stack: +{game.drawStack}
              </div>
            )}
          </div>

          {/* Draw pile */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div
              onClick={isMyTurn ? handleDraw : undefined}
              style={{
                cursor: isMyTurn ? "pointer" : "default",
                transform: isMyTurn ? "scale(1.04)" : "scale(1)",
                transition: "transform 0.2s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => { if(isMyTurn) e.currentTarget.style.transform = "scale(1.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = isMyTurn ? "scale(1.04)" : "scale(1)"; }}
            >
              <UnoCard card={null} faceDown />
              {isMyTurn && (
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 12,
                  background: "rgba(10,132,255,0.12)",
                  border: "2px solid rgba(10,132,255,0.4)",
                  animation: "fadeIn 0.3s ease",
                }} />
              )}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 1 }}>
              {game?.deck.length} left
            </div>
          </div>

          {/* Discard pile */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative", width: 72, height: 108 }}>
              {/* Stack effect */}
              {game?.discardPile.slice(-3).map((c, i, arr) => (
                <div key={i} style={{
                  position: "absolute", top: (i - arr.length + 1) * 3, left: (i - arr.length + 1) * 2,
                  zIndex: i,
                }}>
                  <UnoCard card={c} />
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 1 }}>
              Discard
            </div>
          </div>
        </div>

        {/* BOTTOM: Human player */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {/* Player info */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4 }}>
            <div style={{
              padding: "6px 20px", borderRadius: 50,
              background: isMyTurn ? "rgba(48,209,88,0.15)" : "rgba(255,255,255,0.04)",
              border: isMyTurn ? "1px solid rgba(48,209,88,0.5)" : "1px solid rgba(255,255,255,0.08)",
              color: isMyTurn ? "#30D158" : "rgba(255,255,255,0.4)",
              fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
              transition: "all 0.3s ease",
            }}>
              {isMyTurn ? "Your Turn ✦" : "Wait..."}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
              {humanHand.length} cards
            </div>
          </div>

          {/* Hand */}
          <div style={{
            display: "flex",
            gap: 0,
            overflowX: "auto",
            maxWidth: "100%",
            padding: "8px 12px 4px",
            alignItems: "flex-end",
          }}>
            {humanHand.map((card, i) => {
              const playable = isMyTurn && canPlay(card, topCard, game?.currentColor);
              const isSelected = selectedCard === i;
              return (
                <div key={i} style={{ marginLeft: i > 0 ? -16 : 0, zIndex: isSelected ? 100 : i, position: "relative" }}>
                  <UnoCard
                    card={card}
                    onClick={() => handleCardClick(i)}
                    isPlayable={playable}
                    selected={isSelected}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
