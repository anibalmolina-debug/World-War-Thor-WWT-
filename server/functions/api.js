// @ts-check
import { envOr } from "../lib/env.js";
import { cookieJar, json, problem, requestId, wantsMutatingHeader } from "../lib/http.js";
import { log } from "../lib/log.js";
import { attachSessionCookie, clearSessionCookie, loginGm, loginStudent, logout, me, readToken } from "../lib/auth.js";
import { CORE_VERSION } from "../lib/cipher.js";
import { validateOrder } from "../../shared/js/rules.js";
import {
  applyCommand,
  ensureStore,
  findOrder,
  getSession,
  gmLogins,
  listOrders,
  publicOrder,
  visibleState,
} from "../lib/store.js";

export default async (req, context) => {
  const id = requestId(req, context);
  const cookies = cookieJar(req, context);
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  const ip = context?.ip || req.headers.get("x-forwarded-for") || "local";

  log(id, "req", { method: req.method, path });

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "access-control-allow-headers": "content-type,x-wwt-csrf,x-act-as" } });
  }

  if (!wantsMutatingHeader(req)) {
    return problem(403, "Forbidden", "Missing CSRF header.", id);
  }

  try {
    if (path === "/api/health" && req.method === "GET") {
      const s = await ensureStore();
      return json({
        ok: true,
        version: envOr("APP_VERSION", "0.1.0"),
        coreVersion: CORE_VERSION,
        db: s.ready ? "memory" : "down",
        nations: s.nations.length,
      });
    }

    if (path === "/api/auth/login" && req.method === "POST") {
      const body = await readBody(req);
      const result = await loginStudent({ ip }, String(body.codeword || ""));
      if (!result.ok) return authFail(result, id);
      attachSessionCookie(cookies, result.token);
      return withPendingCookies(json({ ok: true, session: result.session }), cookies);
    }

    if (path === "/api/auth/gm" && req.method === "POST") {
      const body = await readBody(req);
      const result = await loginGm({ ip }, String(body.password || ""));
      if (!result.ok) return authFail(result, id);
      attachSessionCookie(cookies, result.token);
      return withPendingCookies(json({ ok: true, session: result.session }), cookies);
    }

    if (path === "/api/auth/logout" && req.method === "POST") {
      await logout(readToken(cookies));
      clearSessionCookie(cookies);
      return withPendingCookies(json({ ok: true }), cookies);
    }

    const gate = await gated(cookies, id);
    if (gate.response) {
      const authedOnly = path.startsWith("/api/") && path !== "/api/health" && !path.startsWith("/api/auth/");
      if (authedOnly) return gate.response;
    }

    if (path === "/api/auth/me" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      return json(gate.state);
    }

    if (path === "/api/state" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      return json(gate.state);
    }

    if (path === "/api/world" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      return json(gate.state.game);
    }

    if (path === "/api/units" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      return json({ units: gate.state.units });
    }

    if (path === "/api/colonies" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      return json({ colonies: gate.state.colonies });
    }

    if (path === "/api/sync" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      const since = Number(url.searchParams.get("since") || 0);
      const cursor = gate.state.cursor;
      if (since >= cursor) return json({ cursor, changes: [] });

      const changes = gate.s.eventLog.slice(since).map((ev) => ({
        id: ev.id,
        at: ev.at,
        kind: ev.kind,
        payload: ev.payload,
      }));

      return json({ cursor, changes });
    }

    if (path === "/api/map/events" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      return json({ events: gate.state.chaosEvents });
    }






    if (path === "/api/telegrams" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      const myTels = gate.s.telegrams.filter(t => t.to === gate.session.nationId || t.from === gate.session.nationId || gate.session.role === "gm");
      return json({ telegrams: myTels });
    }

    if (path === "/api/telegrams" && req.method === "POST") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      const body = await readBody(req);
      const { to, text } = body;
      if (!to || !text) return problem(400, "Bad Request", "Missing to or text.", id);

      const { scanMessage } = await import("../lib/monitor/scanner.js");
      const scan = scanMessage(text);
      if (scan.isFlagged) {
        appendEvent(gate.s, "system", null, "message.flagged", {
          text,
          flags: scan.flagged,
          from: gate.session.nationId,
        });
      }

      const tel = {
        id: `tel-${gate.s.telegrams.length + 1}`,
        from: gate.session.nationId,
        to,
        text,
        at: new Date().toISOString(),
      };
      gate.s.telegrams.push(tel);
      appendEvent(gate.s, gate.session.role, null, "telegram.send", { id: tel.id });
      return json({ ok: true, telegram: tel });
    }

    if (path === "/api/trades" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      const myTrades = gate.s.trades.filter(t => t.offererId === gate.session.nationId || t.offereeId === gate.session.nationId || gate.session.role === "gm");
      return json({ trades: myTrades });
    }

    if (path === "/api/trades" && req.method === "POST") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      const body = await readBody(req);
      const { offereeId, offer, request } = body;
      if (!offereeId || !offer || !request) return problem(400, "Bad Request", "Missing offereeId, offer, or request.", id);
      const result = await applyCommand(gate.s, {
        actor: gate.session.role,
        kind: "trade.offer",
        payload: { offererId: gate.session.nationId, offereeId, offer, request },
      });
      return json({ ok: true, trade: result.trade });
    }

    if (path.startsWith("/api/trades/") && (req.method === "PUT" || req.method === "POST")) {
      const tradeId = path.split("/").pop();
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      const body = await readBody(req);
      const kind = req.method === "PUT" ? "trade.respond" : "trade.settle";
      const result = await applyCommand(gate.s, {
        actor: gate.session.role,
        kind,
        payload: { ...body, id: tradeId, actorId: gate.session.nationId },
      });
      if (!result.ok) return problem(result.status || 400, "Trade command failed", result.error, id);
      return json({ ok: true, trade: result.trade });
    }

    if (path === "/api/treaties" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      const myTreaties = gate.s.treaties.filter(t => t.parties.includes(gate.session.nationId) || gate.session.role === "gm");
      return json({ treaties: myTreaties });
    }

    if (path === "/api/treaties" && req.method === "POST") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      const body = await readBody(req);
      const { type, parties, secret } = body;
      if (!type || !parties || !Array.isArray(parties)) return problem(400, "Bad Request", "Missing type or parties.", id);
      const result = await applyCommand(gate.s, {
        actor: gate.session.role,
        kind: "treaty.create",
        payload: { type, parties, secret },
      });
      return json({ ok: true, treaty: result.treaty });
    }

    if (path.startsWith("/api/treaties/") && req.method === "POST") {
      const treatyId = path.split("/").pop();
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      const body = await readBody(req);
      const kind = body.betray ? "treaty.betray" : "treaty.sign";
      const result = await applyCommand(gate.s, {
        actor: gate.session.role,
        kind,
        payload: { id: treatyId, nationId: gate.session.nationId },
      });
      if (!result.ok) return problem(result.status || 400, "Treaty command failed", result.error, id);
      return json({ ok: true, treaty: result.treaty || { ok: true } });
    }

    if (path === "/api/gm/flags" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      if (gate.session.role !== "gm") return problem(403, "Forbidden", "Game Master only.", id);
      const flags = gate.s.eventLog.filter(ev => ev.kind === "message.flagged");
      return json({ flags });
    }

    const nationGet = path.match(/^\/api\/nations\/([^/]+)$/);
    if (nationGet && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      const n = gate.state.nations.find((x) => x.id === nationGet[1] || x.key === nationGet[1]);
      if (!n) return problem(404, "Not found", "Unknown nation.", id);
      const units = gate.state.units.filter((u) => u.nationId === n.id);
      const colonies = gate.state.colonies.filter((c) => c.nationId === n.id);
      return json({ nation: n, units, colonies });
    }

    if (path === "/api/gm/logins" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      if (gate.session.role !== "gm") return problem(403, "Forbidden", "Game Master only.", id);
      return json({ logins: gmLogins(gate.s) });
    }

    if (path.startsWith("/api/files/upload") && req.method === "POST") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      if (gate.session.role !== "gm") return problem(403, "Forbidden", "Game Master only.", id);

      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return problem(400, "Bad Request", "No file uploaded.", id);
      }

      try {
        const { saveUpload } = await import("../lib/files.js");
        const buffer = Buffer.from(await file.arrayBuffer());
        const { filename } = await saveUpload(file.name, buffer, file.type);
        return json({ ok: true, filename });
      } catch (err) {
        log(id, "error", { err: String(err) });
        return problem(500, "Internal error", "File upload failed.", id);
      }
    }

    if (path.startsWith("/api/files/download/") && req.method === "GET") {
      const filename = path.split("/").pop();
      if (!filename) return problem(400, "Bad Request", "Missing filename.", id);

      const { join } = await import("node:path");
      const { readFile } = await import("node:fs/promises");
      const { envOr } = await import("../lib/env.js");

      try {
        const content = await readFile(join(envOr("UPLOADS_DIR", "uploads"), filename));
        return new Response(content, {
          headers: { "Content-Type": "application/octet-stream" }
        });
      } catch {
        return problem(404, "Not found", "File not found.", id);
      }
    }

    const vitals = path.match(/^\/api\/gm\/nations\/([^/]+)\/vitals$/);
    if (vitals && req.method === "PATCH") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      if (gate.session.role !== "gm") return problem(403, "Forbidden", "Game Master only.", id);
      const body = await readBody(req);

      log(id, "audit", {
        actor: "gm",
        actAs: req.headers.get("x-act-as"),
        action: "nation.vitals",
        nationId: vitals[1]
      });

      const result = await applyCommand(gate.s, {
        actor: "gm",
        actAs: req.headers.get("x-act-as"),
        kind: "nation.vitals",
        payload: { ...body, id: vitals[1] },
      });
      if (!result.ok) return problem(result.status || 400, "Command failed", result.error, id);
      return json({ ok: true, nation: result.nation, state: visibleState(gate.s, gate.session) });
    }

    const orderSeason = path.match(/^\/api\/orders\/([^/]+)$/);
    if (orderSeason && (req.method === "GET" || req.method === "PUT")) {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      const season = Number(orderSeason[1]);
      const nationId = resolveNationId(gate, url, req.method === "PUT" ? await peekNation(req) : null);
      if (!nationId) return problem(403, "Forbidden", "No nation.", id);
      if (req.method === "GET") {
        const nation = gate.s.nations.find((n) => n.id === nationId);
        const units = gate.s.units.filter((u) => u.nationId === nationId);
        const row = findOrder(gate.s, nationId, season);
        const payload = row?.payload;
        const validation = validateOrder(nation, units, payload || {}, {
          locked: Boolean(gate.s.game.settings.ordersLocked) && gate.session.role !== "gm",
          reflectionRequired: Boolean(gate.s.game.settings.reflectionRequired),
        });
        return json({
          order: publicOrder(row) || {
            id: null,
            nationId,
            season,
            status: "empty",
            payload: validation.order,
            submittedAt: null,
            version: 0,
          },
          validation,
        });
      }
      const body = await readBody(req);
      const result = await applyCommand(gate.s, {
        actor: gate.session.role,
        actAs: gate.session.role === "gm" ? nationId : null,
        kind: "order.save",
        payload: { nationId, season, payload: body.payload || body, version: body.version },
      });
      if (!result.ok) return orderFail(result, id);
      return json({ ok: true, order: result.order, validation: result.validation });
    }

    const orderSubmit = path.match(/^\/api\/orders\/([^/]+)\/submit$/);
    if (orderSubmit && req.method === "POST") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      const season = Number(orderSubmit[1]);
      const body = await readBody(req);
      const nationId = resolveNationId(gate, url, body.nationId);
      if (!nationId) return problem(403, "Forbidden", "No nation.", id);

      log(id, "audit", {
        actor: gate.session.role,
        actAs: gate.session.role === "gm" ? nationId : null,
        action: "order.submit",
        season,
        nationId
      });

      const result = await applyCommand(gate.s, {
        actor: gate.session.role,
        actAs: gate.session.role === "gm" ? nationId : null,
        kind: "order.submit",
        payload: { nationId, season, payload: body.payload || body, version: body.version },
      });
      if (!result.ok) return orderFail(result, id);
      return json({ ok: true, order: result.order, validation: result.validation, state: visibleState(gate.s, gate.session) });
    }

    if (path === "/api/gm/orders" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      if (gate.session.role !== "gm") return problem(403, "Forbidden", "Game Master only.", id);
      const season = Number(url.searchParams.get("season") || gate.s.game.season);
      return json({ orders: listOrders(gate.s, season) });
    }

    if (path === "/api/gm/backup" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      if (gate.session.role !== "gm") return problem(403, "Forbidden", "Game Master only.", id);

      try {
        const { createBackup } = await import("../lib/backup.js");
        const { filename } = await createBackup(gate.s);
        return json({ ok: true, filename });
      } catch (err) {
        log(id, "error", { err: String(err) });
        return problem(500, "Internal error", "Backup failed.", id);
      }
    }

    if (path === "/api/gm/restore" && req.method === "POST") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      if (gate.session.role !== "gm") return problem(403, "Forbidden", "Game Master only.", id);

      try {
        const body = await readBody(req);
        const { restoreBackup } = await import("../lib/backup.js");
        await restoreBackup(JSON.stringify(body));
        return json({ ok: true });
      } catch (err) {
        log(id, "error", { err: String(err) });
        return problem(400, "Bad Request", err.message, id);
      }
    }

    if (path === "/api/gm/export/reflections" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      if (gate.session.role !== "gm") return problem(403, "Forbidden", "Game Master only.", id);

      try {
        const { exportToCSV, saveCSV } = await import("../lib/export.js");
        const reflections = gate.s.orders.map(o => ({
          nationId: o.nationId,
          season: o.season,
          reflection: o.reflection
        }));
        const csv = exportToCSV(reflections, ["nationId", "season", "reflection"]);
        const filename = `reflections-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
        await saveCSV(filename, csv);
        return json({ ok: true, filename });
      } catch (err) {
        log(id, "error", { err: String(err) });
        return problem(500, "Internal error", "Export failed.", id);
      }
    }

    if (path === "/api/gm/export/log" && req.method === "GET") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      if (gate.session.role !== "gm") return problem(403, "Forbidden", "Game Master only.", id);

      try {
        const { exportToCSV, saveCSV } = await import("../lib/export.js");
        const csv = exportToCSV(gate.s.eventLog, ["id", "at", "actor", "actAs", "kind"]);
        const filename = `event-log-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
        await saveCSV(filename, csv);
        return json({ ok: true, filename });
      } catch (err) {
        log(id, "error", { err: String(err) });
        return problem(500, "Internal error", "Export failed.", id);
      }
    }

    const loginPut = path.match(/^\/api\/gm\/nations\/([^/]+)\/login$/);
    if (loginPut && req.method === "PUT") {
      if (!gate.session) return problem(401, "Unauthorized", "No session.", id);
      if (gate.session.role !== "gm") return problem(403, "Forbidden", "Game Master only.", id);
      const body = await readBody(req);

      log(id, "audit", {
        actor: "gm",
        action: "nation.login",
        nationId: loginPut[1]
      });

      const result = await applyCommand(gate.s, {
        actor: "gm",
        kind: "nation.login",
        payload: { id: loginPut[1], codeword: body.codeword },
      });
      if (!result.ok) return problem(result.status || 400, "Command failed", result.error, id);
      return json({ ok: true, logins: gmLogins(gate.s) });
    }

    return problem(404, "Not found", path, id);
  } catch (err) {
    log(id, "error", { err: String(err) });
    return problem(500, "Internal error", "Staff officers dropped a tray.", id);
  }
};

