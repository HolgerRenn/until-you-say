# Until You Say

A small static elapsed-time page. It can show one running interval or a series of intervals. An interval with an end time stops at its exact duration. Numbering and the archive appear only when the link contains more than one interval. In that expanded view, a separate total keeps counting from the first start even between intervals. When at least two intervals are complete, the archive can be sorted by newest or longest; newest is the default.

The page has no analytics, external assets, backend, cookies, or local storage. Displayed phrases are fixed in the public source. Dates and times live in the URL fragment, which is not part of the HTTP request to GitHub Pages. Anyone with the complete link can decode and share the times; the fragment is not encryption.

The fragment contains a start instant in base-36 Unix seconds, optionally followed by `.` and an end instant. Additional intervals are separated with `~`, in chronological order. For example, `#<start>.<end>` shows one interval, while `#<start>.<end>~<start>` shows a completed interval and an ongoing one. Dates display in `Europe/Berlin`. A link with only `#<start>` retains the original continuous counter. The page is neutral without a valid fragment.

For hypothetical previews only, append `!<view-time>` in the same base-36 Unix-seconds format. This freezes the counters at that simulated instant and visibly labels the view as a preview. Omit the suffix for a live counter. The preview time also stays in the URL fragment.
