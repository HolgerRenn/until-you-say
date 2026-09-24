(() => {
  const SESSION_KEY = "until-you-say-visit-notified";
  const SERVICE_ID = "service_ubsinr3";
  const TEMPLATE_ID = "template_cfj94jg";
  const PUBLIC_KEY = "AdY9VnttST58MT27z";

  if (sessionStorage.getItem(SESSION_KEY)) return;

  const start = Date.parse("2026-09-22T21:23:00+02:00");
  const now = Date.now();
  const totalMinutes = Math.max(0, Math.floor((now - start) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const two = (value) => String(value).padStart(2, "0");

  const timestamp = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(now);

  const counter = `${days} ${days === 1 ? "Tag" : "Tage"} · ${two(hours)} Std · ${two(minutes)} Min`;

  fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: { timestamp, counter }
    })
  }).then((response) => {
    if (!response.ok) throw new Error("EmailJS request failed");
    sessionStorage.setItem(SESSION_KEY, "1");
  }).catch(() => {});
})();
