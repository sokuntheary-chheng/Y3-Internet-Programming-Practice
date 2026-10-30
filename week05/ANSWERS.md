# Week 05 — Explain it

1. In development the HTML request for `/events/2` is answered by Vite's dev server, which serves `index.html` for every path; the browser then boots the SPA and vue-router matches `/events/:id(\d+)` to `EventDetailPage`. The event data itself is a separate fetch answered by json-server on `localhost:3000`. In production the web server must be configured with the same history fallback (for example nginx `try_files $uri /index.html`), otherwise a refresh on a deep link returns 404.

2. Not through the UI: the guard only stops Vue Router from rendering the page in the browser, it protects nothing by itself. A student can still create an event with `curl -X POST http://localhost:3000/events ...` or from the DevTools console, because json-server accepts any request. Only server-side authorization — the week 6/7 backend checking the real session and rejecting non-organisers — can actually stop them.

3. Vue reuses the same `EventDetailPage` instance when only the `:id` changes (for example navigating from `/events/1` to `/events/2`), while `onMounted` runs only on the very first mount. With `onMounted` alone the page would keep showing the previous event's data after that navigation. `watch(eventId, load, { immediate: true })` re-runs `load` on every id change and also on the initial render.

4. `storeToRefs(store)` returns refs for `events`, `status` and `error` that stay linked to the store, so the template re-renders whenever the store state changes. Plain destructuring (`const { events, status, error } = store`) reads the current values once and loses that link, so after `fetchAll` resolves the page would never update.

5. If the PATCH fails after the POST succeeded, a booking exists but `event.booked` was never increased: the seat counts in the list and header are wrong and the seats can be overbooked. The server can avoid this by doing both writes in one transaction, or by exposing a single endpoint that performs both, so either both changes land or neither does (atomicity — the week 7 fix).
