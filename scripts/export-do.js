import fs from "node:fs";
import path from "node:path";

const indexPath = path.resolve(process.cwd(), ".output/server/index.mjs");

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, "utf-8");

  if (!content.includes("export class GameRoomDO")) {
    const doClassCode = `
import { DurableObject } from "cloudflare:workers";

export class GameRoomDO extends DurableObject {
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
      let state = ws.deserializeAttachment();

      if (data.type === "join") {
        state = {
          id: data.id || \`p_\${Date.now()}_\${Math.random().toString(36).slice(2, 6)}\`,
          name: data.name || "นักชีววิทยา",
          avatar: data.avatar || "/avatars/biologist_male.jpg",
          x: data.x ?? 480,
          y: data.y ?? 350,
          direction: data.direction || "down",
          isMoving: false,
          zone: data.zone || "overworld",
        };
        ws.serializeAttachment(state);
        this.broadcastState();
      } else if (data.type === "move" && state) {
        state.x = data.x ?? state.x;
        state.y = data.y ?? state.y;
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

  async webSocketClose(ws) {
    try { ws.close(); } catch {}
    this.broadcastState();
  }

  async webSocketError(ws) {
    try { ws.close(); } catch {}
    this.broadcastState();
  }

  broadcastState() {
    const sockets = this.ctx.getWebSockets();
    const playerList = [];
    for (const s of sockets) {
      try {
        const att = s.deserializeAttachment();
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
`;
    fs.writeFileSync(indexPath, content + "\n" + doClassCode, "utf-8");
    console.log("Successfully injected GameRoomDO export into .output/server/index.mjs!");
  }
}
