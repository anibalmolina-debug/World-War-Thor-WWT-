// @ts-check
/** JS stand-in for wwt_ui.wasm (Phase F3/F4). Same classes/data-* the CSS expects. */
import { t } from "./i18n.js";
import { ordersView } from "./orders.js";
import { mapView } from "./map.js";

const TABS = [
  { id: "dashboard", key: "tab.dashboard", roles: ["student", "gm"] },
  { id: "map", key: "tab.map", roles: ["student", "gm"] },
  { id: "forge", key: "tab.forge", roles: ["student", "gm"] },
  { id: "orders", key: "tab.orders", roles: ["student", "gm"] },
  { id: "wire", key: "tab.wire", roles: ["student", "gm"] },
  { id: "treaties", key: "tab.treaties", roles: ["student", "gm"], badge: "treaties" },
  { id: "archives", key: "tab.archives", roles: ["student", "gm"] },
  { id: "gm", key: "tab.gm", roles: ["gm"], badge: "gm" },
  { id: "guide", key: "tab.guide", roles: ["student", "gm"] },
  { id: "roster", key: "tab.roster", roles: ["gm"] },
];

/**
 * @param {{ lang: 'en'|'es', theme: string, route: string, showPw: boolean, gmMode: boolean, error: string, loading: boolean, ticker: number, state: any, viewNationId: string, modal: any, toast: string, logins: any[] }} store
 */
export function view(store) {
  const L = (k) => t(store.lang, k);
  if (!store.state?.viewer) return loginView(store, L);
  return shellView(store, L);
}

function loginView(store, L) {
  const gm = store.gmMode;
  return `
    <div class="s-login" data-theme="${esc(store.theme)}">
      <header class="s-login__top">
        <div class="c-radar" aria-hidden="true"></div>
        <div class="s-login__tools">
          <button type="button" class="c-button c-button--ghost" data-action="toggle-lang">${store.lang === "en" ? "ES" : "EN"}</button>
          <button type="button" class="c-button c-button--ghost" data-action="toggle-theme">${store.theme === "blackout" ? L("theme.day") : L("theme.night")}</button>
        </div>
      </header>
      <form class="c-panel c-panel--folder s-login__card" data-action="login" data-id="login-form">
        <div class="c-stamp" aria-hidden="true">TOP SECRET</div>
        <p class="s-login__file">${L("login.file")}</p>
        <p class="s-login__ver">Rebuild 0.3.0 · orders slice</p>
        <h1 class="s-login__title">${L("app.title")}</h1>
        <p class="s-login__lead">${L("login.lead")}</p>
        <hr class="c-rule" />
        <div class="c-tabs c-tabs--pair" role="tablist">
          <button type="button" class="c-tabs__tab" data-action="mode-student" aria-selected="${!gm}">${L("login.student")}</button>
          <button type="button" class="c-tabs__tab" data-action="mode-gm" aria-selected="${gm}">${L("login.gm")}</button>
        </div>
        <label class="c-field">
          <span>${gm ? L("login.gmPassword") : L("login.codeword")}</span>
          <span class="c-field__row">
            <input id="codeword" name="secret" class="c-input" autocomplete="${gm ? "current-password" : "off"}" spellcheck="false" placeholder="${L("login.placeholder")}" type="${store.showPw ? "text" : "password"}" />
            <button type="button" class="c-button c-button--ghost" data-action="toggle-pw">${store.showPw ? L("login.hide") : L("login.show")}</button>
          </span>
        </label>
        ${store.error ? `<p class="c-field__error" role="alert">${esc(store.error)}</p>` : ""}
        <button type="submit" class="c-button c-button--stamp">${L("login.report")}</button>
        <button type="button" class="c-link" data-action="clear">${L("login.clear")}</button>
      </form>
      ${store.loading ? overlay(L("overlay.crypto")) : ""}
    </div>`;
}

