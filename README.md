# Until You Say

A small static elapsed-time page. It can show one running interval or a series of intervals. An interval with an end time stops at its exact duration. Numbering appears only when the link contains more than one interval.

The page has no analytics, external assets, backend, cookies, or local storage. Displayed phrases are fixed in the public source. Dates and times live in the URL fragment, which is not part of the HTTP request to GitHub Pages. Anyone with the complete link can decode and share the times; the fragment is not encryption.

The fragment contains a start instant in base-36 Unix seconds, optionally followed by `.` and an end instant. Additional intervals are separated with `~`, in chronological order. For example, `#<start>.<end>` shows one interval, while `#<start>.<end>~<start>` shows a completed interval and an ongoing one. Dates display in `Europe/Berlin`. A link with only `#<start>` retains the original continuous counter. The page is neutral without a valid fragment.
