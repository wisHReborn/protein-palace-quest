import { useEffect, useState, useRef } from "react";
import type { PlayerState } from "@/game-room-do";

export type RemotePlayer = PlayerState & {
  renderX: number;
  renderY: number;
};

let wsInstance: WebSocket | null = null;
let currentMyId = "";
let subscribers: Set<(players: RemotePlayer[]) => void> = new Set();
let remotePlayersMap: Map<string, RemotePlayer> = new Map();

export function getMyPlayerId(): string {
  if (typeof window === "undefined") return "p_ssr";
  if (!currentMyId) {
    try {
      const cached = sessionStorage.getItem("pw_session_id");
      if (cached) {
        currentMyId = cached;
      } else {
        currentMyId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        sessionStorage.setItem("pw_session_id", currentMyId);
      }
    } catch {
      currentMyId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }
  }
  return currentMyId;
}

export function useMultiplayer(myPlayerInfo: {
  name: string;
  avatar: string;
  rx: number;
  ry: number;
  direction: string;
  zone: string;
}) {
  const [players, setPlayers] = useState<RemotePlayer[]>(() => Array.from(remotePlayersMap.values()));
  const lastMoveSentRef = useRef<number>(0);
  const infoRef = useRef(myPlayerInfo);

  useEffect(() => {
    infoRef.current = myPlayerInfo;
  }, [myPlayerInfo.rx, myPlayerInfo.ry, myPlayerInfo.name, myPlayerInfo.avatar]);

  useEffect(() => {
    const myId = getMyPlayerId();

    function sendJoin(ws: WebSocket) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(
            JSON.stringify({
              type: "join",
              id: myId,
              name: infoRef.current.name,
              avatar: infoRef.current.avatar,
              rx: infoRef.current.rx,
              ry: infoRef.current.ry,
              direction: infoRef.current.direction,
              zone: infoRef.current.zone,
            })
          );
        } catch {}
      }
    }

    function connect() {
      if (typeof window === "undefined") return;

      if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
        sendJoin(wsInstance);
        return;
      }

      if (wsInstance && wsInstance.readyState === WebSocket.CONNECTING) {
        return;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsInstance = ws;

        ws.onopen = () => {
          sendJoin(ws);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "players_update" && Array.isArray(data.players)) {
              const updatedList: RemotePlayer[] = [];

              for (const p of data.players) {
                if (p.id === myId) continue; // Skip self

                const existing = remotePlayersMap.get(p.id);
                const renderX = existing ? existing.renderX : 0;
                const renderY = existing ? existing.renderY : 0;

                const remoteP: RemotePlayer = {
                  ...p,
                  renderX,
                  renderY,
                };
                remotePlayersMap.set(p.id, remoteP);
                updatedList.push(remoteP);
              }

              // Remove players no longer present
              for (const [id] of remotePlayersMap) {
                if (!data.players.some((p: any) => p.id === id)) {
                  remotePlayersMap.delete(id);
                }
              }

              subscribers.forEach((cb) => cb(Array.from(remotePlayersMap.values())));
            }
          } catch {}
        };

        ws.onclose = () => {
          wsInstance = null;
          setTimeout(connect, 1000);
        };

        ws.onerror = () => {
          wsInstance = null;
        };
      } catch {
        wsInstance = null;
      }
    }

    const handleSub = (list: RemotePlayer[]) => {
      setPlayers([...list]);
    };
    subscribers.add(handleSub);

    // Initial sync immediately upon subscribe
    handleSub(Array.from(remotePlayersMap.values()));

    connect();

    // iPadOS / Mobile Safari Tab Wakeup & Network Handlers
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        connect();
      }
    };
    const handleOnline = () => {
      connect();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    // Heartbeat ping & re-join sync every 2.5 seconds for iPadOS/iOS Safari
    const heartbeat = setInterval(() => {
      if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
        try {
          wsInstance.send(
            JSON.stringify({
              type: "move",
              rx: Number(infoRef.current.rx.toFixed(4)),
              ry: Number(infoRef.current.ry.toFixed(4)),
              direction: infoRef.current.direction,
              isMoving: false,
              zone: infoRef.current.zone,
            })
          );
        } catch {
          wsInstance = null;
          connect();
        }
      } else {
        connect();
      }
    }, 2500);

    return () => {
      subscribers.delete(handleSub);
      clearInterval(heartbeat);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const sendMove = (rx: number, ry: number, direction: string, isMoving: boolean, zone: string) => {
    const now = Date.now();
    if (now - lastMoveSentRef.current < 50) return;
    lastMoveSentRef.current = now;

    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      try {
        wsInstance.send(
          JSON.stringify({
            type: "move",
            rx: Number(rx.toFixed(4)),
            ry: Number(ry.toFixed(4)),
            direction,
            isMoving,
            zone,
          })
        );
      } catch {}
    }
  };

  const sendChat = (text: string) => {
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN && text.trim()) {
      try {
        wsInstance.send(
          JSON.stringify({
            type: "chat",
            text: text.trim(),
          })
        );
      } catch {}
    }
  };

  return { remotePlayers: players, sendMove, sendChat };
}
