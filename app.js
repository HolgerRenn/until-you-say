/* Timeline data is loaded fresh from timestamps.js on each page load. */
(() => {
  const $ = (id) => document.getElementById(id);
  const two = (value) => String(value).padStart(2, "0");
  const dateFormatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin", day: "numeric", month: "long", year: "numeric"
  });
  const timeFormatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit"
  });
  const withinRange = (value) => Number.isSafeInteger(value) &&
    value >= Date.UTC(2000, 0, 1) && value <= Date.UTC(2100, 0, 1);
  let ticker;
  let sortMode = "newest";

  function parseInstant(value) {
    if (typeof value !== "string") return NaN;
    const instant = Date.parse(value);
    return withinRange(instant) ? instant : NaN;
  }

  function parseTimeline() {
    if (typeof timeline === "undefined" || !timeline || typeof timeline !== "object") return null;
    if (!Array.isArray(timeline.history) || timeline.history.length > 50) return null;

    const originalStart = parseInstant(timeline.start);
    if (!Number.isSafeInteger(originalStart)) return null;

    const completed = [];
    let phaseStart = originalStart;

    for (const event of timeline.history) {
      if (!event || typeof event !== "object") return null;

      const released = parseInstant(event.released);
      const used = parseInstant(event.used);

      if (!Number.isSafeInteger(released) || !Number.isSafeInteger(used)) return null;
      if (released <= phaseStart || used < released) return null;

      completed.push({ start: phaseStart, released, used });
      phaseStart = used;
    }

    return {
      completed,
      currentStart: phaseStart
    };
  }

  function formatted(instant) {
    return `${dateFormatter.format(instant)} · ${timeFormatter.format(instant)} Uhr`;
  }

  function partsOf(total) {
    return {
      days: Math.floor(total / 86400),
      hours: Math.floor(total / 3600) % 24,
      minutes: Math.floor(total / 60) % 60,
      seconds: total % 60
    };
  }

  function historyDurationText(total) {
    const { days, hours, minutes } = partsOf(total);
    return `${days} ${days === 1 ? "Tag" : "Tage"} · ${two(hours)} Std · ${two(minutes)} Min`;
  }

  function appendHistoryLine(entry, prefix, instant) {
    const line = document.createElement("p");
    line.textContent = `${prefix} ${formatted(instant)}`;
    entry.append(line);
  }

  function renderHistory(completed) {
    const history = $("history");
    const list = $("history-list");
    list.replaceChildren();

    history.hidden = completed.length === 0;
    $("history-sort").hidden = completed.length < 2;
    if (history.hidden) return;

    $("history-title").textContent = completed.length === 1
      ? "Abgeschlossene Enthaltsamkeit"
      : "Abgeschlossene Enthaltsamkeiten";
    $("sort-newest").setAttribute("aria-pressed", String(sortMode === "newest"));
    $("sort-longest").setAttribute("aria-pressed", String(sortMode === "longest"));

    const sorted = completed
      .map((phase, index) => ({ ...phase, index }))
      .sort(sortMode === "longest"
        ? (a, b) => (b.used - b.start) - (a.used - a.start) || b.used - a.used
        : (a, b) => b.used - a.used);

    sorted.forEach((phase) => {
      const entry = document.createElement("div");
      const label = document.createElement("p");
      label.className = "phase-label";
      label.textContent = `Phase ${two(phase.index + 1)}`;
      entry.append(label);

      appendHistoryLine(entry, "Start:", phase.start);
      appendHistoryLine(entry, "Freigabe:", phase.released);
      appendHistoryLine(entry, "Nutzung:", phase.used);

      const duration = document.createElement("p");
      duration.className = "history-duration";
      duration.textContent = `Enthaltsamkeit: ${historyDurationText((phase.used - phase.start) / 1000)}`;
      entry.append(duration);

      list.append(entry);
    });
  }

  function render() {
    clearInterval(ticker);
    const data = parseTimeline();
    $("timer-view").hidden = !data;
    if (!data) return;

    const expanded = data.completed.length > 0;
    const phaseNumber = data.completed.length + 1;
    const label = $("phase-label");
    label.hidden = !expanded;
    label.textContent = expanded ? `Aktuelle Enthaltsamkeit · Phase ${two(phaseNumber)}` : "";

    $("start-time").dateTime = new Date(data.currentStart).toISOString();
    $("start-time").textContent = formatted(data.currentStart);

    renderHistory(data.completed);

    function tick() {
      const now = Date.now();
      const currentSeconds = Math.floor(Math.max(0, now - data.currentStart) / 1000);
      const { days, hours, minutes, seconds } = partsOf(currentSeconds);

      $("days").textContent = days;
      $("hours").textContent = two(hours);
      $("minutes").textContent = two(minutes);
      $("seconds").textContent = two(seconds);
    }

    tick();
    ticker = setInterval(tick, 1000);
  }

  function loadTimeline() {
    const script = document.createElement("script");
    script.src = `./timestamps.js?ts=${Date.now()}`;
    script.onload = render;
    script.onerror = () => { $("timer-view").hidden = true; };
    document.head.append(script);
  }

  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
  $("sort-newest").addEventListener("click", () => { sortMode = "newest"; render(); });
  $("sort-longest").addEventListener("click", () => { sortMode = "longest"; render(); });
  loadTimeline();
})();
