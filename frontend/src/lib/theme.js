const STORAGE_KEY = "opspilot_theme";

function getTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return "dark";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function setTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

function initTheme() {
  applyTheme(getTheme());
}

export { getTheme, setTheme, initTheme };
