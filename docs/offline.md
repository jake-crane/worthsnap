# Offline mode and slow starts

How WorthSnap behaves when the server is slow to wake up or there's no
connection. WorthSnap is installed on phones as a Home Screen web app (PWA),
and the backend runs on Cloud Run, which can take several seconds to start
after being idle. Both cases need to feel fast and honest.

The code lives in:

- [`frontend/public/sw.js`](../frontend/public/sw.js): the service worker
  (saves the app and your data on the device)
- [`frontend/src/lib/offline.ts`](../frontend/src/lib/offline.ts):
  connection state, reading saved copies, sign-out cleanup
- [`frontend/src/lib/data.ts`](../frontend/src/lib/data.ts): page data
  loading (show what's saved, then refresh)
- [`frontend/src/App.tsx`](../frontend/src/App.tsx): startup, offline banner,
  "Updating…" note

## Requirements

### Opening the app

1. The app opens straight into your data. Once you've used it online on a
   device, launching it shows your account and the data saved last time
   right away. It doesn't wait for the server.
2. A slow server is not "offline". While fresh data is on its way, the
   header shows a small "Updating…" note next to the logo. It fades in
   only after a second, so fast refreshes don't flash it.
3. Fresh data replaces saved data as soon as the server answers, and the
   note goes away.
4. "Loading…" appears only when nothing is saved on the device yet (for
   example, the first visit). Even then it fades in after half a second, so
   it doesn't flash.
5. If the server says the session has ended (401), the app shows the sign-in
   page and removes the saved data.

### Being offline

6. The offline banner appears only when the network actually fails, or
   when a request hangs for 30 seconds while a saved copy exists. It says
   when the data on screen was saved (the oldest time, if pages differ),
   and that changes need a connection.
7. Every page you've opened online can be opened offline, showing its saved
   copy. A page that was never opened online shows "You're offline, and
   this hasn't been saved on this device yet."
8. If the app has been opened online but you were never signed in on this
   device, offline launch shows a "You're offline" screen with a Try again
   button. If the app has never been opened online at all, the service
   worker shows a plain offline page with the same message.
9. While offline, the app checks whether the server is back every 15
   seconds, and also when the device reports it's back online. When it is,
   the banner goes away and each page on screen reloads its data on its
   own.

### Making changes

10. Saving, editing and deleting always need a connection. They are never
    queued for later. While offline, Save snapshot, Delete and Sign out are
    disabled, with a note saying why.
11. The New snapshot form is kept on the device as you type (amounts, date,
    notes), so nothing is lost if the app closes or you're offline. Coming
    back to the page restores it. It's cleared when the snapshot is saved,
    when you choose Start over, and on sign-out.
12. The New snapshot rows are filled in from the saved copy of your latest
    snapshot right away. When the server answers, the autocomplete
    options update, but rows that are already on screen are never replaced,
    so a slow server can't overwrite what you've typed.

### Privacy

13. Signing out removes all saved data from the device: the saved API
    responses and the New snapshot draft.
14. A 401 from the server (signed out elsewhere, or session expired) also
    deletes the saved API responses.
15. Sign-in, sign-out and OAuth requests are never saved or answered from
    the device.

### Updates

16. A new deploy reaches the device the next time the app is opened online.
    The new service worker takes over at once (it doesn't wait for all
    tabs to close).
17. On the first launch after a deploy, the previous service worker may still
    be in charge, so that one launch behaves like the old version.

## How it works

### Service worker (`sw.js`)

| Request | Strategy |
| --- | --- |
| Page loads (`index.html`) | Network first, saved copy after 4 s or on failure. Each good load re-saves the page and the `/assets/` files it uses. |
| `/assets/*` (hashed JS/CSS) | Saved copy first; these never change for a given URL. Only the newest 150 are kept. |
| `GET /api/*` | Network first. Each good response is saved with an `X-WorthSnap-Saved-At` time. With no network, or no answer within 30 s when a saved copy exists, the saved copy is returned marked `X-WorthSnap-Offline: saved`. With nothing saved, a 503 marked `X-WorthSnap-Offline: unavailable`. |
| Anything else (non-GET, `/oauth2`, `/login`, `/logout`, other origins) | Not touched. |

The 30-second API timeout is deliberately long. It's only there for
connections that hang. Showing saved data quickly is the page's job (below),
so the service worker doesn't need to give up early. An earlier 4-second
timeout caused the false "offline" message during cold starts.

The service worker only runs in production builds. In development, the app
removes any service worker left over from a preview on the same port.

### Connection state (`offline.ts`)

The app decides it's offline from the `X-WorthSnap-Offline` header, or from
a failed fetch, not from `navigator.onLine`, which stays true on Wi-Fi with
no internet. The connection store holds:

- `offline` and `savedAt`: drive the offline banner
- `refreshing`: saved data is on screen and a fresh copy is on its way
  (drives "Updating…")
- `reconnects`: goes up each time the server is reachable again, so pages
  know to reload

`readSaved(path)` reads a saved API response straight from the Cache API,
without going through the network. That takes milliseconds even when the
server is asleep.

### Page data (`data.ts`)

`useApiData(path)` and `loadThenRefresh(path, show)`:

1. Show the data from earlier in this session if there is any. Otherwise
   show the saved copy on the device.
2. Fetch from the server at the same time, and show the result when it
   arrives.
3. If the fetch fails but something is already on screen, keep showing it
   (the banner explains). Only show an error when there's nothing to show.
4. Reload when the connection comes back.

Startup in `App.tsx` does the same for the signed-in account (`/api/me`).

## Testing

- Offline mode needs a production build:
  `npm run build && npm run preview -- --port 5173` in `frontend/` (port
  5173 so sign-in redirects still match).
- To mimic a cold start, put a proxy in front of the backend that holds
  `/api` responses back for 10 to 15 seconds, and point the preview's proxy
  at it. Then check:
  - Saved data shows within a second or two, with "Updating…" and no
    offline banner.
  - Fresh data replaces it when the server answers. Edit the saved copy in
    the browser's Cache Storage first to see the swap.
- A real network failure (airplane mode) is best tested on a phone. The
  browser pane in the Claude app can't cut its own connection.
- iOS reads some settings when the app is added to the Home Screen. After
  changing `index.html` meta tags or `manifest.webmanifest`, remove and
  re-add the app.
