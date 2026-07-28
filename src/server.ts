import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { defaultData, type GameData, type KahootQ, type ZoneKey } from "./lib/game-data";
export { GameRoomDO } from "./game-room-do";

type CloudflareEnv = {
  DB?: D1Database;
  GAME_KV?: KVNamespace;
  GAME_ROOM?: DurableObjectNamespace;
  ASSETS?: unknown;
};

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// ─────────────── Cloudflare Environment Resolvers ───────────────

function getCloudflareEnv(env: any, request: any): any {
  if (env && (env.DB || env.GAME_KV || env.GAME_ROOM)) return env;
  if (request?.context?.cloudflare?.env) return request.context.cloudflare.env;
  if (request?.env) return request.env;
  if ((globalThis as any)?.__env__) return (globalThis as any).__env__;
  if ((globalThis as any)?.process?.env) return (globalThis as any).process.env;
  return env || {};
}

function getD1Database(env: any, request: Request): D1Database | undefined {
  const cf = getCloudflareEnv(env, request);
  return cf?.DB || cf?.protein_world_db || (globalThis as any)?.DB;
}

function getKVNamespace(env: any, request: Request): KVNamespace | undefined {
  const cf = getCloudflareEnv(env, request);
  return cf?.GAME_KV || (globalThis as any)?.GAME_KV;
}

// ─────────────── D1 SQLite Database Helpers ───────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

async function loadGameDataFromD1(db: D1Database): Promise<GameData> {
  const qRows = await db.prepare("SELECT * FROM questions ORDER BY created_at ASC").all<any>();
  const sRows = await db.prepare("SELECT * FROM zone_settings").all<any>();
  const pwRow = await db.prepare("SELECT value FROM admin_config WHERE key = 'admin_password'").first<any>();

  const result: GameData = {
    structural: [],
    folding: [],
    enzyme: [],
    immune: [],
    settings: {
      structural: { timeSec: 30, passing: 60 },
      folding: { timeSec: 30, passing: 60 },
      enzyme: { timeSec: 30, passing: 60 },
      immune: { timeSec: 30, passing: 60 },
      adminPassword: pwRow?.value ?? "protein123",
    },
  };

  if (sRows.results) {
    for (const r of sRows.results) {
      if (r.zone in result.settings) {
        (result.settings as any)[r.zone] = {
          timeSec: Number(r.time_sec),
          passing: Number(r.passing),
        };
      }
    }
  }

  if (qRows.results && qRows.results.length > 0) {
    for (const r of qRows.results) {
      const zone = r.zone as ZoneKey;
      if (zone in result) {
        result[zone].push({
          id: r.id,
          prompt: r.prompt,
          options: [r.option_a, r.option_b, r.option_c, r.option_d],
          correctIndex: Number(r.correct_index),
          difficulty: r.difficulty,
          points: Number(r.points),
          explanation: r.explanation,
          extraVisual: r.extra_visual || "🧬",
        });
      }
    }
  } else {
    return defaultData;
  }

  return result;
}

async function syncGameDataToKV(db: D1Database | undefined, kv: KVNamespace | undefined, data?: GameData): Promise<GameData> {
  let latestData = data;
  if (!latestData && db) {
    latestData = await loadGameDataFromD1(db);
  }
  if (!latestData) {
    latestData = defaultData;
  }
  if (kv) {
    try {
      await kv.put("game-data", JSON.stringify(latestData));
    } catch {}
  }
  return latestData;
}

// ─────────────── API Route Handlers ───────────────

