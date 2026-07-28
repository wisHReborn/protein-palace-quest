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
    const cached = localStorage.getItem("pw_player_id");
    if (cached) {
      currentMyId = cached;
    } else {
      currentMyId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem("pw_player_id", currentMyId);
    }
  }
  return currentMyId;
}

export function useMultiplayer(myPlayerInfo: {
  name: string;
  avatar: string;
  x: number;
  y: number;
  direction: string;
  zone: string;
}) {
  const [players, setPlayers] = useState<RemotePlayer[]>([]);
  const lastMoveSentRef = useRef<number>(0);

  useEffect(() => {
    const myId = getMyPlayerId();

    function connect() {
      if (typeof window === "undefined") return;
      if (wsInstance && (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsInstance = ws;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: "join",
              id: myId,
              name: myPlayerInfo.name,
              avatar: myPlayerInfo.avatar,
              x: myPlayerInfo.x,
              y: myPlayerInfo.y,
              direction: myPlayerInfo.direction,
              zone: myPlayerInfo.zone,
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "players_update" && Array.isArray(data.players)) {
              const updatedList: RemotePlayer[] = [];

              for (const p of data.players) {
                if (p.id === myId) continue; // Skip self

                const existing = remotePlayersMap.get(p.id);
                const renderX = existing ? existing.renderX : p.x;
                const renderY = existing ? existing.renderY : p.y;

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
          setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          wsInstance = null;
        };
      } catch {}
    }

    const handleSub = (list: RemotePlayer[]) => {
      setPlayers([...list]);
    };
    subscribers.add(handleSub);

    connect();

    return () => {
      subscribers.delete(handleSub);
    };
  }, []);

  const sendMove = (x: number, y: number, direction: string, isMoving: boolean, zone: string) => {
    const now = Date.now();
    if (now - lastMoveSentRef.current < 70) return; // Throttle ~14 updates/sec max
    lastMoveSentRef.current = now;

    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      wsInstance.send(
        JSON.stringify({
          type: "move",
          x: Math.round(x),
          y: Math.round(y),
          direction,
          isMoving,
          zone,
        })
      );
    }
  };

  const sendChat = (text: string) => {
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN && text.trim()) {
      wsInstance.send(
        JSON.stringify({
          type: "chat",
          text: text.trim(),
        })
      );
    }
  };

  return { remotePlayers: players, sendMove, sendChat };
}
