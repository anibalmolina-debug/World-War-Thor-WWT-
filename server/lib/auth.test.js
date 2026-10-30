import { afterEach, describe, expect, it } from "vitest";
import handler from "../functions/api.js";
import { resetStoreForTests } from "./store.js";
import { caesar, CORE_VERSION } from "./cipher.js";
import { normalizeCodeword } from "./crypto-box.js";

afterEach(() => {
  resetStoreForTests();
});

function cookiesHeader(res) {
  const raw = res.headers.getSetCookie?.() || [];
  if (raw.length) return raw.map((c) => c.split(";")[0]).join("; ");
  const single = res.headers.get("set-cookie");
  return single ? single.split(";")[0] : "";
}

async function call(path, { method = "GET", body, cookie } = {}) {
  const headers = { "x-wwt-csrf": "1" };
  if (body) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  const req = new Request("http://wwt.test" + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return handler(req, { ip: "203.0.113.9", requestId: "test" });
}

describe("health", () => {
  it("reports core version and memory store", async () => {
    const res = await call("/api/health");
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.coreVersion).toBe(CORE_VERSION);
  });
});

describe("cipher", () => {
  it("matches the C++ golden case", () => {
    expect(caesar("Attack at dawn!", 4)).toBe("Exxego ex hear!");
    expect(caesar("Exxego ex hear!", -4)).toBe("Attack at dawn!");
  });
});

describe("codeword", () => {
  it("normalises case, accents and punctuation", () => {
    expect(normalizeCodeword("  KéStrel! ")).toBe("kestrel");
  });
});

describe("auth", () => {
  it("rejects unknown codewords with a generic error", async () => {
    const res = await call("/api/auth/login", { method: "POST", body: { codeword: "nope" } });
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.detail).toMatch(/recognise/i);
  });

  it("logs a student in and hides other nations' vitals", async () => {
    const res = await call("/api/auth/login", { method: "POST", body: { codeword: "kestrel" } });
    expect(res.status).toBe(200);
    const cookie = cookiesHeader(res);
    expect(cookie).toMatch(/wwt_session=/);
    const me = await call("/api/state", { cookie });
    const state = await me.json();
    expect(state.viewer.role).toBe("student");
    expect(state.nation.name).toBe("Germany");
    const britain = state.nations.find((n) => n.key === "britain");
    expect(britain.ic).toBeUndefined();
    expect(britain.loginHash).toBeUndefined();
    expect(britain.loginEnc).toBeUndefined();
  });

  it("lets the GM see every nation's vitals", async () => {
    const res = await call("/api/auth/gm", { method: "POST", body: { password: "warcabinet" } });
    const cookie = cookiesHeader(res);
    const me = await call("/api/auth/me", { cookie });
    const state = await me.json();
    expect(state.viewer.role).toBe("gm");
    const britain = state.nations.find((n) => n.key === "britain");
    expect(britain.ic).toBe(12);
  });

  it("hides other nations' unit dossiers from students", async () => {
    const res = await call("/api/auth/login", { method: "POST", body: { codeword: "kestrel" } });
    const cookie = cookiesHeader(res);
    const units = await (await call("/api/units", { cookie })).json();
    const own = units.units.find((u) => u.nationId === "n-ger");
    const other = units.units.find((u) => u.nationId === "n-uk");
    expect(own.commander).toBeTruthy();
    expect(own.strPct).toBeGreaterThan(0);
    expect(other.commander).toBeUndefined();
    expect(other.intelNote).toBeUndefined();
    expect(other.name).toBeTruthy();
  });

  it("lets the GM print decrypted logins and edit vitals through the event log", async () => {
    const res = await call("/api/auth/gm", { method: "POST", body: { password: "warcabinet" } });
    const cookie = cookiesHeader(res);
    const logins = await (await call("/api/gm/logins", { cookie })).json();
    expect(logins.logins.find((l) => l.id === "n-ger").codeword).toBe("kestrel");

    const patch = await call("/api/gm/nations/n-ger/vitals", {
      method: "PATCH",
      cookie,
      body: { version: 1, ic: 16, atWar: true },
    });
    expect(patch.status).toBe(200);
    const body = await patch.json();
    expect(body.nation.ic).toBe(16);
    expect(body.nation.atWar).toBe(true);
    expect(body.nation.version).toBe(2);

    const student = await call("/api/auth/login", { method: "POST", body: { codeword: "kestrel" } });
    const studentCookie = cookiesHeader(student);
    const sync = await (await call("/api/sync?since=0", { cookie: studentCookie })).json();
    expect(sync.changes[0].state.nation.ic).toBe(16);
  });

  it("forbids students from the GM cockpit", async () => {
    const res = await call("/api/auth/login", { method: "POST", body: { codeword: "kestrel" } });
    const cookie = cookiesHeader(res);
    const patch = await call("/api/gm/nations/n-uk/vitals", {
      method: "PATCH",
      cookie,
      body: { ic: 99 },
    });
    expect(patch.status).toBe(403);
    const logins = await call("/api/gm/logins", { cookie });
    expect(logins.status).toBe(403);
  });

  it("blocks mutating calls without the CSRF header", async () => {
    const req = new Request("http://wwt.test/api/auth/logout", { method: "POST" });
    const res = await handler(req, { ip: "1.1.1.1", requestId: "x" });
    expect(res.status).toBe(403);
  });

  it("throttles repeated failures", async () => {
    let last = 401;
    for (let i = 0; i < 12; i++) {
      const res = await call("/api/auth/login", { method: "POST", body: { codeword: "wrong" } });
      last = res.status;
    }
    expect(last).toBe(429);
  });
});