function shellView(store, L) {
  const v = store.state.viewer;
  const g = store.state.game;
  const role = v.role;
  const tabs = TABS.filter((tab) => tab.roles.includes(role));
  const route = store.route || "dashboard";
  return `
    <div class="l-app" data-theme="${esc(store.theme)}">
      <header class="l-header">
        <div class="l-header__brand">
          <div class="c-radar c-radar--sm" aria-hidden="true"></div>
          <strong class="l-header__title">${L("app.title")}</strong>
        </div>
        <dl class="l-status">
          <div><dt>${L("header.week")}</dt><dd>${g.week}</dd></div>
          <div><dt>${L("header.season")}</dt><dd>${esc(g.seasonLabel)}</dd></div>
          <div><dt>${L("header.tension")}</dt><dd>${g.tension}</dd></div>
          <div><dt>${L("header.crisis")}</dt><dd>${g.crisisCount}</dd></div>
        </dl>
        <div class="l-header__actions">
          <span class="c-chip" data-state="ok">${L("header.sync")}</span>
          <button type="button" class="c-button c-button--ghost" data-action="resync">${L("header.resync")}</button>
          <button type="button" class="c-button c-button--ghost" data-action="leave">${L("header.leave")}</button>
        </div>
      </header>
      <div class="c-ticker" role="status">
        <span class="c-ticker__line">${esc(store.state.news[store.ticker % store.state.news.length] || "")}</span>
        <span class="c-ticker__open">${L("ticker.open")}</span>
      </div>
      <nav class="l-tabs" aria-label="War room">
        ${tabs
          .map((tab) => {
            const on = route === tab.id;
            const count = tab.badge ? store.state.badges[tab.badge] : 0;
            return `<a class="l-tabs__item" data-route="${tab.id}" href="#/${tab.id}" aria-current="${on ? "page" : "false"}">${L(tab.key)}${count ? `<span class="c-badge">${count}</span>` : ""}</a>`;
          })
          .join("")}
      </nav>
      <main id="main" class="l-main">
        <div class="s-war-room">
          ${mainView(store, L, route)}
        </div>
      </main>
      <footer class="l-footer">
        <span>${L("footer.careless")}</span>
        <span>v0.3.0 · core ${esc(store.state.coreVersion)}</span>
      </footer>
      ${store.toast ? `<p class="c-toast" role="status">${esc(store.toast)}</p>` : ""}
      ${store.modal ? modalView(store, L) : ""}
      ${store.loading ? overlay(L("overlay.staff")) : ""}
    </div>`;
}

function mainView(store, L, route) {
  if (route === "dashboard") return dashboard(store, L);
  if (route === "map") return mapView(store, L);
  if (route === "orders") return ordersView(store, L, viewedNation(store));
  if (route === "roster") return rosterView(store, L);
  if (route === "wire") return wireView(store, L);
  if (route === "treaties") return treatiesView(store, L);
  if (route === "forge") return forgeView(store, L);
  if (route === "archives") return archivesView(store, L);
  if (route === "guide") return guideView(store, L);
  if (route === "gm") return gmWarRoom(store, L);
  return `<section class="c-panel s-placeholder"><h2>${L("tab." + route)}</h2><p>${L("placeholder.room")}</p></section>`;
}

export function viewedNation(store) {
  const st = store.state;
  if (!st) return null;
  if (st.viewer.role === "student") return st.nation;
  const id = store.viewNationId || st.nations[0]?.id;
  return st.nations.find((n) => n.id === id) || st.nations[0] || null;
}

