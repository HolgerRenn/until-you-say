# Until You Say

A tiny static count-up page with a separate checkpoint countdown. Reaching the checkpoint never stops the main timer.

The page has no analytics, external assets, backend, cookies, or local storage. Personal configuration is supplied as a versioned Base64URL-encoded JSON object in the URL fragment (`#v1.…`). URL fragments are not part of the HTTP request to GitHub Pages. Anyone who has the complete link can read and share its configuration; a fragment is not encryption.

Configuration fields: `v` (1), `start` and `checkpoint` (ISO 8601 timestamps with numeric offsets), `title`, `waiting`, `reached`, and `checkpointLabel`. The displayed dates use `Europe/Berlin`. Use explicit offsets for both instants; this also handles seasonal time changes. The page is intentionally neutral when opened without a valid fragment.

To make a link, encode a UTF-8 JSON object with these fields as unpadded Base64URL and append `#v1.` followed by that value to the Pages URL. All text is inserted as plain text, never HTML.
