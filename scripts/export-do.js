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
      const playerId = data.id || state?.id;

      if (!playerId) return;

      const sockets = this.ctx.getWebSockets();
      for (const s of sockets) {
        if (s !== ws) {
          try {
            const att = s.deserializeAttachment();
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
    const playerMap = new Map();
    for (const s of sockets) {
      try {
        if (s.readyState !== 1) continue;
        const att = s.deserializeAttachment();
        if (att && att.id) {
          playerMap.set(att.id, att);
        }
      } catch {}
    }
    const payload = JSON.stringify({ type: "players_update", players: Array.from(playerMap.values()) });
    for (const s of sockets) {
      try {
        if (s.readyState === 1) {
          s.send(payload);
        }
      } catch {}
    }
  }
}
`;
    fs.writeFileSync(indexPath, content + "\n" + doClassCode, "utf-8");
    console.log("Successfully injected GameRoomDO export into .output/server/index.mjs!");
  }
}
