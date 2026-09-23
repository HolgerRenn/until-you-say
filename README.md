# Until You Say

A small static count-up page. It counts continuously from a start instant and has no end date or checkpoint.

The page has no analytics, external assets, backend, cookies, or local storage. The link format is `#` followed by the start instant as base-36 Unix seconds. Displayed phrases are fixed in the public source. URL fragments are not part of the HTTP request to GitHub Pages. Anyone who has the complete link can read and share its start time; a fragment is not encryption.

Convert the Unix timestamp in seconds to base 36 and append it directly after `#`. Dates display in `Europe/Berlin`. The page is neutral when opened without a valid fragment.
