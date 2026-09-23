# Until You Say

A small static elapsed-time page. It shows one running abstinence phase or, when release timestamps are present, a sequence of seamless phases. Each release ends the current phase and starts the next one at exactly the same instant. Numbering and the archive appear only when the link contains more than one timestamp. In that expanded view, a separate total keeps counting from the original start. When at least two phases are complete, the archive can be sorted by newest or longest; newest is the default.

The page has no analytics, external assets, backend, cookies, or local storage. Displayed phrases are fixed in the public source. Dates and times live in the URL fragment, which is not part of the HTTP request to GitHub Pages. Anyone with the complete link can decode and share the times; the fragment is not encryption.

The fragment contains a chronological list of base-36 Unix-second timestamps separated by `~`. The first timestamp is the original start. Every following timestamp is a release boundary: it ends one phase and starts the next immediately. For example, `#<start>` shows one continuous running phase, while `#<start>~<release1>~<release2>` shows Phase 01 from start to release1, Phase 02 from release1 to release2, and a running Phase 03 since release2. Dates display in `Europe/Berlin`. The page is neutral without a valid fragment.
