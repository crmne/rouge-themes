(function () {
  const body = document.body;
  const themeButtons = Array.from(document.querySelectorAll("[data-theme-option]"));
  const languageTabs = Array.from(document.querySelectorAll("[data-language-filter]"));
  const exampleCode = document.getElementById("exampleCode");
  const examplePreview = document.getElementById("examplePreview");
  const previewLanguage = document.getElementById("previewLanguage");
  const exampleData = document.getElementById("exampleData");
  const themeDrawer = document.querySelector(".theme-drawer");
  const examples = exampleData ? JSON.parse(exampleData.textContent) : [];
  const codeByLanguage = new Map(examples.map((example) => [example.language, example.code]));
  let currentLanguage = examples[0] ? examples[0].language : "ruby";

  const classMap = new Map([
    ["keyword", "k"],
    ["built_in", "nb"],
    ["type", "kt"],
    ["literal", "kc"],
    ["number", "mi"],
    ["string", "s"],
    ["subst", "si"],
    ["symbol", "ss"],
    ["regexp", "sr"],
    ["comment", "c"],
    ["doctag", "cp"],
    ["meta", "cp"],
    ["attr", "na"],
    ["attribute", "na"],
    ["variable", "nv"],
    ["params", "p"],
    ["tag", "nt"],
    ["name", "nt"],
    ["selector-tag", "nt"],
    ["selector-class", "nc"],
    ["selector-id", "nl"],
    ["property", "py"],
    ["operator", "o"],
    ["punctuation", "p"],
  ]);

  function normalizedClassSet(span) {
    return new Set(Array.from(span.classList, (name) => name.replace(/^hljs-/, "")));
  }

  function rougeClassFor(span) {
    const classes = normalizedClassSet(span);

    if (classes.has("title") && (classes.has("function_") || classes.has("function"))) {
      return "nf";
    }

    if (classes.has("title") && classes.has("class_")) {
      return "nc";
    }

    if (classes.has("title")) {
      return "n";
    }

    for (const name of classes) {
      if (classMap.has(name)) {
        return classMap.get(name);
      }
    }

    return "n";
  }

  function mapHighlightJsToRouge(root) {
    root.querySelectorAll("span").forEach((span) => {
      span.className = rougeClassFor(span);
    });
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function highlightExampleCode() {
    if (!exampleCode || !examplePreview) {
      return;
    }

    const code = exampleCode.value;
    const language = currentLanguage;

    if (window.hljs && language && window.hljs.getLanguage(language)) {
      const result = window.hljs.highlight(code, { language, ignoreIllegals: true });
      examplePreview.innerHTML = result.value;
      mapHighlightJsToRouge(examplePreview);
      return;
    }

    examplePreview.innerHTML = escapeHtml(code);
  }

  function setTheme(theme) {
    body.dataset.theme = theme;

    themeButtons.forEach((button) => {
      const active = button.dataset.themeOption === theme;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setLanguage(language) {
    currentLanguage = language;

    languageTabs.forEach((tab) => {
      const active = tab.dataset.languageFilter === language;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    if (exampleCode) {
      exampleCode.value = codeByLanguage.get(language) || "";
    }

    if (previewLanguage) {
      previewLanguage.textContent = language;
    }

    highlightExampleCode();
  }

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.themeOption));
  });

  languageTabs.forEach((tab) => {
    tab.addEventListener("click", () => setLanguage(tab.dataset.languageFilter));
  });

  if (exampleCode) {
    exampleCode.addEventListener("input", () => {
      codeByLanguage.set(currentLanguage, exampleCode.value);
      highlightExampleCode();
    });
  }

  if (themeDrawer && window.matchMedia) {
    const drawerMedia = window.matchMedia("(max-width: 720px)");
    const syncThemeDrawer = () => {
      themeDrawer.open = !drawerMedia.matches;
    };

    syncThemeDrawer();
    drawerMedia.addEventListener("change", syncThemeDrawer);
  }

  setTheme(body.dataset.theme || "github");
  setLanguage(currentLanguage);

  if (window.hljs) {
    highlightExampleCode();
  } else {
    window.addEventListener("load", highlightExampleCode, { once: true });
  }
})();
