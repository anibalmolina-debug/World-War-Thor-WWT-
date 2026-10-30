// @ts-check
import { applyOps } from "./dom_applier.js";
import { api } from "./net.js";
import { getPref, setPref, wipePrefs } from "./storage.js";
import { parseRoute, shiftResource, view, viewedNation } from "./app.js";
import { emptyOrder, liveValidation } from "./orders.js";
import { t } from "./i18n.js";
import { MapRoom } from "./map.js";

const root = document.getElementById("app");
const crash = document.getElementById("line-down");

/** @type {any} */
let store = {
  lang: getPref("lang") === "es" ? "es" : "en",
  theme: getPref("theme") || "paper",
  route: "login",
  showPw: false,
  gmMode: false,
  error: "",
  loading: false,
  ticker: 0,
  state: null,
  viewNationId: "",
  draft: null,
  modal: null,
  toast: "",
  logins: [],
  orderDraft: null,
  orderMeta: null,
  orderSave: "",
  orderUi: { branch: "" },
};

// ponytail: simplest immutable store is a function that returns a new object.
function dispatch(action, payload) {
  const next = { ...store };
  switch (action) {
    case "set-lang": next.lang = payload; break;
    case "set-theme": next.theme = payload; break;
    case "set-route": next.route = payload; break;
    case "set-loading": next.loading = payload; break;
    case "set-error": next.error = payload; break;
    case "set-state": next.state = payload; break;
    case "set-modal": next.modal = payload; break;
    case "set-toast": next.toast = payload; break;
    case "toggle-pw": next.showPw = !store.showPw; break;
    case "toggle-gm": next.gmMode = !store.gmMode; break;
    case "set-viewNation": next.viewNationId = payload; break;
    case "set-draft": next.draft = payload; break;
    case "set-logins": next.logins = payload; break;
    default: return store;
  }
  store = next;
  render();
  return store;
}

let orderTimer = 0;

document.documentElement.dataset.theme = store.theme;

function render() {
  if (!root) return;
  applyOps(root, [{ t: "replace", html: view(store) }]);
  document.documentElement.lang = store.lang;
  document.documentElement.dataset.theme = store.theme;
  if (store.route === "map") {
    const mount = document.getElementById("map-room-mount");
    if (mount) new MapRoom(mount, store);
  }
}

function boom(err) {
  console.error(err);
  if (crash) {
    crash.hidden = false;
    const title = crash.querySelector("[data-id=crash-title]");
    const body = crash.querySelector("[data-id=crash-body]");
    if (title) title.textContent = t(store.lang, "lineDown.title");
    if (body) body.textContent = t(store.lang, "lineDown.body");
  }
}

function toast(msg) {
  dispatch("set-toast", msg);
  setTimeout(() => {
    if (store.toast === msg) {
      dispatch("set-toast", "");
    }
  }, 2400);
}

function syncDraft() {
  const n = viewedNation(store);
  store.draft = n
    ? {
        ...n,
        resources: { ...(n.resources || {}) },
      }
    : null;
}

window.addEventListener("error", (e) => boom(e.error || e.message));
window.addEventListener("unhandledrejection", (e) => boom(e.reason));

root?.addEventListener("change", (ev) => {
  const target = /** @type {HTMLElement} */ (ev.target);
  if (target.matches("[data-action=select-nation]")) {
    const id = /** @type {HTMLSelectElement} */ (target).value;
    dispatch("set-viewNation", id);
    syncDraft();
    if (store.route === "orders") loadOrder();
  }
  if (target.matches("[data-order-field]")) {
    writeOrderField(/** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} */ (target));
    scheduleOrderSave();
    if (target.tagName === "SELECT" || /** @type {HTMLInputElement} */ (target).type === "range") render();
  }
  if (target.matches("[data-flag]")) {
    if (!store.draft) return;
    const key = target.getAttribute("data-flag");
    const nextDraft = { ...store.draft };
    nextDraft[key] = /** @type {HTMLInputElement} */ (target).checked;
    dispatch("set-draft", nextDraft);
  }
});