export const config = {
  path: "/api/*",
};

async function gated(cookies, id) {
  const token = readToken(cookies);
  const s = await ensureStore();
  const session = getSession(s, token);
  if (!session) return { response: problem(401, "Unauthorized", "No session.", id), s, session: null, state: null };
  return { s, session, state: visibleState(s, session), response: null };
}

function resolveNationId(gate, url, requested) {
  if (gate.session.role === "student") return gate.session.nationId;
  const id = requested || url.searchParams.get("nation");
  if (id && gate.s.nations.some((n) => n.id === id)) return id;
  return gate.s.nations[0]?.id || null;
}

function orderFail(result, id) {
  if (result.status === 422) {
    return json({ ok: false, error: result.error, validation: result.validation }, 422);
  }
  return problem(result.status || 400, "Command failed", result.error, id);
}

/** @param {Request} req */
async function peekNation(req) {
  try {
    const clone = req.clone();
    const body = await clone.json();
    return body.nationId || null;
  } catch {
    return null;
  }
}

function authFail(result, id) {
  if (result.status === 429) {
    return problem(429, "Too many requests", "Too many attempts. Stand down and try later.", id);
  }
  return problem(401, "Unauthorized", "Duty officer does not recognise those papers.", id);
}

function withPendingCookies(res, cookies) {
  const pending = cookies.pending;
  if (!pending?.length) return res;
  const headers = new Headers(res.headers);
  for (const c of pending) headers.append("set-cookie", c);
  return new Response(res.body, { status: res.status, headers });
}

async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
