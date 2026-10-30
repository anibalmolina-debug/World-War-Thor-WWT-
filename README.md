# World War Thor — clean-room rebuild

Tactical bunker console for a classroom wargame. Same *kind* of tool as the
original cabinet app, written from a staged plan, not from that site's source.

## Slice S2 (this checkout)

Login, then read a nation's engine, resource ledger, colonies, and armed
forces. Game Masters can switch nations, edit vitals (event-logged), and
print classroom logins. Later slices add orders, finalize, map, and the AI GM.

## Run locally

```bash
npm install
npm test
npm run dev
```

Open http://127.0.0.1:4173

Demo seed (local only):

- Nation codeword: `kestrel` (Germany)
- Also playable: `dover` (United Kingdom)
- Game Master password: `warcabinet`

## Layout

See the rebuild plan. Short version: C++ rules in `core/`, C++ UI in `ui/`,
thin JS glue in `web/glue/`, CSS GUI in `web/css/`, Netlify functions in
`server/`.

## Permission

Record teacher/school OK in `docs/PERMISSION.md` before any class use.
