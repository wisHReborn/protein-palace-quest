import { DurableObject } from "cloudflare:workers";

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  rx: number; // Relative ratio 0.0 - 1.0 (X)
  ry: number; // Relative ratio 0.0 - 1.0 (Y)
  direction: "up" | "down" | "left" | "right";
  isMoving: boolean;
  zone: string;
  chatMsg?: string;
  chatTime?: number;
}

export class GameRoomDO extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      if (typeof message !== "string") return;
      const data = JSON.parse(message);

      let state = ws.deserializeAttachment() as PlayerState | null;

      // Auto-register state if missing or explicitly joining
      if (!state || data.type === "join") {
        const joinId = data.id || state?.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        // Close any existing stale/ghost sockets for the exact same player ID
        const sockets = this.ctx.getWebSockets();
        for (const s of sockets) {
          if (s !== ws) {
            try {
              const att = s.deserializeAttachment() as PlayerState | null;
              if (att && att.id === joinId) {
                s.close(1000, "Reconnected elsewhere");
              }
            } catch {}
          }
        }

        state = {
          id: joinId,
          name: data.name || state?.name || "นักชีววิทยา",
          avatar: data.avatar || state?.avatar || "/avatars/biologist_male.jpg",
          rx: data.rx ?? state?.rx ?? 0.5,
          ry: data.ry ?? state?.ry ?? 0.58,
          direction: data.direction || state?.direction || "down",
          isMoving: !!data.isMoving,
          zone: data.zone || state?.zone || "overworld",
        };
        ws.serializeAttachment(state);
        this.broadcastState();
        return;
      }

      if (data.type === "move") {
        state.rx = data.rx ?? state.rx;
        state.ry = data.ry ?? state.ry;
        state.direction = data.direction || state.direction;
        state.isMoving = !!data.isMoving;
        if (data.zone) state.zone = data.zone;

        ws.serializeAttachment(state);
        this.broadcastState();
      } else if (data.type === "chat") {
        state.chatMsg = String(data.text).slice(0, 100);
        state.chatTime = Date.now();

        ws.serializeAttachment(state);
        this.broadcastState();
      }
    } catch (err) {
      console.error("GameRoomDO msg error:", err);
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    try {
      ws.close();
    } catch {}
    this.broadcastState();
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    try {
      ws.close();
    } catch {}
    this.broadcastState();
  }

  private broadcastState(): void {
    const sockets = this.ctx.getWebSockets();
    const playerMap = new Map<string, PlayerState>();

    for (const s of sockets) {
      try {
        if (s.readyState !== 1) continue; // Only active OPEN sockets
        const att = s.deserializeAttachment() as PlayerState | null;
        if (att && att.id) {
          playerMap.set(att.id, att);
        }
      } catch {}
    }

    const payload = JSON.stringify({
      type: "players_update",
      players: Array.from(playerMap.values()),
    });

    for (const s of sockets) {
      try {
        if (s.readyState === 1) {
          s.send(payload);
        }
      } catch {}
    }
  }
}
