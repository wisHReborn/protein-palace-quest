import { DurableObject } from "cloudflare:workers";

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  rx: number;
  ry: number;
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
      const playerId = data.id || state?.id;

      // Ignore packets that have no player ID yet
      if (!playerId) return;

      // Close any stale socket matching this ID
      const sockets = this.ctx.getWebSockets();
      for (const s of sockets) {
        if (s !== ws) {
          try {
            const att = s.deserializeAttachment() as PlayerState | null;
            if (att && att.id === playerId) {
              s.close(1000, "Reconnected elsewhere");
            }
          } catch {}
        }
      }

      if (!state) {
        state = {
          id: playerId,
          name: data.name || "นักชีววิทยา",
          avatar: data.avatar || "/avatars/biologist_male.jpg",
          rx: data.rx ?? 0.5,
          ry: data.ry ?? 0.58,
          direction: data.direction || "down",
          isMoving: !!data.isMoving,
          zone: data.zone || "overworld",
        };
      } else {
        if (data.id) state.id = data.id;
        if (data.name) state.name = data.name;
        if (data.avatar) state.avatar = data.avatar;
        if (data.rx !== undefined) state.rx = data.rx;
        if (data.ry !== undefined) state.ry = data.ry;
        if (data.direction) state.direction = data.direction;
        state.isMoving = !!data.isMoving;
        if (data.zone) state.zone = data.zone;
      }

      if (data.type === "chat" && data.text) {
        state.chatMsg = String(data.text).slice(0, 100);
        state.chatTime = Date.now();
      }

      ws.serializeAttachment(state);
      this.broadcastState();
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
        if (s.readyState !== 1) continue;
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
