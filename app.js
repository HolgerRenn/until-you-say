/* The start instant is read from the URL fragment. No network requests or storage. */
(() => {
  const $ = (id) => document.getElementById(id);
  const two = (number) => String(number).padStart(2, "0");
  const fixedText = {
    title: "Du bestimmst, wann ich darf. 😇",
    waiting: "Ich warte. 😏",
    reached: "Checkpoint erreicht – Freigabe offen.",
    checkpointLabel: "Noch bis zum 10-Tage-Prüfpunkt"
  };
  const formatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
  const partsFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin", year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23"
  });
  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin", timeZoneName: "shortOffset"
  });

  function berlinOffset(instant) {
    const label = offsetFormatter.formatToParts(instant).find((part) => part.type === "timeZoneName")?.value;
    const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(label || "");
    if (!match) return NaN;
    return (match[1] === "+" ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3] || 0)) * 60000;
  }

  function tenBerlinDaysLater(start) {
    const parts = Object.fromEntries(partsFormatter.formatToParts(start)
      .filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
    const wallTime = Date.UTC(parts.year, parts.month - 1, parts.day + 10,
      parts.hour, parts.minute, parts.second);
    let instant = wallTime - berlinOffset(wallTime);
    instant = wallTime - berlinOffset(instant);
    return instant;
  }

  function decodeConfig() {
    const hash = location.hash.slice(1);
    if (/^[0-9a-z]{1,9}$/.test(hash)) {
      const start = parseInt(hash, 36) * 1000;
      const checkpoint = tenBerlinDaysLater(start);
      if (!Number.isSafeInteger(start) || !Number.isFinite(checkpoint) ||
          start < Date.UTC(2000, 0, 1) || start > Date.UTC(2100, 0, 1)) return null;
      return { start, checkpoint, ...fixedText };
    }
    if (!/^v[12]\.[A-Za-z0-9_-]{1,4000}$/.test(hash)) return null;
    try {
      const encoded = hash.slice(3).replace(/-/g, "+").replace(/_/g, "/");
      const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
      const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      if (hash.startsWith("v2.")) {
        if (!Array.isArray(data) || data.length !== 5 ||
            !data.slice(0, 2).every((value) => typeof value === "string" && /^[0-9a-z]{1,9}$/.test(value))) return null;
        const [startSeconds, checkpointSeconds, title, waiting, reached] = data;
        const start = parseInt(startSeconds, 36) * 1000;
        const checkpoint = parseInt(checkpointSeconds, 36) * 1000;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(checkpoint) ||
            checkpoint <= start || ![title, waiting, reached].every((value) => typeof value === "string" && value.length <= 180)) return null;
        const days = Math.round((checkpoint - start) / 86400000);
        return { start, checkpoint, title, waiting, reached,
          checkpointLabel: `Noch bis zum ${days}-Tage-Prüfpunkt` };
      }
      const config = data;
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
