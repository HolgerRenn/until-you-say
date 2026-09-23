/* Only the start instant comes from the URL fragment. No network or storage. */
(() => {
  const $ = (id) => document.getElementById(id);
  const two = (value) => String(value).padStart(2, "0");
  const formatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
  let ticker;

  function render() {
    clearInterval(ticker);
    const hash = location.hash.slice(1);
    const start = /^[0-9a-z]{1,9}$/.test(hash) ? parseInt(hash, 36) * 1000 : NaN;
    const valid = Number.isSafeInteger(start) &&
      start >= Date.UTC(2000, 0, 1) && start <= Date.UTC(2100, 0, 1);
    $("timer-view").hidden = !valid;
    $("empty-view").hidden = valid;
    if (!valid) return;

    $("start-time").dateTime = new Date(start).toISOString();
    $("start-time").textContent = formatter.format(start) + " Uhr";

    function tick() {
      const total = Math.floor(Math.max(0, Date.now() - start) / 1000);
      $("days").textContent = Math.floor(total / 86400);
      $("hours").textContent = two(Math.floor(total / 3600) % 24);
      $("minutes").textContent = two(Math.floor(total / 60) % 60);
      $("seconds").textContent = two(total % 60);
    }
    tick();
    ticker = setInterval(tick, 1000);
  }

  $("share-button").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      $("share-button").textContent = "Link kopiert ✓";
      setTimeout(() => { $("share-button").textContent = "Link kopieren ↗"; }, 2200);
    } catch {
      $("share-button").textContent = "Link in der Adresszeile kopieren";
    }
  });
  window.addEventListener("hashchange", render);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
  render();
})();