root?.addEventListener("click", (ev) => {
  const target = /** @type {HTMLElement} */ (ev.target);
  const btn = target.closest("[data-action], [data-route]");
  if (!btn) return;
  const action = btn.getAttribute("data-action");
  const route = btn.getAttribute("data-route");
  if (route) {
    ev.preventDefault();
    location.hash = "#/" + route;
    return;
  }
  if (action === "toggle-pw") {
    ev.preventDefault();
    dispatch("toggle-pw");
  }
  if (action === "toggle-theme") {
    ev.preventDefault();
    const theme = store.theme === "blackout" ? "paper" : "blackout";
    setPref("theme", theme);
    dispatch("set-theme", theme);
  }
  if (action === "toggle-lang") {
    ev.preventDefault();
    const lang = store.lang === "en" ? "es" : "en";
    setPref("lang", lang);
    dispatch("set-lang", lang);
  }
  if (action === "mode-gm") {
    ev.preventDefault();
    dispatch("toggle-gm");
    dispatch("set-error", "");
  }
  if (action === "mode-student") {
    ev.preventDefault();
    dispatch("toggle-gm");
    dispatch("set-error", "");
  }
  if (action === "clear") {
    ev.preventDefault();
    wipePrefs();
    api("POST", "/api/auth/logout").finally(() => {
      dispatch("set-state", null);
      dispatch("set-route", "login");
    });
  }
  if (action === "leave") {
    ev.preventDefault();
    api("POST", "/api/auth/logout").then(() => {
      dispatch("set-state", null);
      location.hash = "#/login";
    });
  }
  if (action === "resync") {
    ev.preventDefault();
    bootstrap();
  }
  if (action === "open-unit") {
    ev.preventDefault();
    dispatch("set-modal", { type: "unit", id: btn.getAttribute("data-id") });
  }
  if (action === "open-colony") {
    ev.preventDefault();
    dispatch("set-modal", { type: "colony", id: btn.getAttribute("data-id") });
  }
  if (action === "close-modal") {
    ev.preventDefault();
    dispatch("set-modal", null);
  }
  if (action === "step") {
    ev.preventDefault();
    if (!store.draft) return;
    const field = btn.getAttribute("data-field");
    const delta = Number(btn.getAttribute("data-delta"));
    const nextDraft = { ...store.draft };
    nextDraft[field] = Number(nextDraft[field] || 0) + delta;
    if (field === "stability" || field === "diplomacy") {
      nextDraft[field] = Math.max(0, Math.min(10, nextDraft[field]));
    }
    if (nextDraft[field] < 0) nextDraft[field] = 0;
    dispatch("set-draft", nextDraft);
  }
  if (action === "res-up" || action === "res-down") {
    ev.preventDefault();
    if (!store.draft) return;
    const key = btn.getAttribute("data-key");
    const levels = store.state.catalog.resourceLevels;
    const nextResources = { ...store.draft.resources };
    nextResources[key] = shiftResource(nextResources[key], action === "res-up" ? 1 : -1, levels);
    dispatch("set-draft", { ...store.draft, resources: nextResources });
  }
  if (action === "save-vitals") {
    ev.preventDefault();
    saveVitals();
  }
  if (action === "load-logins") {
    ev.preventDefault();
    loadLogins();
  }
  if (action === "print") {
    ev.preventDefault();
    window.print();
  }
});

root?.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const form = /** @type {HTMLFormElement} */ (ev.target);
  const secret = new FormData(form).get("secret");
  store.loading = true;
  store.error = "";
  render();
  const path = store.gmMode ? "/api/auth/gm" : "/api/auth/login";
  const body = store.gmMode ? { password: secret } : { codeword: secret };
  const res = await api("POST", path, body);
  store.loading = false;
  if (!res.ok) {
    store.error = res.status === 429 ? t(store.lang, "login.throttled") : t(store.lang, "login.error");
    render();
    return;
  }
  location.hash = "#/dashboard";
  await bootstrap();
});

window.addEventListener("hashchange", () => {
  if (!store.state?.viewer) {
    render();
    return;
  }
  store.route = parseRoute();
  setPref("tab", store.route);
  render();
});

async function bootstrap() {
  dispatch("set-loading", true);
  const res = await api("GET", "/api/auth/me");
  dispatch("set-loading", false);
  if (!res.ok) {
    dispatch("set-state", null);
    return;
  }
  const state = res.data;
  const route = parseRoute() === "login" ? "dashboard" : parseRoute();
  let viewNationId = store.viewNationId;
  if (state.viewer.role === "gm" && !viewNationId) {
    viewNationId = state.nations[0]?.id || "";
  }
  if (state.viewer.role === "student") viewNationId = state.nation?.id || "";

  dispatch("set-state", state);
  dispatch("set-route", route);
  dispatch("set-viewNation", viewNationId);
  syncDraft();
}

async function saveVitals() {
  const n = viewedNation(store);
  if (!n || !store.draft) return;
  store.loading = true;
  render();
  const res = await api("PATCH", `/api/gm/nations/${n.id}/vitals`, {
    version: n.version,
    ic: store.draft.ic,
    treasuryM: store.draft.treasuryM,
    manpower: store.draft.manpower,
    stability: store.draft.stability,
    diplomacy: store.draft.diplomacy,
    atWar: store.draft.atWar,
    uraniumAccess: store.draft.uraniumAccess,
    playable: store.draft.playable,
    resources: store.draft.resources,
  });
  store.loading = false;
  if (!res.ok) {
    toast(t(store.lang, res.status === 409 ? "gm.stale" : "gm.saveFail"));
    return;
  }
  store.state = res.data.state;
  syncDraft();
  toast(t(store.lang, "gm.saved"));
}

async function loadLogins() {
  const res = await api("GET", "/api/gm/logins");
  if (!res.ok) {
    toast(t(store.lang, "gm.saveFail"));
    return;
  }
  store.logins = res.data.logins;
  render();
}

async function poll() {
  if (!store.state?.viewer) return;
  const res = await api("GET", `/api/sync?since=${store.state.cursor || 0}`);
  if (!res.ok || !res.data.changes?.length) return;
  const next = res.data.changes.find((c) => c.kind === "state");
  if (next?.state) {
    dispatch("set-state", next.state);
    syncDraft();
  }
}

setInterval(() => {
  if (store.state?.news?.length) {
    store.ticker = (store.ticker + 1) % store.state.news.length;
    const line = root?.querySelector(".c-ticker__line");
    if (line) line.textContent = store.state.news[store.ticker];
  }
}, 4000);

setInterval(() => {
  poll().catch(() => {});
}, 8000);

bootstrap().catch(boom);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(err => console.error('SW reg failed:', err));
  });
}

