# Until You Say

A small static elapsed-time page with one fixed GitHub Pages URL. The complete timeline is maintained in `timestamps.js`; no timing data is stored in the URL.

The page always shows the currently running abstinence phase. Release timestamps are not used as a live state on the page. A release is added only after it has actually been used, so every historical entry contains both the release timestamp and the usage timestamp.

Edit only `timestamps.js` to maintain the timeline:

```js
const timeline = {
  start: "2026-09-22T21:23:00+02:00",
  history: [
    // {
    //   released: "2026-10-10T14:00:00+02:00",
    //   used: "2026-10-10T19:30:00+02:00"
    // }
  ]
};
```

For every completed release/use event, append one complete history entry:

```js
{
  released: "2026-10-10T14:00:00+02:00",
  used: "2026-10-10T19:30:00+02:00"
}
```

The abstinence phase continues through the release and ends only at the usage timestamp. The usage timestamp automatically becomes the start of the next running abstinence phase.

The history shows for every completed phase:

- phase start
- release timestamp
- usage timestamp
- total abstinence duration from phase start to usage
- elapsed time from release to usage

After at least one completed phase, the page also shows the overall “SEIT DU BESTIMMST” timer. Completed phases can be sorted by newest or longest; newest is the default.

All timestamps must be valid ISO timestamps and chronological. Dates display in `Europe/Berlin`.

The page has no analytics, external assets, backend, cookies, or local storage. It is marked `noindex, nofollow, noarchive`. The repository is public, so timestamps stored in `timestamps.js` are publicly readable.