function dashboard(store, L) {
  const n = viewedNation(store);
  const gm = store.state.viewer.role === "gm";
  if (!n) return `<section class="c-panel"><p>${L("dash.empty")}</p></section>`;
  const units = store.state.units.filter((u) => u.nationId === n.id);
  const colonies = store.state.colonies.filter((c) => c.nationId === n.id);
  const chaosLocal = store.state.chaosEvents.filter((e) => e.nationId === n.id);
  const chaosGlobal = store.state.chaosEvents.filter((e) => e.scope === "global");
  const pacts = store.state.pacts.filter((p) => p.parties.includes(n.id));
  const simple = store.state.simpleView;
  return `
    <section class="s-dash">
      <header class="s-dash__head">
        <div>
          <h1>${esc(n.name)}</h1>
          <p>${esc(n.government)} · Tech ${roman(n.techRank)}${n.atWar ? ` · ${L("dash.atWar")}` : ""}</p>
        </div>
        ${
          gm
            ? `<label class="c-field s-dash__pick"><span>${L("dash.acting")}</span>
            <select class="c-select" data-action="select-nation">${store.state.nations
              .map((x) => `<option value="${esc(x.id)}" ${x.id === n.id ? "selected" : ""}>${esc(x.name)}${x.playable ? "" : " · AI"}</option>`)
              .join("")}</select></label>`
            : ""
        }
      </header>
      ${gm ? gmCockpit(store, n, L) : ""}
      <section class="c-panel">
        <h2>${L("dash.engine")}</h2>
        <div class="s-dash__grid">
          ${stat(L("stat.ic"), n.ic, L("stat.icHint"))}
          ${stat(L("stat.nt"), n.treasuryM != null ? "$" + n.treasuryM + "M" : "—", L("stat.ntHint"))}
          ${stat(L("stat.mp"), n.manpower ?? "—", L("stat.mpHint"))}
          ${stat(L("stat.ns"), n.stability != null ? n.stability + "/10" : "—", L("stat.nsHint"))}
          ${stat(L("stat.ds"), n.diplomacy != null ? n.diplomacy + "/10" : "—", L("stat.dsHint"))}
          ${stat(L("stat.tr"), roman(n.techRank), L("stat.trHint"))}
        </div>
        <div class="s-dash__two">
          <div class="s-dash__chaos">
            <h3>${L("dash.chaos")}</h3>
            <ul class="c-plain">${[...chaosLocal, ...chaosGlobal].map((e) => `<li><span class="c-badge c-badge--sm">${esc(e.scope)}</span> ${esc(e.text)}</li>`).join("") || `<li>${L("dash.none")}</li>`}</ul>
          </div>
          <div class="s-dash__pacts">
            <h3>${L("dash.pacts")}</h3>
            <ul class="c-plain">${pacts.map((p) => `<li>${esc(p.terms)} <span class="c-badge c-badge--sm">${esc(p.type)}</span></li>`).join("") || `<li>${L("dash.none")}</li>`}</ul>
          </div>
        </div>
      </section>
      <section class="c-panel">
        <h2>${L("dash.ledger")}</h2>
        <div class="s-dash__ledger">
          <ul class="c-resource-list">
            ${Object.entries(n.resources || {})
              .map(([k, v]) => `<li class="c-resource-level" data-level="${levelData(v)}"><span>${L("res." + k)}</span><span class="c-resource-level__val">${L("lvl." + v)}</span></li>`)
              .join("")}
          </ul>
          ${
            simple
              ? ""
              : `<div class="s-dash__vault">
          <div class="s-dash__vault-sec">
            <h3>${L("dash.tokens")}</h3>
            <ul class="c-token-row">${Object.entries(n.tokens || {})
              .map(([k, v]) => `<li class="c-token" data-count="${v}">${L("res." + k)} <b class="c-token__val">${v}/2</b></li>`)
              .join("")}</ul>
          </div>
          <div class="s-dash__vault-sec">
            <h3>${L("dash.deposits")}</h3>
            <ul class="c-plain">${(n.deposits || []).map((d) => `<li>${esc(d)}</li>`).join("") || `<li>${L("dash.none")}</li>`}</ul>
          </div>
        </div>
        ${store.state.market ? `<p class="s-dash__market">${esc(store.state.market.note)}</p> ` : ""}`
        }
        </div>
      </section>
      <section class="c-panel">
        <h2>${L("dash.colonies")}</h2>
        <div class="s-dash__cards">
          ${
            colonies
              .map(
                (c) => `<button type="button" class="c-card" data-action="open-colony" data-id="${esc(c.id)}">
              <strong>${esc(c.name)}</strong>
              <span class="c-card__status">${esc(c.status)}</span>
            </button>`,
                )
              .join("") || `<p>${L("dash.none")}</p>`
          }
        </div>
      </section>
      <section class="c-panel">
        <h2>${L("dash.forces")}</h2>
        <p class="s-dash__legend">${L("dash.legend")}</p>
        <div class="s-dash__cards">
          ${units
            .map((u) => {
              const band = integrityBand(u.strPct);
              return `<button type="button" class="c-card c-unit" data-action="open-unit" data-id="${esc(u.id)}">
                <span class="c-unit__type">${esc(u.type)}</span>
                <strong class="c-unit__name">${esc(u.name)}</strong>
                <span class="c-unit__loc">${esc(u.location)}</span>
                ${u.strPct != null ? `<span class="c-meter" data-state="${band}" data-pct="${Math.round(u.strPct / 5) * 5}" aria-label="${u.strPct}%"><i></i></span>` : ""}
                ${u.exp ? `<span class="c-chip">${esc(u.exp)}</span>` : ""}
              </button>`;
            })
            .join("")}
        </div>
      </section>
    </section>`;
}

