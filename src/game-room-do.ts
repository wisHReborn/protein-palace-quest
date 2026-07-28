import { DurableObject } from "cloudflare:workers";

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right";
  isMoving: boolean;
  zone: string;
  chatMsg?: string;
  chatTime?: number;
}

export class GameRoomDO extends DurableObject {
  private players: Map<WebSocket, PlayerState> = new Map();

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

      if (data.type === "join") {
        const state: PlayerState = {
          id: data.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: data.name || "นักชีววิทยา",
          avatar: data.avatar || "/avatars/biologist_male.jpg",
          x: data.x ?? 700,
          y: data.y ?? 700,
          direction: data.direction || "down",
          isMoving: false,
          zone: data.zone || "overworld",
        };
        this.players.set(ws, state);

        // Broadcast current players list to everyone
        this.broadcastState();
      } else if (data.type === "move") {
        const state = this.players.get(ws);
        if (state) {
          state.x = data.x ?? state.x;
          state.y = data.y ?? state.y;
          state.direction = data.direction || state.direction;
          state.isMoving = !!data.isMoving;
          if (data.zone) state.zone = data.zone;

          this.broadcastState();
        }
      } else if (data.type === "chat") {
        const state = this.players.get(ws);
        if (state && data.text) {
          state.chatMsg = String(data.text).slice(0, 100);
          state.chatTime = Date.now();
          this.broadcastState();
        }
      }
    } catch (err) {
      console.error("GameRoomDO msg error:", err);
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.players.delete(ws);
    this.broadcastState();
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.players.delete(ws);
    this.broadcastState();
  }

  private broadcastState(): void {
    const playerList: PlayerState[] = Array.from(this.players.values());
    const payload = JSON.stringify({ type: "players_update", players: playerList });

    for (const [ws] of this.players) {
      try {
        ws.send(payload);
      } catch (e) {
        // Handle stale connection cleanup
        this.players.delete(ws);
      }
    }
  }
}
