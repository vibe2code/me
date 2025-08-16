/* vibe2code landing — auto RU/EN, auto theme, GitHub repos + Shields */

const GITHUB_USER = "vibe2code";
const AVATAR_URL = "https://avatars.githubusercontent.com/u/222844068?v=";

const translations = {
  en: {
    tagline: "Zero‑code apps and scripts by <b>PINGVI</b>. Pure vibe‑coding with AI.",
    projects: "Projects",
    updated_label: "Updated",
    stat_followers: "Followers",
    stat_repos: "Repos",
    switch_lang: "🌐",
  },
  ru: {
    tagline: "Zero‑code приложения и скрипты от <b>PINGVI</b>. Чистый вайб‑кодинг с нейронками.",
    projects: "Проекты",
    updated_label: "Обновлено",
    stat_followers: "Подписчики",
    stat_repos: "Репозитории",
    switch_lang: "🌐",
  }
};

function detectLanguage() {
  const saved = localStorage.getItem("v2c_lang");
  if (saved) return saved;
  const sys = (navigator.language || navigator.userLanguage || "en").toLowerCase();
  return sys.startsWith("ru") ? "ru" : "en";
}

function applyLanguage(lang) {
  const t = translations[lang] || translations.en;
  document.documentElement.lang = lang;
  const taglineEl = document.querySelector("#site-tagline");
  if (taglineEl) taglineEl.innerHTML = t.tagline ?? "";
  const introEl = document.querySelector("#intro-text");
  if (introEl) introEl.textContent = t.intro ?? "";
  const projectsTitleEl = document.querySelector("#projects-title");
  if (projectsTitleEl) projectsTitleEl.textContent = t.projects ?? "";
  const langToggle = document.querySelector("#lang-toggle");
  const flag = lang === "ru" ? "🇷🇺" : "🇬🇧";
  if (langToggle) {
    langToggle.textContent = flag;
    langToggle.setAttribute("aria-label", lang === "ru" ? "Язык: Русский" : "Language: English");
    langToggle.setAttribute("title", lang === "ru" ? "Русский" : "English");
  }

  // no sorting UI anymore
  const year = new Date().getFullYear();
  const line1 = document.querySelector("#footer-line-1");
  if (line1) line1.innerHTML = `© <span id="year">${year}</span> vibe2code`;
  // update stat captions
  const capFollowers = document.querySelector('#followers-caption');
  const capRepos = document.querySelector('#repos-caption');
  if (capFollowers) capFollowers.textContent = t.stat_followers;
  if (capRepos) capRepos.textContent = t.stat_repos;
}

function setupControls() {
  const langToggle = document.querySelector("#lang-toggle");
  if (langToggle) langToggle.addEventListener("click", () => {
    const curr = detectLanguage();
    const next = curr === "ru" ? "en" : "ru";
    localStorage.setItem("v2c_lang", next);
    applyLanguage(next);
    // re-render to refresh localized labels
    const grid = document.querySelector("#projects-grid");
    if (grid) {
      loadRepos();
    }
  });
}

function setAvatar() {
  const img = document.querySelector("#avatar");
  img.addEventListener("error", () => {
    img.src = "https://avatars.githubusercontent.com/u/222844068";
  });
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(detectLanguage(), { year: "numeric", month: "short", day: "2-digit" });
  } catch { return iso; }
}

function sortRepos(repos, mode) {
  if (mode === "name") return repos.sort((a, b) => a.name.localeCompare(b.name));
  if (mode === "updated") return repos.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
  // stars default
  return repos.sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at)));
}

function repoCard(repo) {
  const repoUrl = repo.html_url;
  const fullName = `${GITHUB_USER}/${repo.name}`;
  const desc = repo.description || "";
  const t = translations[detectLanguage()] || translations.en;

  const wrapper = document.createElement("article");
  wrapper.className = "card";

  const titleRow = document.createElement("div");
  titleRow.className = "title";
  const h3 = document.createElement("h3");
  h3.textContent = repo.name;
  titleRow.appendChild(h3);

  const p = document.createElement("p");
  p.textContent = desc;

  const tags = document.createElement("div");
  tags.className = "tags";
  if (repo.language) {
    const el = document.createElement("span");
    el.className = "tag";
    el.textContent = repo.language;
    tags.appendChild(el);
  }

  const chips = document.createElement("div");
  chips.className = "repo-chips";
  if (repo.stargazers_count && repo.stargazers_count > 0) {
    const chipStar = document.createElement("span");
    chipStar.className = "chip-star";
    chipStar.innerHTML = `<span class="icon">⭐</span><span>${repo.stargazers_count}</span>`;
    chips.appendChild(chipStar);
  }
  if (repo.forks_count && repo.forks_count > 0) {
    const chipFork = document.createElement("span");
    chipFork.className = "chip-fork";
    chipFork.innerHTML = `<span class="icon">🍴</span><span>${repo.forks_count}</span>`;
    chips.appendChild(chipFork);
  }

  const aLink = document.createElement("a");
  aLink.className = "repo-link";
  aLink.href = repoUrl; aLink.target = "_blank"; aLink.rel = "noopener noreferrer";

  wrapper.appendChild(titleRow);
  wrapper.appendChild(p);
  wrapper.appendChild(tags);
  wrapper.appendChild(chips);
  wrapper.appendChild(aLink);
  return wrapper;
}

async function loadRepos() {
  const grid = document.querySelector("#projects-grid");
  grid.innerHTML = "";
  // skeletons
  for (let i = 0; i < 6; i++) {
    const sk = document.createElement("div"); sk.className = "card"; sk.style.minHeight = "120px"; grid.appendChild(sk);
  }
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`, {
      headers: {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });
    if (!res.ok) throw new Error("GitHub API error " + res.status);
    let repos = await res.json();
    // keep only non-archived, prioritize originals over forks; default sort by stars then updated
    repos = repos.filter(r => !r.archived);
    repos = sortRepos(repos, "stars");
    // prefer originals first
    repos.sort((a, b) => (a.fork === b.fork) ? 0 : (a.fork ? 1 : -1));
    grid.innerHTML = "";
    repos.forEach(repo => grid.appendChild(repoCard(repo)));
  } catch (e) {
    grid.innerHTML = `<div class="card"><p>${e.message}. Try later or use VPN.</p></div>`;
  }
}

function setYear() {
  const y = new Date().getFullYear();
  document.querySelector("#year").textContent = String(y);
}

document.addEventListener("DOMContentLoaded", () => {
  // language
  const lang = detectLanguage();
  applyLanguage(lang);
  setupControls();
  setAvatar();
  setYear();
  loadRepos();
  // fetch user stats for top badges
  fetch(`https://api.github.com/users/${GITHUB_USER}`)
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(user => {
      const followersEl = document.querySelector('#followers-count');
      const reposEl = document.querySelector('#repos-count');
      if (followersEl) followersEl.textContent = String(user.followers ?? '—');
      if (reposEl) reposEl.textContent = String(user.public_repos ?? '—');
    })
    .catch(() => {});
});