function gmCockpit(store, n, L) {
  const d = store.draft || n;
  return `
    <section class="c-panel s-dash__cockpit">
      <h2>${L("gm.cockpit")}</h2>
      <p class="s-dash__legend">${L("gm.cockpitLead")}</p>
      <div class="s-dash__steppers">
        ${stepper("ic", "IC", d.ic, L)}
        ${stepper("treasuryM", "NT $M", d.treasuryM, L)}
        ${stepper("manpower", "MP", d.manpower, L)}
        ${stepper("stability", "NS", d.stability, L)}
        ${stepper("diplomacy", "DS", d.diplomacy, L)}
      </div>
      <div class="s-dash__flags">
        <label><input type="checkbox" data-flag="atWar" ${d.atWar ? "checked" : ""}/> ${L("gm.atWar")}</label>
        <label><input type="checkbox" data-flag="uraniumAccess" ${d.uraniumAccess ? "checked" : ""}/> ${L("gm.uranium")}</label>
        <label><input type="checkbox" data-flag="playable" ${d.playable ? "checked" : ""}/> ${L("gm.playable")}</label>
      </div>
      <div class="s-dash__resources">
        ${Object.entries(d.resources || {})
          .map(
            ([k, v]) => `<div class="c-resource-level" data-level="${levelData(v)}">
            <span>${L("res." + k)}</span>
            <span>
              <button type="button" class="c-button" data-action="res-down" data-key="${k}">−</button>
              <button type="button" class="c-button" data-action="res-up" data-key="${k}">+</button>
            </span>
          </div>`,
            )
          .join("")}
      </div>
      <button type="button" class="c-button c-button--stamp" data-action="save-vitals">${L("gm.save")}</button>
    </section>`;
}

function stepper(field, label, value, L) {
  return `<label class="c-stepper"><span>${esc(label)}</span>
    <span>
      <button type="button" class="c-button" data-action="step" data-field="${field}" data-delta="-1" aria-label="${L("gm.minus")}">−</button>
      <b>${esc(String(value ?? 0))}</b>
      <button type="button" class="c-button" data-action="step" data-field="${field}" data-delta="1" aria-label="${L("gm.plus")}</button>
    </span></label>`;
}

function rosterView(store, L) {
  const rows = store.logins?.length
    ? store.logins
    : store.state.nations.map((n) => ({ id: n.id, name: n.name, playable: n.playable, codeword: "••••" }));
  return `
    <section class="c-panel s-print">
      <header class="s-dash__head">
        <h1>${L("tab.roster")}</h1>
        <div>
          <button type="button" class="c-button" data-action="load-logins">${L("gm.allLogins")}</button>
          <button type="button" class="c-button" data-action="print">${L("gm.print")}</button>
        </div>
      </header>
      <table class="c-table">
        <thead><tr><th>${L("gm.nation")}</th><th>${L("gm.playable")}</th><th>${L("gm.codeword")}</th></tr></thead>
        <tbody>
          ${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.playable ? L("gm.yes") : L("gm.no")}</td><td class="c-mono">${esc(r.codeword)}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>`;
}

