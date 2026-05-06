(function () {
  const CUSTOM_THEME = "custom";
  const body = document.body;
  const themeButtons = Array.from(document.querySelectorAll("[data-theme-option]"));
  const languageTabs = Array.from(document.querySelectorAll("[data-language-filter]"));
  const exampleCode = document.getElementById("exampleCode");
  const examplePreview = document.getElementById("examplePreview");
  const previewLanguage = document.getElementById("previewLanguage");
  const exampleData = document.getElementById("exampleData");
  const themeDrawer = document.querySelector(".theme-drawer");
  const baseThemeSelect = document.getElementById("baseThemeSelect");
  const duplicateTheme = document.getElementById("duplicateTheme");
  const customThemeSwatch = document.getElementById("customThemeSwatch");
  const tokenControls = document.getElementById("tokenControls");
  const themeCssOutput = document.getElementById("themeCssOutput");
  const examples = exampleData ? JSON.parse(exampleData.textContent) : [];
  const codeByLanguage = new Map(examples.map((example) => [example.language, example.code]));
  let currentLanguage = examples[0] ? examples[0].language : "ruby";
  let themeProbe = null;
  let customThemeState = null;
  let displayedThemeState = null;
  let syncingEditor = false;

  const editorFields = {
    backgroundPicker: document.getElementById("themeBackgroundPicker"),
    backgroundText: document.getElementById("themeBackgroundText"),
    foregroundPicker: document.getElementById("themeForegroundPicker"),
    foregroundText: document.getElementById("themeForegroundText"),
    fontFamily: document.getElementById("themeFontFamily"),
    fontSize: document.getElementById("themeFontSize"),
    lineHeight: document.getElementById("themeLineHeight"),
    fontWeight: document.getElementById("themeFontWeight"),
    tabSize: document.getElementById("themeTabSize"),
    colorCount: document.getElementById("themeColorCount"),
    backgroundCount: document.getElementById("themeBackgroundCount"),
    italicCount: document.getElementById("themeItalicCount"),
    boldCount: document.getElementById("themeBoldCount"),
  };

  const tokenDefinitions = [
    { key: "comment", label: "Comment", sample: "// note", classes: ["c", "ch", "cd", "cm", "cpf", "c1", "cs"] },
    { key: "preprocessor", label: "Preprocessor", sample: "#define", classes: ["cp"] },
    { key: "keyword", label: "Keyword", sample: "return", classes: ["k", "kn", "kp", "kr", "kv"] },
    { key: "declaration", label: "Declaration", sample: "const", classes: ["kd"] },
    { key: "constant", label: "Constant", sample: "true", classes: ["kc"] },
    { key: "type", label: "Type", sample: "String", classes: ["kt"] },
    { key: "name", label: "Name", sample: "value", classes: ["n"] },
    { key: "builtin", label: "Built-in", sample: "puts", classes: ["nb", "bp"] },
    { key: "class", label: "Class", sample: "Theme", classes: ["nc"] },
    { key: "namespace", label: "Namespace", sample: "Rouge", classes: ["nn"] },
    { key: "function", label: "Function", sample: "render", classes: ["nf", "fm"] },
    { key: "exception", label: "Exception", sample: "Error", classes: ["ne"] },
    { key: "constantName", label: "Constant Name", sample: "MAX", classes: ["no"] },
    { key: "attribute", label: "Attribute", sample: "href", classes: ["na"] },
    { key: "decorator", label: "Decorator", sample: "@memo", classes: ["nd"] },
    { key: "tag", label: "Tag", sample: "section", classes: ["nt"] },
    { key: "label", label: "Label", sample: "target", classes: ["nl"] },
    { key: "property", label: "Property", sample: "color", classes: ["py"] },
    { key: "variable", label: "Variable", sample: "$theme", classes: ["nv", "vc", "vg", "vi", "vm"] },
    { key: "string", label: "String", sample: "\"text\"", classes: ["s", "sb", "sc", "dl", "sd", "s2", "sh", "sx", "s1"] },
    { key: "escape", label: "Escape", sample: "\\n", classes: ["se"] },
    { key: "interpolation", label: "Interpolation", sample: "#{x}", classes: ["si"] },
    { key: "regex", label: "Regex", sample: "/[a-z]/", classes: ["sr"] },
    { key: "symbol", label: "Symbol", sample: ":name", classes: ["ss"] },
    { key: "number", label: "Number", sample: "42", classes: ["m", "mb", "mf", "mh", "mi", "il", "mo", "mx"] },
    { key: "operator", label: "Operator", sample: "=>", classes: ["o", "ow"] },
    { key: "punctuation", label: "Punctuation", sample: "{ }", classes: ["p", "pi"] },
    { key: "error", label: "Error", sample: "error", classes: ["err", "gr"] },
    { key: "deleted", label: "Deleted", sample: "- line", classes: ["gd"] },
    { key: "inserted", label: "Inserted", sample: "+ line", classes: ["gi"] },
    { key: "heading", label: "Heading", sample: "Title", classes: ["gh"] },
    { key: "subheading", label: "Subheading", sample: "Section", classes: ["gu"] },
    { key: "lineNumber", label: "Line Number", sample: "12", classes: ["gl"] },
    { key: "traceback", label: "Traceback", sample: "trace", classes: ["gt"] },
    { key: "entity", label: "Entity", sample: "&amp;", classes: ["ni"] },
    { key: "emphasis", label: "Emphasis", sample: "italic", classes: ["ge"] },
    { key: "strong", label: "Strong", sample: "bold", classes: ["gs"] },
    { key: "strongEmphasis", label: "Strong Emphasis", sample: "both", classes: ["ges"] },
  ];

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

  function clampNumber(value, min, max, fallback) {
    const number = Number.parseFloat(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, number));
  }

  function rounded(value, places) {
    const factor = 10 ** places;
    return Math.round(value * factor) / factor;
  }

  function expandHex(value) {
    const match = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);

    if (!match) {
      return null;
    }

    const hex = match[1];

    if (hex.length === 3) {
      return `#${hex.split("").map((char) => char + char).join("")}`.toLowerCase();
    }

    return `#${hex}`.toLowerCase();
  }

  function rgbToHex(value) {
    const match = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)$/i);

    if (!match) {
      return null;
    }

    const alpha = match[4] === undefined ? 1 : Number.parseFloat(match[4]);

    if (alpha === 0) {
      return "transparent";
    }

    return `#${[match[1], match[2], match[3]]
      .map((channel) => Number(channel).toString(16).padStart(2, "0"))
      .join("")}`.toLowerCase();
  }

  function normalizedColor(value, fallback) {
    const trimmed = String(value || "").trim();

    if (!trimmed || trimmed.toLowerCase() === "transparent" || trimmed === "rgba(0, 0, 0, 0)") {
      return fallback;
    }

    return expandHex(trimmed) || rgbToHex(trimmed) || fallback;
  }

  function solidColor(value, fallback) {
    const color = normalizedColor(value, fallback);
    return color === "transparent" ? fallback : color;
  }

  function optionalColor(value) {
    return normalizedColor(value, "transparent");
  }

  function pickerColor(value, fallback) {
    const color = normalizedColor(value, fallback);
    return color === "transparent" ? fallback : color;
  }

  function isBold(weight) {
    const numeric = Number.parseInt(weight, 10);
    return weight === "bold" || Number.isFinite(numeric) && numeric >= 600;
  }

  function cloneThemeState(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function tokenSelector(definition, themeName) {
    return definition.classes
      .map((className) => `body[data-theme="${themeName}"] .highlight .${className}`)
      .join(", ");
  }

  function getThemeProbe() {
    if (themeProbe) {
      return themeProbe;
    }

    themeProbe = document.createElement("div");
    themeProbe.className = "theme-probe";
    themeProbe.setAttribute("aria-hidden", "true");
    themeProbe.style.cssText = [
      "position:absolute",
      "left:-9999px",
      "top:0",
      "width:1px",
      "height:1px",
      "overflow:hidden",
      "visibility:hidden",
      "pointer-events:none",
    ].join(";");

    const highlight = document.createElement("div");
    highlight.className = "highlight";
    const pre = document.createElement("pre");
    const code = document.createElement("code");

    tokenDefinitions.forEach((definition) => {
      const span = document.createElement("span");
      span.className = definition.classes[0];
      span.dataset.tokenProbe = definition.key;
      span.textContent = definition.sample;
      code.appendChild(span);
      code.appendChild(document.createTextNode(" "));
    });

    pre.appendChild(code);
    highlight.appendChild(pre);
    themeProbe.appendChild(highlight);
    body.appendChild(themeProbe);
    return themeProbe;
  }

  function captureThemeStyles(theme) {
    const probe = getThemeProbe();
    const previousTheme = body.dataset.theme;
    body.dataset.theme = theme;

    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const bodyStyle = getComputedStyle(body);
    const highlightStyle = getComputedStyle(probe.querySelector(".highlight"));
    const codeStyle = getComputedStyle(probe.querySelector("code"));
    const fontSizePx = Number.parseFloat(codeStyle.fontSize) || rootFontSize * 0.92;
    const lineHeightPx = Number.parseFloat(codeStyle.lineHeight);
    const codeLineHeight = Number.isFinite(lineHeightPx) ? rounded(lineHeightPx / fontSizePx, 2) : 1.6;
    const activeBackground = solidColor(
      bodyStyle.getPropertyValue("--active-code-bg"),
      solidColor(highlightStyle.backgroundColor, "#ffffff")
    );
    const activeForeground = solidColor(
      bodyStyle.getPropertyValue("--active-code-fg"),
      solidColor(highlightStyle.color, "#111111")
    );
    const state = {
      name: theme,
      background: activeBackground,
      foreground: activeForeground,
      fontFamily: "var(--mono)",
      fontSize: rounded(fontSizePx / rootFontSize, 2),
      lineHeight: codeLineHeight,
      fontWeight: String(Number.parseInt(codeStyle.fontWeight, 10) || 400),
      tabSize: Number.parseInt(codeStyle.getPropertyValue("tab-size"), 10) || 2,
      tokens: {},
    };

    tokenDefinitions.forEach((definition) => {
      const tokenStyle = getComputedStyle(probe.querySelector(`[data-token-probe="${definition.key}"]`));
      state.tokens[definition.key] = {
        color: solidColor(tokenStyle.color, activeForeground),
        background: optionalColor(tokenStyle.backgroundColor),
        bold: isBold(tokenStyle.fontWeight),
        italic: tokenStyle.fontStyle === "italic" || tokenStyle.fontStyle.startsWith("oblique"),
        underline: tokenStyle.textDecorationLine.split(" ").includes("underline"),
      };
    });

    body.dataset.theme = previousTheme;
    return state;
  }

  function buildCustomThemeCss(state) {
    const lines = [
      `body[data-theme="${CUSTOM_THEME}"] {`,
      `  --active-code-bg: ${state.background};`,
      `  --active-code-fg: ${state.foreground};`,
      "}",
      "",
      `body[data-theme="${CUSTOM_THEME}"] .highlight,`,
      `body[data-theme="${CUSTOM_THEME}"] .highlight .w {`,
      `  color: ${state.foreground};`,
      `  background-color: ${state.background};`,
      "}",
      "",
      `body[data-theme="${CUSTOM_THEME}"] .highlight code {`,
      `  font-family: ${state.fontFamily};`,
      `  font-size: ${state.fontSize}rem;`,
      `  line-height: ${state.lineHeight};`,
      `  font-weight: ${state.fontWeight};`,
      `  tab-size: ${state.tabSize};`,
      "}",
    ];

    tokenDefinitions.forEach((definition) => {
      const token = state.tokens[definition.key];

      if (!token) {
        return;
      }

      lines.push(
        "",
        `${tokenSelector(definition, CUSTOM_THEME)} {`,
        `  color: ${token.color};`,
        `  font-weight: ${token.bold ? "700" : "400"};`,
        `  font-style: ${token.italic ? "italic" : "normal"};`,
        `  text-decoration: ${token.underline ? "underline" : "none"};`
      );

      if (token.background !== "transparent") {
        lines.push(`  background-color: ${token.background};`);
      }

      lines.push("}");
    });

    return `${lines.join("\n")}\n`;
  }

  function applyCustomThemeCss(state) {
    let style = document.getElementById("customThemeStyle");

    if (!style) {
      style = document.createElement("style");
      style.id = "customThemeStyle";
      document.head.appendChild(style);
    }

    style.textContent = buildCustomThemeCss(state);
  }

  function createTokenControls() {
    if (!tokenControls) {
      return;
    }

    tokenControls.innerHTML = tokenDefinitions.map((definition) => `
      <article class="token-row" data-token-key="${definition.key}">
        <div class="token-row-heading">
          <span class="token-sample" data-token-sample>${escapeHtml(definition.sample)}</span>
          <span class="token-title">${escapeHtml(definition.label)}</span>
          <code>${escapeHtml(definition.classes.map((className) => `.${className}`).join(" "))}</code>
        </div>
        <div class="token-row-controls">
          <label class="color-field token-color-field">
            <span>Text</span>
            <input type="color" data-token-color-picker="color" value="#24292f">
            <input type="text" data-token-color-text="color" value="#24292f" spellcheck="false">
          </label>
          <label class="color-field token-color-field">
            <span>Bg</span>
            <input type="color" data-token-color-picker="background" value="#f6f8fa">
            <input type="text" data-token-color-text="background" value="transparent" spellcheck="false">
          </label>
          <div class="token-toggles" aria-label="${escapeHtml(definition.label)} text style">
            <label title="Bold"><input type="checkbox" data-token-toggle="bold"><span>B</span></label>
            <label title="Italic"><input type="checkbox" data-token-toggle="italic"><span>I</span></label>
            <label title="Underline"><input type="checkbox" data-token-toggle="underline"><span>U</span></label>
          </div>
        </div>
      </article>
    `).join("");
  }

  function setColorPair(picker, text, value, fallback) {
    if (!picker || !text) {
      return;
    }

    const color = value === "transparent" ? "transparent" : solidColor(value, fallback);
    text.value = color;
    picker.value = pickerColor(color, fallback);
  }

  function updateTokenSamples(state) {
    if (!tokenControls) {
      return;
    }

    tokenDefinitions.forEach((definition) => {
      const token = state.tokens[definition.key];
      const row = tokenControls.querySelector(`[data-token-key="${definition.key}"]`);
      const sample = row ? row.querySelector("[data-token-sample]") : null;

      if (!token || !sample) {
        return;
      }

      sample.style.color = token.color;
      sample.style.backgroundColor = token.background;
      sample.style.fontWeight = token.bold ? "700" : "400";
      sample.style.fontStyle = token.italic ? "italic" : "normal";
      sample.style.textDecoration = token.underline ? "underline" : "none";
    });
  }

  function updateThemeStats(state) {
    const colors = new Set([state.background, state.foreground]);
    let backgroundCount = 0;
    let italicCount = 0;
    let boldCount = 0;

    Object.values(state.tokens).forEach((token) => {
      colors.add(token.color);

      if (token.background !== "transparent") {
        colors.add(token.background);
        backgroundCount += 1;
      }

      if (token.italic) {
        italicCount += 1;
      }

      if (token.bold) {
        boldCount += 1;
      }
    });

    if (editorFields.colorCount) {
      editorFields.colorCount.textContent = String(colors.size);
    }

    if (editorFields.backgroundCount) {
      editorFields.backgroundCount.textContent = String(backgroundCount);
    }

    if (editorFields.italicCount) {
      editorFields.italicCount.textContent = String(italicCount);
    }

    if (editorFields.boldCount) {
      editorFields.boldCount.textContent = String(boldCount);
    }
  }

  function updateCustomSwatch(state) {
    if (!customThemeSwatch) {
      return;
    }

    customThemeSwatch.style.setProperty("--swatch-bg", state.background);
    customThemeSwatch.style.setProperty("--swatch-fg", state.foreground);
  }

  function updateCssOutput(state) {
    if (themeCssOutput) {
      themeCssOutput.value = buildCustomThemeCss(state);
    }
  }

  function renderEditorState(state) {
    if (!state || !tokenControls) {
      return;
    }

    syncingEditor = true;
    displayedThemeState = cloneThemeState(state);
    setColorPair(editorFields.backgroundPicker, editorFields.backgroundText, state.background, "#ffffff");
    setColorPair(editorFields.foregroundPicker, editorFields.foregroundText, state.foreground, "#111111");

    if (editorFields.fontFamily) {
      editorFields.fontFamily.value = state.fontFamily;
    }

    if (editorFields.fontSize) {
      editorFields.fontSize.value = state.fontSize;
    }

    if (editorFields.lineHeight) {
      editorFields.lineHeight.value = state.lineHeight;
    }

    if (editorFields.fontWeight) {
      editorFields.fontWeight.value = state.fontWeight;
    }

    if (editorFields.tabSize) {
      editorFields.tabSize.value = state.tabSize;
    }

    tokenDefinitions.forEach((definition) => {
      const row = tokenControls.querySelector(`[data-token-key="${definition.key}"]`);
      const token = state.tokens[definition.key];

      if (!row || !token) {
        return;
      }

      setColorPair(
        row.querySelector('[data-token-color-picker="color"]'),
        row.querySelector('[data-token-color-text="color"]'),
        token.color,
        state.foreground
      );
      setColorPair(
        row.querySelector('[data-token-color-picker="background"]'),
        row.querySelector('[data-token-color-text="background"]'),
        token.background,
        state.background
      );
      row.querySelector('[data-token-toggle="bold"]').checked = token.bold;
      row.querySelector('[data-token-toggle="italic"]').checked = token.italic;
      row.querySelector('[data-token-toggle="underline"]').checked = token.underline;
    });

    updateTokenSamples(state);
    updateThemeStats(state);
    updateCssOutput(state);
    syncingEditor = false;
  }

  function readEditorState() {
    const fallback = displayedThemeState || customThemeState || captureThemeStyles(body.dataset.theme || "github");
    const background = solidColor(editorFields.backgroundText.value, fallback.background);
    const foreground = solidColor(editorFields.foregroundText.value, fallback.foreground);
    const state = {
      name: CUSTOM_THEME,
      background,
      foreground,
      fontFamily: editorFields.fontFamily.value,
      fontSize: rounded(clampNumber(editorFields.fontSize.value, 0.72, 1.5, fallback.fontSize), 2),
      lineHeight: rounded(clampNumber(editorFields.lineHeight.value, 1, 2.4, fallback.lineHeight), 2),
      fontWeight: editorFields.fontWeight.value,
      tabSize: Math.round(clampNumber(editorFields.tabSize.value, 1, 8, fallback.tabSize)),
      tokens: {},
    };

    tokenDefinitions.forEach((definition) => {
      const row = tokenControls.querySelector(`[data-token-key="${definition.key}"]`);
      const fallbackToken = fallback.tokens[definition.key];

      state.tokens[definition.key] = {
        color: solidColor(row.querySelector('[data-token-color-text="color"]').value, fallbackToken.color),
        background: optionalColor(row.querySelector('[data-token-color-text="background"]').value),
        bold: row.querySelector('[data-token-toggle="bold"]').checked,
        italic: row.querySelector('[data-token-toggle="italic"]').checked,
        underline: row.querySelector('[data-token-toggle="underline"]').checked,
      };
    });

    return state;
  }

  function handleEditorInput() {
    if (syncingEditor || !tokenControls) {
      return;
    }

    const state = readEditorState();
    customThemeState = cloneThemeState(state);
    displayedThemeState = cloneThemeState(state);
    applyCustomThemeCss(customThemeState);
    updateCustomSwatch(customThemeState);
    updateTokenSamples(customThemeState);
    updateThemeStats(customThemeState);
    updateCssOutput(customThemeState);
    setTheme(CUSTOM_THEME, { syncEditor: false });
  }

  function syncTextFromPicker(event) {
    const picker = event.target;
    const text = picker.parentElement.querySelector('input[type="text"]');

    if (text) {
      text.value = picker.value;
    }

    handleEditorInput();
  }

  function syncPickerFromText(event) {
    const text = event.target;
    const picker = text.parentElement.querySelector('input[type="color"]');
    const fallback = text.id === "themeForegroundText" ? "#111111" : "#ffffff";

    if (picker) {
      picker.value = pickerColor(text.value, fallback);
    }

    handleEditorInput();
  }

  function syncTokenControl(event) {
    const target = event.target;

    if (target.matches("[data-token-color-picker]")) {
      const text = target.parentElement.querySelector(`[data-token-color-text="${target.dataset.tokenColorPicker}"]`);

      if (text) {
        text.value = target.value;
      }
    }

    if (target.matches("[data-token-color-text]")) {
      const picker = target.parentElement.querySelector(`[data-token-color-picker="${target.dataset.tokenColorText}"]`);
      const fallback = target.dataset.tokenColorText === "background"
        ? editorFields.backgroundPicker.value
        : editorFields.foregroundPicker.value;

      if (picker) {
        picker.value = pickerColor(target.value, fallback);
      }
    }

    handleEditorInput();
  }

  function duplicateSelectedTheme() {
    const sourceTheme = baseThemeSelect ? baseThemeSelect.value : body.dataset.theme || "github";
    customThemeState = captureThemeStyles(sourceTheme);
    applyCustomThemeCss(customThemeState);
    updateCustomSwatch(customThemeState);
    setTheme(CUSTOM_THEME);
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

  function setTheme(theme, options = {}) {
    body.dataset.theme = theme;

    themeButtons.forEach((button) => {
      const active = button.dataset.themeOption === theme;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (theme !== CUSTOM_THEME && baseThemeSelect) {
      baseThemeSelect.value = theme;
    }

    if (options.syncEditor === false || !tokenControls) {
      return;
    }

    if (theme === CUSTOM_THEME) {
      if (!customThemeState) {
        customThemeState = captureThemeStyles(baseThemeSelect ? baseThemeSelect.value : "github");
        applyCustomThemeCss(customThemeState);
      }

      renderEditorState(customThemeState);
      return;
    }

    const capturedState = captureThemeStyles(theme);

    if (!customThemeState) {
      customThemeState = cloneThemeState(capturedState);
      applyCustomThemeCss(customThemeState);
      updateCustomSwatch(customThemeState);
    }

    renderEditorState(capturedState);
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

  createTokenControls();

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

  if (baseThemeSelect) {
    baseThemeSelect.addEventListener("change", () => setTheme(baseThemeSelect.value));
  }

  if (duplicateTheme) {
    duplicateTheme.addEventListener("click", duplicateSelectedTheme);
  }

  [editorFields.backgroundPicker, editorFields.foregroundPicker].forEach((picker) => {
    if (picker) {
      picker.addEventListener("input", syncTextFromPicker);
    }
  });

  [editorFields.backgroundText, editorFields.foregroundText].forEach((text) => {
    if (text) {
      text.addEventListener("input", syncPickerFromText);
    }
  });

  [
    editorFields.fontFamily,
    editorFields.fontSize,
    editorFields.lineHeight,
    editorFields.fontWeight,
    editorFields.tabSize,
  ].forEach((field) => {
    if (field) {
      field.addEventListener("input", handleEditorInput);
      field.addEventListener("change", handleEditorInput);
    }
  });

  if (tokenControls) {
    tokenControls.addEventListener("input", syncTokenControl);
    tokenControls.addEventListener("change", syncTokenControl);
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
