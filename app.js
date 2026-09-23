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

  function parsePhases(fragment) {
    const parts = fragment.split("~");
    if (parts.length > 20) return null;
    const phases = parts.map((part) => {
      if (!/^[0-9a-z]{1,9}(?:\.[0-9a-z]{1,9})?$/.test(part)) return null;
      const [startPart, endPart] = part.split(".");
      const start = parseInt(startPart, 36) * 1000;
      const end = endPart === undefined ? null : parseInt(endPart, 36) * 1000;
      if (!withinRange(start) || (end !== null && (!withinRange(end) || end <= start))) return null;
      return { start, end };
    });
    if (phases.some((phase) => !phase)) return null;
    for (let i = 1; i < phases.length; i++) {
      if (phases[i - 1].end === null || phases[i].start < phases[i - 1].end) return null;
    }
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
    return `${days} ${days === 1 ? "Tag" : "Tage"} · ${two(hours)} ${hours === 1 ? "Stunde" : "Stunden"} · ${two(minutes)} ${minutes === 1 ? "Minute" : "Minuten"} · ${two(seconds)} ${seconds === 1 ? "Sekunde" : "Sekunden"}`;
  }

  function renderHistory(phases) {
    const history = $("history");
    const list = $("history-list");
    list.replaceChildren();
    history.hidden = phases.length < 2;
    if (history.hidden) return;
    phases.slice(0, -1).forEach((phase, index) => {
      const entry = document.createElement("div");
      const label = document.createElement("p");
      label.className = "phase-label";
      label.textContent = `Phase ${two(index + 1)}`;
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
    const label = $("phase-label");
    label.hidden = phases.length === 1;
    label.textContent = phases.length > 1 ? `Phase ${two(phases.length)}` : "";
    $("start-time").dateTime = new Date(phase.start).toISOString();
    $("start-time").textContent = formatted(phase.start);
    renderHistory(phases);

    function tick() {
      const complete = phase.end !== null && Date.now() >= phase.end;
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
        clearInterval(ticker);
      }
    }
    tick();
    if (phase.end === null || Date.now() < phase.end) ticker = setInterval(tick, 1000);
  }

  window.addEventListener("hashchange", render);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
  render();
})();