function forgeView(store, L) {
  return `
    <section class="s-forge">
      <header class="s-forge__head">
        <h1>${L("forge.title")}</h1>
        <p>${L("forge.lead")}</p>
      </header>
      <div class="s-forge__grid">
        ${store.state.news.map(item => `
          <article class="c-panel s-forge__article">
            <div class="c-stamp" style="font-size: 0.7rem">DISPATCH</div>
            <p class="c-mono" style="font-size: 0.8rem">${new Date().toLocaleDateString()}</p>
            <h3>${esc(item)}</h3>
            <p>Reported by Intelligence Agency.</p>
          </article>
        `).join("") || `<p>${L("dash.none")}</p>`}
      </div>
    </section>`;
}

function archivesView(store, L) {
  return `
    <section class="s-archives">
      <header class="s-archives__head">
        <h1>${L("archives.title")}</h1>
        <p>${L("archives.lead")}</p>
      </header>
      <div class="c-panel s-archives__search">
        <input type="search" class="c-input" placeholder="${L("archives.search")}" data-action="search-archives">
      </div>
      <div class="s-archives__list">
        ${store.state.reports?.map(r => `<div class="c-panel c-panel--folder"><strong>${esc(r.title)}</strong>: ${esc(r.text)}</div>`).join("") || `<p>${L("dash.none")}</p>`}
      </div>
    </section>`;
}

function guideView(store, L) {
  return `
    <section class="s-guide">
      <header class="s-guide__head">
        <h1>${L("guide.title")}</h1>
      </header>
      <div class="c-panel s-guide__search">
        <input type="search" class="c-input" placeholder="${L("guide.search")}" data-action="search-guide">
      </div>
      <article class="c-panel s-guide__content">
        <h2>Basic Operations</h2>
        <p>Refer to the Strategic Manual for order submission and resource management.</p>
        <hr class="c-rule" />
        <h3>Resource Levels</h3>
        <ul class="c-plain">
          <li>Extreme Surplus: High production.</li>
          <li>Deficit: Critical shortage.</li>
        </ul>
      </article>
    </section>`;
}

function gmWarRoom(store, L) {
  return `
    <section class="s-gm">
      <header class="s-gm__head">
        <h1>${L("gm.warroom")}</h1>
      </header>
      <div class="s-gm__grid">
        <div class="s-gm__col">
          <div class="c-panel">
            <h2>${L("gm.strategy")}</h2>
            <div class="c-accordion">
              <details open>
                <summary>Season 1: Opening Gambits</summary>
                <div class="c-plain">Intelligence logs for the first season.</div>
              </details>
              <details>
                <summary>Season 2: Escalation</summary>
                <div class="c-plain">Intelligence logs for the second season.</div>
              </details>
            </div>
          </div>
          <div class="c-panel">
            <h2>${L("gm.resolution")}</h2>
            <div class="s-gm__chat">
              <div class="c-chat-msg"><strong>System:</strong> AI resolution engine online.</div>
              <div class="c-chat-msg"><strong>GM:</strong> Resolving naval clash in North Atlantic...</div>
              <div class="c-chat-msg c-chat-msg--ai"><strong>AI:</strong> Calculated victory for Nation A (88% probability).</div>
            </div>
          </div>
        </div>
        <div class="s-gm__col">
          <div class="c-panel">
            <h2>${L("gm.battle")}</h2>
            <div class="s-gm__board">
              <div class="c-battle-slot">
                <span class="c-label">Attacker</span>
                <div class="c-roll">8</div>
                <button class="c-button c-button--ghost" data-action="override-roll">Override</button>
              </div>
              <div class="c-battle-slot">
                <span class="c-label">Defender</span>
                <div class="c-roll">4</div>
                <button class="c-button c-button--ghost" data-action="override-roll">Override</button>
              </div>
            </div>
          </div>
          <div class="c-panel">
            <h2>${L("gm.checklist")}</h2>
            <ul class="c-plain">
              <li><label><input type="checkbox" checked /> Check IC distributions</label></li>
              <li><label><input type="checkbox" checked /> Process chaos events</label></li>
              <li><label><input type="checkbox" /> Finalize tension shifts</label></li>
            </ul>
          </div>
          <div class="c-panel">
            <h2>${L("gm.balance")}</h2>
            <svg viewBox="0 0 200 100" class="s-gm__chart">
              <polyline fill="none" stroke="currentColor" stroke-width="2" points="0,80 40,60 80,70 120,30 160,40 200,10" />
            </svg>
          </div>
        </div>
      </div>
    </section>`;
}

