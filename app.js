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
    return { originalStart, completed, currentStart: phaseStart };
  }

  function formatted(instant) {
    return `${dateFormatter.format(instant)} · ${timeFormatter.format(instant)} Uhr`;
  }

  function durationText(total) {
    const days = Math.floor(total / 86400);
    const hours = Math.floor(total / 3600) % 24;
    const minutes = Math.floor(total / 60) % 60;
    return `${days} ${days === 1 ? "Tag" : "Tage"} · ${two(hours)} Std · ${two(minutes)} Min`;
  }

  function makeIcon(kind, className) {
    const ns = "http://www.w3.org/2000/svg";
    const span = document.createElement("span");
    span.className = className;
    span.setAttribute("aria-hidden", "true");

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("focusable", "false");

    const addPath = (d) => {
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      svg.append(path);
    };

    if (kind === "start") {
      addPath("M8 5v14l11-7z");
    } else if (kind === "release") {
      addPath("M5 21V4");
      addPath("M5 5h11l-2 4 2 4H5");
    } else if (kind === "used") {
      addPath("M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6z");
    } else if (kind === "duration") {
      addPath("M4 20V13");
      addPath("M10 20V9");
      addPath("M16 20V5");
      addPath("M22 20H2");
    }

    span.append(svg);
    return span;
  }

  function appendHistoryLine(entry, prefix, instant, iconClass) {
    const line = document.createElement("p");
    line.className = "history-line";

    const icon = makeIcon(iconClass, "history-line-icon");

    const label = document.createElement("strong");
    label.textContent = prefix;

    const value = document.createElement("span");
    value.textContent = formatted(instant);

    line.append(icon, label, value);
    entry.append(line);
  }

  function renderHistory(completed) {
    const history = $("history");
    const list = $("history-list");
    list.replaceChildren();
    history.hidden = completed.length === 0;
    if (history.hidden) return;

    $("history-count").textContent =
      `${completed.length} ${completed.length === 1 ? "abgeschlossene Phase" : "abgeschlossene Phasen"}`;

    $("history-sort").hidden = completed.length < 2;
    $("sort-newest").setAttribute("aria-pressed", String(sortMode === "newest"));
    $("sort-longest").setAttribute("aria-pressed", String(sortMode === "longest"));

    const sorted = completed.map((phase,index) => ({...phase,index}))
      .sort(sortMode === "longest"
        ? (a,b) => (b.used-b.start)-(a.used-a.start) || b.used-a.used
        : (a,b) => b.used-a.used);

    sorted.forEach(phase => {
      const entry = document.createElement("div");
      const label = document.createElement("p");
      label.className = "history-phase-label";
      label.textContent = `ENTHALTSAMKEIT ${two(phase.index + 1)}`;
      entry.append(label);

      appendHistoryLine(entry, "Start:", phase.start, "start");
      appendHistoryLine(entry, "Freigabe:", phase.released, "release");
      appendHistoryLine(entry, "Nutzung:", phase.used, "used");

      const duration = document.createElement("p");
      duration.className = "history-duration";

      const durationIcon = makeIcon("duration", "history-duration-icon");

      const durationLabel = document.createElement("span");
      durationLabel.className = "history-duration-label";
      durationLabel.textContent = "Dauer der Enthaltsamkeit";

      const durationValue = document.createElement("span");
      durationValue.className = "history-duration-value";
      durationValue.textContent = durationText(Math.floor((phase.used - phase.start) / 1000));

      duration.append(durationIcon, durationLabel, durationValue);
      entry.append(duration);
      list.append(entry);
    });
  }

  function render() {
    clearInterval(ticker);
    const data = parseTimeline();
    $("timer-view").hidden = !data;
    if (!data) return;

    const hasHistory = data.completed.length > 0;
    $("overall").hidden = !hasHistory;

    if (hasHistory) {
      $("overall-start").dateTime = new Date(data.originalStart).toISOString();
      $("overall-start").textContent = formatted(data.originalStart);
    }

    const label = $("phase-label");
    label.hidden = !hasHistory;
    label.textContent = hasHistory ? `AKTUELLE ENTHALTSAMKEIT · NR. ${two(data.completed.length + 1)}` : "";

    $("start-time").dateTime = new Date(data.currentStart).toISOString();
    $("start-time").textContent = formatted(data.currentStart);
    renderHistory(data.completed);

    function tick() {
      const now = Date.now();
      $("days").textContent = Math.floor(Math.max(0, now - data.currentStart) / 86400000);
      if (hasHistory) {
        $("overall-duration").textContent = durationText(Math.floor(Math.max(0,now-data.originalStart)/1000));
      }
    }

    tick();
    ticker = setInterval(tick, 30000);
  }

  function loadTimeline() {
    const script = document.createElement("script");
    script.src = `./timestamps.js?ts=${Date.now()}`;
    script.onload = render;
    script.onerror = () => { $("timer-view").hidden = true; };
    document.head.append(script);
  }

  $("history-toggle").addEventListener("click", () => {
    const toggle = $("history-toggle");
    const content = $("history-content");
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    content.hidden = isOpen;
    $("history-action").textContent = isOpen ? "Verlauf anzeigen" : "Verlauf ausblenden";
  });

  $("sort-newest").addEventListener("click", () => { sortMode = "newest"; render(); });
  $("sort-longest").addEventListener("click", () => { sortMode = "longest"; render(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
  loadTimeline();
})();
