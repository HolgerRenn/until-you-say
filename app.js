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
  let historyView = "controls";
  let parsedData = null;

  function parseInstant(value) {
    if (typeof value !== "string") return NaN;
    const instant = Date.parse(value);
    return withinRange(instant) ? instant : NaN;
  }

  function parseTimeline() {
    if (typeof timeline === "undefined" || !timeline || typeof timeline !== "object") return null;
    if (!Array.isArray(timeline.controls) || timeline.controls.length === 0 || timeline.controls.length > 50) return null;

    const controls = [];
    let previousEnd = null;

    for (let controlIndex = 0; controlIndex < timeline.controls.length; controlIndex += 1) {
      const source = timeline.controls[controlIndex];
      if (!source || typeof source !== "object" || !Array.isArray(source.history) || source.history.length > 100) return null;

      const started = parseInstant(source.started);
      const ended = source.ended == null ? null : parseInstant(source.ended);
      if (!Number.isSafeInteger(started)) return null;
      if (ended !== null && (!Number.isSafeInteger(ended) || ended <= started)) return null;
      if (previousEnd !== null && started <= previousEnd) return null;
      if (controlIndex < timeline.controls.length - 1 && ended === null) return null;

      const abstinences = [];
      let phaseStart = started;

      for (let phaseIndex = 0; phaseIndex < source.history.length; phaseIndex += 1) {
        const event = source.history[phaseIndex];
        if (!event || typeof event !== "object") return null;

        const released = parseInstant(event.released);
        const used = parseInstant(event.used);
        if (!Number.isSafeInteger(released) || !Number.isSafeInteger(used)) return null;
        if (released <= phaseStart || used < released) return null;

        abstinences.push({
          controlIndex,
          phaseIndex,
          start: phaseStart,
          released,
          used
        });
        phaseStart = used;
      }

      controls.push({
        index: controlIndex,
        started,
        ended,
        abstinences,
        currentStart: phaseStart
      });

      previousEnd = ended;
    }

    const current = controls[controls.length - 1];
    const running = current.ended === null;
    const allAbstinences = controls.flatMap(control => control.abstinences);

    return { controls, current, running, allAbstinences };
  }

  function formatted(instant) {
    return `${dateFormatter.format(instant)} · ${timeFormatter.format(instant)} Uhr`;
  }

  function formattedDate(instant) {
    return dateFormatter.format(instant);
  }

  function formattedTime(instant) {
    return `${timeFormatter.format(instant)} Uhr`;
  }

  function durationText(totalSeconds) {
    const total = Math.max(0, totalSeconds);
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

    const date = document.createElement("span");
    date.className = "history-date";
    date.textContent = formattedDate(instant);

    const time = document.createElement("span");
    time.className = "history-time";
    time.textContent = formattedTime(instant);

    line.append(icon, label, date, time);
    entry.append(line);
  }

  function appendDuration(entry, labelText, seconds) {
    const duration = document.createElement("p");
    duration.className = "history-duration";
    const durationIcon = makeIcon("duration", "history-duration-icon");

    const label = document.createElement("span");
    label.className = "history-duration-label";
    label.textContent = labelText;

    const value = document.createElement("span");
    value.className = "history-duration-value";
    value.textContent = durationText(seconds);

    duration.append(durationIcon, label, value);
    entry.append(duration);
  }

  function renderAbstinence(entry, phase, includeControl) {
    const label = document.createElement("p");
    label.className = "history-phase-label";
    label.textContent = includeControl
      ? `ENTHALTSAMKEIT ${two(phase.phaseIndex + 1)} · KONTROLLE ${two(phase.controlIndex + 1)}`
      : `ENTHALTSAMKEIT ${two(phase.phaseIndex + 1)}`;
    entry.append(label);

    appendHistoryLine(entry, "Start:", phase.start, "start");
    appendHistoryLine(entry, "Freigabe:", phase.released, "release");
    appendHistoryLine(entry, "Nutzung:", phase.used, "used");
    appendDuration(entry, "Dauer der Enthaltsamkeit", Math.floor((phase.used - phase.start) / 1000));
  }

  function renderControls(controls) {
    const list = $("controls-list");
    list.replaceChildren();

    [...controls].reverse().forEach(control => {
      const entry = document.createElement("section");
      entry.className = "control-entry";

      const heading = document.createElement("div");
      heading.className = "control-heading";

      const title = document.createElement("strong");
      title.textContent = `KONTROLLE ${two(control.index + 1)}`;

      const state = document.createElement("span");
      state.textContent = control.ended === null ? "LÄUFT" : "BEENDET";

      heading.append(title, state);
      entry.append(heading);

      const range = document.createElement("p");
      range.className = "control-range";
      range.textContent = control.ended === null
        ? `${formatted(control.started)} → läuft`
        : `${formatted(control.started)} → ${formatted(control.ended)}`;
      entry.append(range);

      const endForDuration = control.ended === null ? Date.now() : control.ended;
      appendDuration(entry, "Dauer der Kontrolle", Math.floor((endForDuration - control.started) / 1000));

      const count = document.createElement("p");
      count.className = "control-count";
      count.textContent = `${control.abstinences.length} ${control.abstinences.length === 1 ? "Enthaltsamkeit" : "Enthaltsamkeiten"}`;
      entry.append(count);

      if (control.abstinences.length > 0) {
        const details = document.createElement("details");
        details.className = "control-details";

        const summary = document.createElement("summary");
        summary.textContent = "Enthaltsamkeiten anzeigen";
        details.append(summary);

        const phases = document.createElement("div");
        phases.className = "control-phases";

        control.abstinences.forEach(phase => {
          const phaseEntry = document.createElement("div");
          phaseEntry.className = "nested-phase";
          renderAbstinence(phaseEntry, phase, false);
          phases.append(phaseEntry);
        });

        details.append(phases);
        entry.append(details);
      }

      list.append(entry);
    });
  }

  function renderAllAbstinences(allAbstinences) {
    const list = $("history-list");
    list.replaceChildren();

    const sorted = [...allAbstinences].sort(sortMode === "longest"
      ? (a, b) => (b.used - b.start) - (a.used - a.start) || b.used - a.used
      : (a, b) => b.used - a.used);

    sorted.forEach(phase => {
      const entry = document.createElement("div");
      renderAbstinence(entry, phase, true);
      list.append(entry);
    });

    $("history-sort").hidden = allAbstinences.length < 2;
    $("sort-newest").setAttribute("aria-pressed", String(sortMode === "newest"));
    $("sort-longest").setAttribute("aria-pressed", String(sortMode === "longest"));
  }

  function renderHistory(data) {
    const history = $("history");
    const completedControls = data.controls.filter(control => control.ended !== null);
    const hasHistory = completedControls.length > 0 || data.allAbstinences.length > 0;
    history.hidden = !hasHistory;
    if (!hasHistory) return;

    $("history-count").textContent =
      `${completedControls.length} ${completedControls.length === 1 ? "Kontrolle" : "Kontrollen"} · ${data.allAbstinences.length} ${data.allAbstinences.length === 1 ? "Enthaltsamkeit" : "Enthaltsamkeiten"}`;

    $("view-controls").setAttribute("aria-selected", String(historyView === "controls"));
    $("view-abstinences").setAttribute("aria-selected", String(historyView === "abstinences"));
    $("controls-history").hidden = historyView !== "controls";
    $("abstinences-history").hidden = historyView !== "abstinences";

    renderControls(data.controls);
    renderAllAbstinences(data.allAbstinences);
  }

  function render() {
    clearInterval(ticker);
    parsedData = parseTimeline();
    $("timer-view").hidden = !parsedData;
    if (!parsedData) return;

    const { current, running } = parsedData;
    $("running-view").hidden = !running;
    $("ended-view").hidden = running;
    $("overall").hidden = !running;

    if (running) {
      $("phase-label").textContent =
        `KONTROLLE ${two(current.index + 1)} · AKTUELLE ENTHALTSAMKEIT ${two(current.abstinences.length + 1)}`;

      $("start-time").dateTime = new Date(current.currentStart).toISOString();
      $("start-time").textContent = formatted(current.currentStart);
      $("overall-start").dateTime = new Date(current.started).toISOString();
      $("overall-start").textContent = formatted(current.started);

      function tick() {
        const now = Date.now();
        $("days").textContent = Math.floor(Math.max(0, now - current.currentStart) / 86400000);
        $("overall-duration").textContent =
          durationText(Math.floor(Math.max(0, now - current.started) / 1000));
        if (historyView === "controls") renderControls(parsedData.controls);
      }

      tick();
      ticker = setInterval(tick, 30000);
    } else {
      $("ended-duration").textContent =
        durationText(Math.floor((current.ended - current.started) / 1000));

      $("ended-start").dateTime = new Date(current.started).toISOString();
      $("ended-start").textContent = formatted(current.started);
      $("ended-end").dateTime = new Date(current.ended).toISOString();
      $("ended-end").textContent = formatted(current.ended);
    }

    renderHistory(parsedData);
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

  $("view-controls").addEventListener("click", () => {
    historyView = "controls";
    renderHistory(parsedData);
  });

  $("view-abstinences").addEventListener("click", () => {
    historyView = "abstinences";
    renderHistory(parsedData);
  });

  $("sort-newest").addEventListener("click", () => {
    sortMode = "newest";
    renderHistory(parsedData);
  });

  $("sort-longest").addEventListener("click", () => {
    sortMode = "longest";
    renderHistory(parsedData);
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });

  loadTimeline();
})();