function modalView(store, L) {
  const m = store.modal;
  if (m.type === "unit") {
    const u = store.state.units.find((x) => x.id === m.id);
    if (!u) return "";
    return dossier(L("dossier.unit"), [
      ["CO", u.commander || L("dash.classified")],
      [L("dossier.formed"), u.yearFormed || "—"],
      [L("dossier.location"), u.location],
      [L("dossier.readiness"), u.strPct != null ? u.strPct + "%" : L("dash.classified")],
      [L("dossier.exp"), u.exp || L("dash.classified")],
      [L("dossier.record"), u.serviceRecord || u.intelNote || L("dash.classified")],
    ]);
  }
  if (m.type === "submit-order") {
    const n = viewedNation(store);
    const v = m.validation;
    return `<div class="c-modal" role="dialog" aria-modal="true">
      <button type="button" class="c-modal__back" data-action="close-modal" aria-label="Close"></button>
      <article class="c-dossier">
        <h2>${L("orders.confirm")}</h2>
        <p>${esc(n?.name || "")} · ${L("orders.meters")}</p>
        <dl>
          <div><dt>IC</dt><dd>${v.meters.ic.used} / ${v.meters.ic.max}</dd></div>
          <div><dt>NT</dt><dd>${v.meters.nt.used} / ${v.meters.nt.max}</dd></div>
          <div><dt>MP</dt><dd>${v.meters.mp.used} / ${v.meters.mp.max}</dd></div>
        </dl>
        <button type="button" class="c-button c-button--stamp" data-action="submit-orders">${L("orders.submit")}</button>
        <button type="button" class="c-button" data-action="close-modal">${L("orders.cancel")}</button>
      </article>
    </div>`;
  }
  if (m.type === "colony") {
    const c = store.state.colonies.find((x) => x.id === m.id);
    if (!c) return "";
    return dossier(c.name, [
      [L("dossier.status"), c.status],
      [L("dossier.leader"), c.leader || L("dash.classified")],
      [L("dossier.ic"), c.localIc ?? L("dash.classified")],
      [L("dossier.nt"), c.localNt ?? L("dash.classified")],
      [L("dossier.notes"), c.notes || L("dash.classified")],
    ]);
  }
  return "";
}

function dossier(title, rows) {
  return `<div class="c-modal" role="dialog" aria-modal="true">
    <button type="button" class="c-modal__back" data-action="close-modal" aria-label="Close"></button>
    <article class="c-dossier">
      <button type="button" class="c-button c-button--ghost" data-action="close-modal">Close</button>
      <h2>${esc(title)}</h2>
      <dl>${rows.map(([k, v]) => `<div><dt>${esc(String(k))}</dt><dd>${esc(String(v))}</dd></div>`).join("")}</dl>
    </article>
  </div>`;
}

function integrityBand(pct) {
  if (pct == null) return "unknown";
  if (pct < 50) return "damaged";
  if (pct < 75) return "worn";
  return "ready";
}

function stat(label, value, hint) {
  return `<article class="c-panel c-stat-plate"><p class="c-stat-plate__label">${esc(label)}</p><p class="c-stat-plate__value">${esc(String(value))}</p><p class="c-stat-plate__hint">${esc(hint)}</p></article>`;
}

function overlay(msg) {
  return `<div class="c-overlay" role="alert"><p>${esc(msg)}</p></div>`;
}

function roman(n) {
  const map = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return map[n] || String(n);
}

function levelData(v) {
  return { "extreme-surplus": "2", surplus: "1", balanced: "0", deficit: "-1", "critical-deficit": "-2" }[v] || "0";
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function parseRoute() {
  const h = (location.hash || "#/dashboard").replace(/^#\/?/, "");
  const id = h.split("?")[0] || "dashboard";
  return id;
}

export function shiftResource(current, delta, levels) {
  const i = levels.indexOf(current);
  const next = i + delta;
  if (next < 0 || next >= levels.length) return current;
  return levels[next];
}
