# Until You Say

A tiny static count-up page with a separate checkpoint countdown. Reaching the checkpoint never stops the main timer.

The page has no analytics, external assets, backend, cookies, or local storage. Personal configuration is supplied as a versioned Base64URL-encoded JSON object in the URL fragment (`#v1.…`). URL fragments are not part of the HTTP request to GitHub Pages. Anyone who has the complete link can read and share its configuration; a fragment is not encryption.

The compact `v2` fragment contains an array of five values: start and checkpoint as base-36 Unix seconds, then title, waiting status, and reached status. Encode its UTF-8 JSON as unpadded Base64URL and append it after `#v2.`. The dates display in `Europe/Berlin`. The page is intentionally neutral when opened without a valid fragment.

The original `v1` JSON object is also supported for existing links: `v` (1), `start` and `checkpoint` (ISO 8601 timestamps with numeric offsets), `title`, `waiting`, `reached`, and `checkpointLabel`. All text is inserted as plain text, never HTML.
