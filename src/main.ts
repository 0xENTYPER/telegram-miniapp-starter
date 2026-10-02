import "./styles.css";
import { bootTelegram } from "./telegram";

type View = "home" | "activity" | "profile";
const tg = bootTelegram();
let view: View = "home";

const items = [
  { title: "Launch checklist", meta: "5 of 6 complete", status: "Review", tone: "green" },
  { title: "Community brief", meta: "Updated 12 min ago", status: "Ready", tone: "blue" },
  { title: "Weekly report", meta: "3 signals need context", status: "Open", tone: "amber" }
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
}

function render(): void {
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) return;
  const firstName = tg?.initDataUnsafe?.user?.first_name ?? "Creator";
  root.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div class="brand-mark" aria-hidden="true">C</div>
        <div><p class="eyebrow">CREATOR DESK</p><h1>${escapeHtml(firstName)}'s workspace</h1></div>
        <button class="icon-button" data-action="theme" aria-label="Refresh interface">↻</button>
      </header>
      ${view === "home" ? homeView() : view === "activity" ? activityView() : profileView(firstName)}
      <nav class="tabs" aria-label="Primary navigation">
        ${tab("home", "⌂", "Home")}${tab("activity", "≋", "Activity")}${tab("profile", "○", "Profile")}
      </nav>
    </main>`;
  root.querySelectorAll<HTMLElement>("[data-view]").forEach((element) => element.addEventListener("click", () => {
    view = element.dataset.view as View;
    tg?.HapticFeedback?.impactOccurred("light");
    render();
  }));
  root.querySelector<HTMLElement>("[data-action='primary']")?.addEventListener("click", () => {
    tg?.HapticFeedback?.impactOccurred("medium");
    view = "activity";
    render();
  });
}

function homeView(): string {
  return `<section class="content">
    <article class="summary">
      <p class="eyebrow">TODAY</p><h2>One clear next step.</h2>
      <p class="summary-copy">Finish the launch metadata before sharing the review link with your team.</p>
      <button class="primary" data-action="primary">Open checklist <span>→</span></button>
    </article>
    <div class="metrics"><div><strong>3</strong><span>active items</span></div><div><strong>83%</strong><span>launch ready</span></div><div><strong>2</strong><span>collaborators</span></div></div>
    <div class="section-title"><h2>Workspace</h2><span>Live</span></div>
    <div class="list">${items.map((item) => `<article class="row"><i class="dot ${item.tone}"></i><div><h3>${item.title}</h3><p>${item.meta}</p></div><span class="status">${item.status}</span></article>`).join("")}</div>
  </section>`;
}

function activityView(): string {
  return `<section class="content"><div class="section-title"><h2>Activity</h2><span>This week</span></div><div class="timeline">
    <article><time>Today, 14:10</time><h3>Launch checklist updated</h3><p>Social links and token image passed validation.</p></article>
    <article><time>Yesterday, 18:42</time><h3>Report shared</h3><p>A review link was created for two collaborators.</p></article>
    <article><time>Monday, 09:15</time><h3>Workspace created</h3><p>Creator Desk opened from Telegram.</p></article>
  </div></section>`;
}

function profileView(firstName: string): string {
  return `<section class="content"><article class="profile"><div class="avatar">${escapeHtml(firstName.slice(0, 1).toUpperCase())}</div><h2>${escapeHtml(firstName)}</h2><p>${tg ? `Connected through Telegram · ${escapeHtml(tg.platform)}` : "Browser preview mode"}</p></article><div class="settings"><button>Notifications <span>On</span></button><button>Appearance <span>System</span></button><button>Privacy <span>Review</span></button></div></section>`;
}

function tab(name: View, icon: string, label: string): string {
  return `<button class="tab ${view === name ? "active" : ""}" data-view="${name}"><span>${icon}</span>${label}</button>`;
}

tg?.onEvent("themeChanged", render);
tg?.onEvent("viewportChanged", render);
render();
