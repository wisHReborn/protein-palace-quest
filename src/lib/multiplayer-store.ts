import { useEffect, useState, useRef } from "react";
import type { PlayerState } from "@/game-room-do";

export type RemotePlayer = PlayerState & {
  renderX: number;
  renderY: number;
};

export function getMyPlayerId(): string {
  if (typeof window === "undefined") return "p_ssr";
  try {
    let id = sessionStorage.getItem("pw_session_id");
    if (!id) {
      id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      sessionStorage.setItem("pw_session_id", id);
    }
    return id;
  } catch {
    return `p_temp_${Math.random().toString(36).slice(2, 7)}`;
  }
}

export function useMultiplayer(myPlayerInfo: {
  name: string;
  avatar: string;
  rx: number;
  ry: number;
  direction: string;
  zone: string;
}) {
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const [myChat, setMyChat] = useState<{ msg: string; time: number } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastMoveSentRef = useRef<number>(0);
  const infoRef = useRef(myPlayerInfo);

  useEffect(() => {
    infoRef.current = myPlayerInfo;
  }, [myPlayerInfo.rx, myPlayerInfo.ry, myPlayerInfo.name, myPlayerInfo.avatar]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const myId = getMyPlayerId();
    let isSubscribed = true;

    function sendJoin(ws: WebSocket) {
      if (ws.readyState === WebSocket.OPEN) {
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
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          sendJoin(wsRef.current);
        }
        return;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          sendJoin(ws);
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === "players_update" && Array.isArray(data.players)) {
              const otherPlayers: RemotePlayer[] = [];

              for (const p of data.players) {
                // Ignore self by ID
                if (p.id === myId) {
                  if (p.chatMsg && p.chatTime) {
                    setMyChat({ msg: p.chatMsg, time: p.chatTime });
                  }
                  continue;
                }

                otherPlayers.push({
                  ...p,
                  renderX: p.rx * 960,
                  renderY: p.ry * 600,
                });
              }

              setRemotePlayers(otherPlayers);
            }
          } catch {}
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (isSubscribed) {
            setTimeout(connect, 1000);
          }
        };

        ws.onerror = () => {
          wsRef.current = null;
        };
      } catch {
        wsRef.current = null;
      }
    }

    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") connect();
    };
    const handleOnline = () => connect();

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    const heartbeat = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(
            JSON.stringify({
              type: "move",
              rx: Number(infoRef.current.rx.toFixed(4)),
              ry: Number(infoRef.current.ry.toFixed(4)),
              direction: infoRef.current.direction,
              isMoving: false,
              zone: infoRef.current.zone,
            })
          );
        } catch {}
      } else {
        connect();
      }
    }, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(heartbeat);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
    };
  }, []);

  const sendMove = (rx: number, ry: number, direction: string, isMoving: boolean, zone: string) => {
    const now = Date.now();
    if (now - lastMoveSentRef.current < 40) return;
    lastMoveSentRef.current = now;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(
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
    const trimmed = text.trim();
    if (!trimmed) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(
          JSON.stringify({
            type: "chat",
            text: trimmed,
          })
        );
      } catch {}
    }
    setMyChat({ msg: trimmed, time: Date.now() });
  };

  return { remotePlayers, sendMove, sendChat, myChat };
}
