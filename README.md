# Until You Say

A small static elapsed-time page with one fixed GitHub Pages URL. The complete timeline is maintained in `timestamps.js`; no timing data is stored in the URL.

The page always shows the currently running abstinence phase. Release timestamps are historical only: an entry is added after a release has actually been used, so every historical entry contains both the release timestamp and the usage timestamp.

Edit only `timestamps.js` to maintain the timeline:

```js
const timeline = {
  start: "2026-09-22T21:23:00+02:00",
  history: []
};
```

For every completed release/use event, append one complete history entry:

```js
{
  released: "YYYY-MM-DDTHH:mm:ss+02:00",
  used: "YYYY-MM-DDTHH:mm:ss+02:00"
}
```

The abstinence phase continues through the release and ends only at the usage timestamp. That usage timestamp automatically becomes the start of the next running abstinence phase.

Each historical phase displays:

- Start
- Freigabe
- Nutzung
- Enthaltsamkeit from phase start to usage, shown in days, hours, and minutes

The overall timer is intentionally the total runtime of UNTIL YOU SAY since the original start, independent of releases or usage. The current phase keeps the live seconds counter. Completed phases can be sorted by newest or longest; newest is the default.

Visit email notification is temporarily disabled while the page is being finalized.

All timestamps must be valid ISO timestamps and chronological. Dates display in `Europe/Berlin`.

The page has no active analytics, backend, cookies, or local storage. It is marked `noindex, nofollow, noarchive`. The repository is public, so timestamps stored in `timestamps.js` are publicly readable.
