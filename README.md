# Until You Say

A small static elapsed-time page with one fixed GitHub Pages URL. The complete timeline is maintained in `timestamps.js`; no timing data is stored in the URL.

The timeline separates the original abstinence start, Denise's release, and Holger's actual usage. Abstinence continues after a release and ends only when the release is actually used. That usage timestamp also becomes the start of the next abstinence phase automatically.

Edit only `timestamps.js` to maintain the timeline:

```js
const timeline = {
  start: "2026-09-22T21:23:00+02:00",
  releases: [
    // { released: "2026-10-10T14:00:00+02:00", used: null }
  ]
};
```

When a release happens, append an entry with its `released` timestamp and `used: null`:

```js
{ released: "2026-10-10T14:00:00+02:00", used: null }
```

The current timer keeps running from the phase start and the page shows that the release is available but not yet used.

After the release is actually used, replace `null` with the usage timestamp:

```js
{ released: "2026-10-10T14:00:00+02:00", used: "2026-10-10T19:30:00+02:00" }
```

The completed phase then runs from its start until the usage timestamp. The history shows:

- phase start
- release timestamp
- usage timestamp
- total abstinence duration
- elapsed time between release and usage

The next abstinence phase starts automatically at the usage timestamp. After at least one completed phase, the page also shows the overall “SEIT DU BESTIMMST” timer and the phase history. Completed phases can be sorted by newest or longest; newest is the default.

All timestamps must be valid ISO timestamps and chronological. Dates display in `Europe/Berlin`.

The page has no analytics, external assets, backend, cookies, or local storage. It is marked `noindex, nofollow, noarchive`. The repository is public, so timestamps stored in `timestamps.js` are publicly readable.
