/* Phase times live only in the URL fragment. No network or storage. */
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

  function parsePhases(fragment) {
    const parts = fragment.split("~");
    if (parts.length > 20 || parts.some((part) => !/^[0-9a-z]{1,9}$/.test(part))) return null;
    const boundaries = parts.map((part) => parseInt(part, 36) * 1000);
    if (boundaries.some((instant) => !withinRange(instant))) return null;
    for (let i = 1; i < boundaries.length; i++) {
      if (boundaries[i] <= boundaries[i - 1]) return null;
    }
    return boundaries.map((start, index) => ({
      start,
      end: index + 1 < boundaries.length ? boundaries[index + 1] : null
    }));
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

  function renderHistory(phases, expanded, now) {
    const history = $("history");
    const list = $("history-list");
    list.replaceChildren();
    const completed = phases.map((phase, index) => ({ ...phase, index }))
      .filter((phase) => phase.end !== null && phase.end <= now);
    history.hidden = !expanded || completed.length === 0;
    $("history-sort").hidden = !expanded || completed.length < 2;
    if (history.hidden) return;
    $("history-title").textContent = completed.length === 1
      ? "Abgeschlossene Enthaltsamkeit"
      : "Abgeschlossene Enthaltsamkeiten";
    $("sort-newest").setAttribute("aria-pressed", String(sortMode === "newest"));
    $("sort-longest").setAttribute("aria-pressed", String(sortMode === "longest"));
    completed.sort(sortMode === "longest"
      ? (a, b) => (b.end - b.start) - (a.end - a.start) || b.end - a.end
      : (a, b) => b.end - a.end);
    completed.forEach((phase) => {
      const entry = document.createElement("div");
      const label = document.createElement("p");
      label.className = "phase-label";
      label.textContent = `Phase ${two(phase.index + 1)}`;
      entry.append(label);
      for (const [prefix, instant] of [["Von:", phase.start], ["Bis:", phase.end]]) {
        const line = document.createElement("p");
        line.textContent = `${prefix} ${formatted(instant)}`;
        entry.append(line);
      }
      const duration = document.createElement("p");
      duration.textContent = `Dauer: ${durationText((phase.end - phase.start) / 1000)}`;
      entry.append(duration);
      list.append(entry);
    });
  }

  function render() {
    clearInterval(ticker);
    const phases = parsePhases(location.hash.slice(1));
    $("timer-view").hidden = !phases;
    if (!phases) return;

    const phase = phases[phases.length - 1];
    const expanded = phases.length > 1;
    const now = Date.now();
    const complete = phase.end !== null && now >= phase.end;
    $("overall").hidden = !expanded;
    $("current-phase").hidden = expanded && complete;
    if (expanded) {
      $("overall-start").dateTime = new Date(phases[0].start).toISOString();
      $("overall-start").textContent = formatted(phases[0].start);
    }
    const label = $("phase-label");
    label.hidden = !expanded;
    label.textContent = expanded ? `Aktuelle Enthaltsamkeit · Phase ${two(phases.length)}` : "";
    $("start-time").dateTime = new Date(phase.start).toISOString();
    $("start-time").textContent = formatted(phase.start);
    renderHistory(phases, expanded, now);

    function tick() {
      const complete = phase.end !== null && Date.now() >= phase.end;
      if (expanded) {
        const overallSeconds = Math.floor(Math.max(0, Date.now() - phases[0].start) / 1000);
        $("overall-duration").textContent = durationText(overallSeconds);
        if (complete && !$("current-phase").hidden) {
          render();
          return;
        }
      }
      const total = Math.floor(Math.max(0, (complete ? phase.end : Date.now()) - phase.start) / 1000);
      const { days, hours, minutes, seconds } = partsOf(total);
      $("days").textContent = days;
      $("hours").textContent = two(hours);
      $("minutes").textContent = two(minutes);
      $("seconds").textContent = two(seconds);
      $("start-label").textContent = complete ? "Von" : "Seit";
      $("end-line").hidden = !complete;
      $("duration-line").hidden = !complete;
      if (complete) {
        $("end-time").dateTime = new Date(phase.end).toISOString();
        $("end-time").textContent = formatted(phase.end);
        $("duration").textContent = durationText((phase.end - phase.start) / 1000);
        if (!expanded) clearInterval(ticker);
      }
    }
    tick();
    if (expanded || phase.end === null || Date.now() < phase.end) ticker = setInterval(tick, 1000);
  }

  window.addEventListener("hashchange", render);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
  $("sort-newest").addEventListener("click", () => { sortMode = "newest"; render(); });
  $("sort-longest").addEventListener("click", () => { sortMode = "longest"; render(); });
  render();
})();
