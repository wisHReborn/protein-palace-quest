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

      if (data.type === "join") {
        state = {
          id: data.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: data.name || "นักชีววิทยา",
          avatar: data.avatar || "/avatars/biologist_male.jpg",
          rx: data.rx ?? 0.4,
          ry: data.ry ?? 0.45,
          direction: data.direction || "down",
          isMoving: false,
          zone: data.zone || "overworld",
        };
        ws.serializeAttachment(state);
        this.broadcastState();
      } else if (data.type === "move" && state) {
        state.rx = data.rx ?? state.rx;
        state.ry = data.ry ?? state.ry;
        state.direction = data.direction || state.direction;
        state.isMoving = !!data.isMoving;
        if (data.zone) state.zone = data.zone;

        ws.serializeAttachment(state);
        this.broadcastState();
      } else if (data.type === "chat" && state) {
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
    const playerList: PlayerState[] = [];

    for (const s of sockets) {
      try {
        const att = s.deserializeAttachment() as PlayerState | null;
        if (att) playerList.push(att);
      } catch {}
    }

    const payload = JSON.stringify({ type: "players_update", players: playerList });

    for (const s of sockets) {
      try {
        s.send(payload);
      } catch {}
    }
  }
}
