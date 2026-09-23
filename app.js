/* Personal data is read from the URL fragment only. No network requests or storage. */
(() => {
  const $ = (id) => document.getElementById(id);
  const two = (number) => String(number).padStart(2, "0");
  const formatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  function decodeConfig() {
    const hash = location.hash.slice(1);
    if (!/^v1\.[A-Za-z0-9_-]{1,4000}$/.test(hash)) return null;
    try {
      const encoded = hash.slice(3).replace(/-/g, "+").replace(/_/g, "/");
      const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
      const config = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      const validText = (value) => typeof value === "string" && value.length <= 180;
      if (config.v !== 1 || !validText(config.title) || !validText(config.waiting) ||
          !validText(config.reached) || !validText(config.checkpointLabel) ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(config.start) ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(config.checkpoint)) return null;
      const start = Date.parse(config.start);
      const checkpoint = Date.parse(config.checkpoint);
      if (!Number.isFinite(start) || !Number.isFinite(checkpoint) || checkpoint <= start) return null;
      return { ...config, start, checkpoint };
    } catch { return null; }
  }

  function duration(milliseconds) {
    const total = Math.floor(Math.max(0, milliseconds) / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor(total / 3600) % 24;
    const minutes = Math.floor(total / 60) % 60;
    const seconds = total % 60;
    return { days, hours, minutes, seconds,
      line: `${days} ${days === 1 ? "Tag" : "Tage"} ${two(hours)}:${two(minutes)}:${two(seconds)}` };
  }

  let ticker;
  function render() {
    clearInterval(ticker);
    const config = decodeConfig();
    $("timer-view").hidden = !config;
    $("empty-view").hidden = !!config;
    if (!config) return;

    $("headline").textContent = config.title;
    $("start-time").dateTime = new Date(config.start).toISOString();
    $("start-time").textContent = formatter.format(config.start) + " Uhr";
    $("checkpoint-time").dateTime = new Date(config.checkpoint).toISOString();
    $("checkpoint-time").textContent = formatter.format(config.checkpoint) + " Uhr";

    function tick() {
      const now = Date.now();
      const elapsed = duration(now - config.start);
      $("days").textContent = elapsed.days;
      $("hours").textContent = two(elapsed.hours);
      $("minutes").textContent = two(elapsed.minutes);
      $("seconds").textContent = two(elapsed.seconds);
      const reached = now >= config.checkpoint;
      $("checkpoint-label").textContent = reached ? "Zeit seit dem Prüfpunkt" : config.checkpointLabel;
      $("checkpoint-value").textContent = reached
        ? `+${duration(now - config.checkpoint).line} über Prüfpunkt`
        : duration(config.checkpoint - now).line;
      $("status-text").textContent = reached ? config.reached : config.waiting;
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
