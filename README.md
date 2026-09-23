# Until You Say

A tiny static count-up page with a separate checkpoint countdown. Reaching the checkpoint never stops the main timer.

The page has no analytics, external assets, backend, cookies, or local storage. The current link format is `#` followed by the start instant as base-36 Unix seconds. The checkpoint is ten calendar days later in `Europe/Berlin`. The displayed phrases are fixed in the public source. URL fragments are not part of the HTTP request to GitHub Pages. Anyone who has the complete link can read and share its start time; a fragment is not encryption.

For example, convert the Unix timestamp in seconds to base 36 and append it directly after `#`. The page is intentionally neutral when opened without a valid fragment.

Existing `v1` and `v2` links remain supported. Their encoded text is inserted as plain text, never HTML.
