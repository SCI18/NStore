(function () {
  const STORAGE_KEY = "nstore-lang";
  const cache = {};
  let current = localStorage.getItem(STORAGE_KEY) || (window.STORE_CONFIG && window.STORE_CONFIG.defaultLang) || "en";

  function getPath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
  }

  async function loadLang(lang) {
    if (cache[lang]) return cache[lang];
    const res = await fetch(`lang/${lang}.json`);
    if (!res.ok) throw new Error(`Could not load language pack: ${lang}`);
    const data = await res.json();
    cache[lang] = data;
    return data;
  }

  function applyToDom(dict) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const value = getPath(dict, el.getAttribute("data-i18n"));
      if (value != null) el.textContent = value;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const value = getPath(dict, el.getAttribute("data-i18n-placeholder"));
      if (value != null) el.setAttribute("placeholder", value);
    });
    const titleKey = document.documentElement.getAttribute("data-i18n-title");
    if (titleKey) {
      const value = getPath(dict, titleKey);
      if (value != null) document.title = value;
    }
    document.documentElement.setAttribute("lang", current);
  }

  async function setLang(lang) {
    const dict = await loadLang(lang);
    current = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyToDom(dict);
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang-btn") === lang);
    });
    window.dispatchEvent(new CustomEvent("i18nchanged", { detail: { lang, dict } }));
  }

  function t(path) {
    const dict = cache[current];
    return dict ? getPath(dict, path) : null;
  }

  function getLang() {
    return current;
  }

  window.i18n = { setLang, t, getLang, loadLang };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang-btn")));
    });
    setLang(current);
  });
})();
