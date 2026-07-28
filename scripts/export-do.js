import fs from "node:fs";
import path from "node:path";

const indexPath = path.resolve(process.cwd(), ".output/server/index.mjs");

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, "utf-8");

  if (!content.includes("export class GameRoomDO")) {
    const doClassCode = `
import { DurableObject } from "cloudflare:workers";

export class GameRoomDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.players = new Map();
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    try {
      if (typeof message !== "string") return;
      const data = JSON.parse(message);
      if (data.type === "join") {
        const state = {
          id: data.id || \`p_\${Date.now()}_\${Math.random().toString(36).slice(2, 6)}\`,
          name: data.name || "นักชีววิทยา",
          avatar: data.avatar || "/avatars/biologist_male.jpg",
          x: data.x ?? 700,
          y: data.y ?? 700,
          direction: data.direction || "down",
          isMoving: false,
          zone: data.zone || "overworld",
        };
        this.players.set(ws, state);
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

  async webSocketClose(ws) {
    this.players.delete(ws);
    this.broadcastState();
  }

  async webSocketError(ws) {
    this.players.delete(ws);
    this.broadcastState();
  }

  broadcastState() {
    const playerList = Array.from(this.players.values());
    const payload = JSON.stringify({ type: "players_update", players: playerList });
    for (const [ws] of this.players) {
      try {
        ws.send(payload);
      } catch (e) {
        this.players.delete(ws);
      }
    }
  }
}
`;
    fs.writeFileSync(indexPath, content + "\n" + doClassCode, "utf-8");
    console.log("Successfully injected GameRoomDO export into .output/server/index.mjs!");
  }
}
