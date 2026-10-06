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

  function parsePhases() {
    if (typeof timeline === "undefined" || !timeline || typeof timeline !== "object") return null;
    if (!Array.isArray(timeline.releases) || timeline.releases.length > 50) return null;

    const originalStart = parseInstant(timeline.start);
    if (!Number.isSafeInteger(originalStart)) return null;

    const phases = [];
    let phaseStart = originalStart;

    for (let index = 0; index < timeline.releases.length; index++) {
      const event = timeline.releases[index];
      if (!event || typeof event !== "object") return null;

      const released = parseInstant(event.released);
      const used = event.used === null ? null : parseInstant(event.used);
      if (!Number.isSafeInteger(released) || released <= phaseStart) return null;
      if (used !== null && (!Number.isSafeInteger(used) || used < released)) return null;

      phases.push({ start: phaseStart, released, used });

      if (used === null) {
        if (index !== timeline.releases.length - 1) return null;
        return phases;
      }
      phaseStart = used;
    }

    phases.push({ start: phaseStart, released: null, used: null });
    return phases;
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

  function durationText(total) {
    const { days, hours, minutes, seconds } = partsOf(total);
    return `${days} ${days === 1 ? "Tag" : "Tage"} · ${two(hours)} Std · ${two(minutes)} Min · ${two(seconds)} Sek`;
  }

  function appendHistoryLine(entry, prefix, instant) {
    const line = document.createElement("p");
    line.textContent = `${prefix} ${formatted(instant)}`;
    entry.append(line);
  }

  function renderHistory(phases, expanded, now) {
    const history = $("history");
    const list = $("history-list");
    list.replaceChildren();
    const completed = phases.map((phase, index) => ({ ...phase, index }))
      .filter((phase) => phase.used !== null && phase.used <= now);
    history.hidden = !expanded || completed.length === 0;
    $("history-sort").hidden = !expanded || completed.length < 2;
    if (history.hidden) return;

    $("history-title").textContent = completed.length === 1
      ? "Abgeschlossene Enthaltsamkeit"
      : "Abgeschlossene Enthaltsamkeiten";
    $("sort-newest").setAttribute("aria-pressed", String(sortMode === "newest"));
    $("sort-longest").setAttribute("aria-pressed", String(sortMode === "longest"));
    completed.sort(sortMode === "longest"
      ? (a, b) => (b.used - b.start) - (a.used - a.start) || b.used - a.used
      : (a, b) => b.used - a.used);

    completed.forEach((phase) => {
      const entry = document.createElement("div");
      const label = document.createElement("p");
      label.className = "phase-label";
      label.textContent = `Phase ${two(phase.index + 1)}`;
      entry.append(label);

      appendHistoryLine(entry, "Von:", phase.start);
      appendHistoryLine(entry, "Freigabe:", phase.released);
      appendHistoryLine(entry, "Nutzung:", phase.used);

      const duration = document.createElement("p");
      duration.className = "history-duration";
      duration.textContent = `Enthaltsam: ${durationText((phase.used - phase.start) / 1000)}`;
      entry.append(duration);

      const afterRelease = document.createElement("p");
      afterRelease.className = "history-secondary";
      afterRelease.textContent = `Nach Freigabe genutzt nach: ${durationText((phase.used - phase.released) / 1000)}`;
      entry.append(afterRelease);
      list.append(entry);
    });
  }

  function render() {
    clearInterval(ticker);
    const phases = parsePhases();
    $("timer-view").hidden = !phases;
    if (!phases) return;

    const phase = phases[phases.length - 1];
    const expanded = phases.length > 1;
    const now = Date.now();
    const released = phase.released !== null && phase.released <= now;

    $("overall").hidden = !expanded;
    $("current-phase").hidden = false;
    if (expanded) {
      $("overall-start").dateTime = new Date(phases[0].start).toISOString();
      $("overall-start").textContent = formatted(phases[0].start);
    }

    const label = $("phase-label");
    label.hidden = !expanded;
    label.textContent = expanded ? `Aktuelle Enthaltsamkeit · Phase ${two(phases.length)}` : "";
    $("start-time").dateTime = new Date(phase.start).toISOString();
    $("start-time").textContent = formatted(phase.start);

    $("headline").textContent = released
      ? "Du hast gesagt, ich darf. 😇"
      : "Du bestimmst, wann ich darf. 😇";
    $("release-status").hidden = !released;
    if (released) {
      $("release-time").dateTime = new Date(phase.released).toISOString();
      $("release-time").textContent = formatted(phase.released);
    }
    $("closing").textContent = released
      ? "FREIGEGEBEN. NOCH NICHT GENUTZT 😉"
      : "DU LEIDEST JA NICHT 😉";

    renderHistory(phases, expanded, now);

    function tick() {
      const total = Math.floor(Math.max(0, Date.now() - phase.start) / 1000);
      const { days, hours, minutes, seconds } = partsOf(total);
      $("days").textContent = days;
      $("hours").textContent = two(hours);
      $("minutes").textContent = two(minutes);
      $("seconds").textContent = two(seconds);

      if (expanded) {
        const overallSeconds = Math.floor(Math.max(0, Date.now() - phases[0].start) / 1000);
        $("overall-duration").textContent = durationText(overallSeconds);
      }
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