async function handleApiRoute(request: Request, env: any): Promise<Response | null> {
  try {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const db = getD1Database(env, request);
    const kv = getKVNamespace(env, request);
    const cf = getCloudflareEnv(env, request);

    // ─── 📡 WebSocket Upgrade Route (/api/ws) ───
    if (path === "/api/ws") {
      const gameRoomNs = cf?.GAME_ROOM as DurableObjectNamespace | undefined;
      if (gameRoomNs) {
        const stub = gameRoomNs.getByName("main_world");
        return stub.fetch(request);
      }
      return new Response("Durable Object GAME_ROOM binding not available", { status: 503 });
    }

    // ─── GET /api/debug-env ───
    if (path === "/api/debug-env") {
      return jsonResponse({
        envType: typeof env,
        envKeys: env ? Object.keys(env) : [],
        cfKeys: cf ? Object.keys(cf) : [],
        hasDB: !!db,
        hasKV: !!kv,
        hasGameRoom: !!cf?.GAME_ROOM,
      });
    }

    // ─── GET /api/game-data ───
    if (path === "/api/game-data" && request.method === "GET") {
      if (db) {
        try {
          const data = await loadGameDataFromD1(db);
          await syncGameDataToKV(db, kv, data);
          return jsonResponse(data);
        } catch (err) {
          console.error("D1 load error:", err);
        }
      }
      if (kv) {
        try {
          const raw = await kv.get("game-data", "text");
          if (raw) return jsonResponse(JSON.parse(raw));
        } catch {}
      }
      return jsonResponse(defaultData);
    }

    // ─── ➕ POST /api/questions ───
    if (path === "/api/questions" && request.method === "POST") {
      try {
        const body = (await request.json()) as { zone: ZoneKey; question: KahootQ };
        const { zone, question } = body;

        if (!zone || !question || !question.prompt) {
          return jsonResponse({ error: "Missing required question fields" }, 400);
        }

        const qId = question.id || `q_${zone[0]}_${Date.now()}`;

        if (db) {
          await db
            .prepare(
              `INSERT INTO questions (id, zone, prompt, option_a, option_b, option_c, option_d, correct_index, difficulty, points, explanation, extra_visual, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              qId,
              zone,
              question.prompt,
              question.options[0] || "ตัวเลือก A",
              question.options[1] || "ตัวเลือก B",
              question.options[2] || "ตัวเลือก C",
              question.options[3] || "ตัวเลือก D",
              question.correctIndex ?? 0,
              question.difficulty ?? "easy",
              question.points ?? 15,
              question.explanation || "",
              question.extraVisual || "🧬",
              Date.now()
            )
            .run();
        }

        const updatedData = db ? await loadGameDataFromD1(db) : defaultData;
        await syncGameDataToKV(db, kv, updatedData);

        return jsonResponse({ ok: true, id: qId, data: updatedData, dbUsed: !!db });
      } catch (e) {
        console.error("POST /api/questions error:", e);
        return jsonResponse({ error: String(e) }, 500);
      }
    }

    // ─── 🗑️ DELETE /api/questions ───
    if (path === "/api/questions" && request.method === "DELETE") {
      try {
        const body = (await request.json()) as { id: string };
        const { id } = body;

        if (!id) {
          return jsonResponse({ error: "Missing question ID" }, 400);
        }

        if (db) {
          await db.prepare("DELETE FROM questions WHERE id = ?").bind(id).run();
        }

        const updatedData = db ? await loadGameDataFromD1(db) : defaultData;
        await syncGameDataToKV(db, kv, updatedData);

        return jsonResponse({ ok: true, data: updatedData, dbUsed: !!db });
      } catch (e) {
        console.error("DELETE /api/questions error:", e);
        return jsonResponse({ error: String(e) }, 500);
      }
    }

    // ─── ✏️ PUT /api/questions ───
    if (path === "/api/questions" && request.method === "PUT") {
      try {
        const body = (await request.json()) as { id: string; zone: ZoneKey; question: KahootQ };
        const { id, zone, question } = body;

        if (!id || !question) {
          return jsonResponse({ error: "Missing required fields" }, 400);
        }

        if (db) {
          await db
            .prepare(
              `UPDATE questions 
               SET prompt = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_index = ?, difficulty = ?, points = ?, explanation = ?, extra_visual = ?
               WHERE id = ?`
            )
            .bind(
              question.prompt,
              question.options[0] || "",
              question.options[1] || "",
              question.options[2] || "",
              question.options[3] || "",
              question.correctIndex ?? 0,
              question.difficulty ?? "easy",
              question.points ?? 15,
              question.explanation || "",
              question.extraVisual || "🧬",
              id
            )
            .run();
        }

        const updatedData = db ? await loadGameDataFromD1(db) : defaultData;
        await syncGameDataToKV(db, kv, updatedData);

        return jsonResponse({ ok: true, data: updatedData, dbUsed: !!db });
      } catch (e) {
        console.error("PUT /api/questions error:", e);
        return jsonResponse({ error: String(e) }, 500);
      }
    }

    // ─── PUT /api/game-data ───
    if (path === "/api/game-data" && request.method === "PUT") {
      try {
        const body = (await request.json()) as { data: GameData; password: string };

        if (db) {
          try {
            const zones: ZoneKey[] = ["structural", "folding", "enzyme", "immune"];
            for (const z of zones) {
              if (body.data?.settings?.[z]) {
                await db
                  .prepare(
                    `INSERT INTO zone_settings (zone, time_sec, passing) VALUES (?, ?, ?)
                     ON CONFLICT(zone) DO UPDATE SET time_sec = excluded.time_sec, passing = excluded.passing`
                  )
                  .bind(z, body.data.settings[z].timeSec, body.data.settings[z].passing)
                  .run();
              }
            }
            if (body.data?.settings?.adminPassword) {
              await db
                .prepare(
                  `INSERT INTO admin_config (key, value) VALUES ('admin_password', ?)
                   ON CONFLICT(key) DO UPDATE SET value = excluded.value`
                )
                .bind(body.data.settings.adminPassword)
                .run();
            }
          } catch (d1Err) {
            console.error("D1 save settings warning:", d1Err);
          }
        }

        const updatedData = db ? await loadGameDataFromD1(db) : body.data;
        await syncGameDataToKV(db, kv, updatedData);

        return jsonResponse({ ok: true, data: updatedData });
      } catch (e) {
        console.error("PUT /api/game-data error:", e);
        return jsonResponse({ error: String(e) }, 500);
      }
    }

    // ─── GET /api/plays ───
    if (path === "/api/plays" && request.method === "GET") {
      if (db) {
        try {
          const rows = await db.prepare("SELECT * FROM play_logs ORDER BY created_at DESC LIMIT 500").all<any>();
          if (rows.results && rows.results.length > 0) {
            const list = rows.results.map((r) => ({
              id: r.id,
              player: r.player_name,
              zone: r.zone,
              score: Number(r.score),
              total: Number(r.total_score),
              stars: Number(r.stars),
              at: Number(r.created_at),
            }));
            return jsonResponse(list);
          }
        } catch (err) {
          console.error("D1 get plays error:", err);
        }
      }
      if (kv) {
        try {
          const raw = await kv.get("plays", "text");
          if (raw) return jsonResponse(JSON.parse(raw));
        } catch {}
      }
      return jsonResponse([]);
    }

    // ─── POST /api/plays ───
    if (path === "/api/plays" && request.method === "POST") {
      try {
        const entry = await request.json();
        if (db) {
          try {
            await db
              .prepare(
                `INSERT INTO play_logs (id, player_name, zone, score, total_score, stars, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
              )
              .bind(entry.id, entry.player, entry.zone, entry.score, entry.total, entry.stars, entry.at || Date.now())
              .run();
          } catch {}
        }
        if (kv) {
          const raw = await kv.get("plays", "text");
          const list = raw ? JSON.parse(raw) : [];
          list.unshift(entry);
          await kv.put("plays", JSON.stringify(list.slice(0, 500)));
        }
        return jsonResponse({ ok: true });
      } catch (e) {
        return jsonResponse({ ok: false, error: String(e) }, 200);
      }
    }

    // ─── DELETE /api/plays ───
    if (path === "/api/plays" && request.method === "DELETE") {
      try {
        if (db) {
          await db.prepare("DELETE FROM play_logs").run();
        }
        if (kv) {
          await kv.put("plays", JSON.stringify([]));
        }
        return jsonResponse({ ok: true });
      } catch (e) {
        return jsonResponse({ ok: false, error: String(e) }, 200);
      }
    }

    return null;
  } catch (globalErr) {
    console.error("handleApiRoute error:", globalErr);
    return jsonResponse({ error: String(globalErr) }, 500);
  }
}

// ─────────────── Main Export ───────────────

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        const apiResponse = await handleApiRoute(request, env as CloudflareEnv);
        if (apiResponse) return apiResponse;
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
