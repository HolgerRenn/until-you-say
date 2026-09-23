# Until You Say

A small static elapsed-time page with one fixed GitHub Pages URL. The complete timeline is maintained in `timestamps.js`; no timing data is stored in the URL.

The first timestamp is the original start of “Du bestimmst”. Every later timestamp ends the current abstinence phase and starts the next one at exactly the same instant. The page derives the running phase, completed phases, and all durations automatically.

With exactly one timestamp, the page keeps the original single-timer presentation: no phase number, no history, and no separate overall timer. From the second timestamp onward, it shows “SEIT DU BESTIMMST”, numbers the current phase, and lists completed phases with Von / Bis / Dauer. Completed phases can be sorted by newest or longest; newest is the default.

Edit only this file to maintain the timeline:

```js
const timestamps = [
  "2026-09-22T21:23:00+02:00"
];
```

Add a new ISO timestamp for every release. Timestamps must be strictly chronological. Dates display in `Europe/Berlin`.

The page has no analytics, external assets, backend, cookies, or local storage. It is marked `noindex, nofollow, noarchive`. The repository is public, so timestamps stored in `timestamps.js` are publicly readable.
