(function () {
  "use strict";

  var THEME_STORAGE_KEY = "eco-pilot-theme";

  function getStoredTheme() {
    try {
      var theme = localStorage.getItem(THEME_STORAGE_KEY);
      if (theme === "light" || theme === "dark") {
        return theme;
      }
    } catch (err) {
      /* ignore */
    }
    return null;
  }

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }

  function getEffectiveTheme() {
    return getStoredTheme() || getSystemTheme();
  }

  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function updateThemeToggleUi(theme) {
    var lightBtn = document.getElementById("theme-light");
    var darkBtn = document.getElementById("theme-dark");
    if (!lightBtn || !darkBtn) {
      return;
    }
    lightBtn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    darkBtn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  }

  function persistTheme(theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (err) {
      /* ignore */
    }
    applyTheme(theme);
    updateThemeToggleUi(theme);
  }

  function initTheme() {
    applyTheme(getStoredTheme());
    updateThemeToggleUi(getEffectiveTheme());

    var lightBtn = document.getElementById("theme-light");
    var darkBtn = document.getElementById("theme-dark");
    if (lightBtn) {
      lightBtn.addEventListener("click", function () {
        persistTheme("light");
      });
    }
    if (darkBtn) {
      darkBtn.addEventListener("click", function () {
        persistTheme("dark");
      });
    }

    window
      .matchMedia("(prefers-color-scheme: light)")
      .addEventListener("change", function () {
        if (!getStoredTheme()) {
          applyTheme(null);
          updateThemeToggleUi(getEffectiveTheme());
        }
      });
  }

  function dataUrl(file) {
    return new URL("./" + file, document.baseURI).href;
  }

  function loadJson(file) {
    return fetch(dataUrl(file)).then(function (response) {
      if (!response.ok) {
        throw new Error(file + " fetch failed");
      }
      return response.json();
    });
  }

  function nonEmptyString(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  function message(root, text) {
    root.replaceChildren();
    var p = document.createElement("p");
    p.className = "site-main__message";
    p.textContent = text;
    root.appendChild(p);
  }

  function renderSections(root, data) {
    if (data && nonEmptyString(data.title)) {
      document.getElementById("site-title").textContent = data.title;
      document.title = data.title + " — Status";
    }
    if (data && nonEmptyString(data.tagline)) {
      document.getElementById("site-tagline").textContent = data.tagline;
    }

    var sections = data && Array.isArray(data.sections) ? data.sections : [];
    root.replaceChildren();
    sections.forEach(function (section) {
      if (!section || !nonEmptyString(section.heading)) {
        return;
      }
      var el = document.createElement("section");
      el.className = "section";
      if (nonEmptyString(section.id)) {
        el.id = "section-" + section.id;
      }
      var h = document.createElement("h2");
      h.className = "section__title";
      h.textContent = section.heading;
      el.appendChild(h);
      if (nonEmptyString(section.body)) {
        var p = document.createElement("p");
        p.className = "section__body";
        p.textContent = section.body;
        el.appendChild(p);
      }
      root.appendChild(el);
    });
    if (!root.children.length) {
      message(root, "No status sections yet.");
    }
  }

  function toggleFaqPanel(trigger, panel) {
    var expanded = trigger.getAttribute("aria-expanded") === "true";
    trigger.setAttribute("aria-expanded", expanded ? "false" : "true");
    if (expanded) {
      panel.hidden = true;
    } else {
      panel.hidden = false;
    }
  }

  function renderFaq(root, entries) {
    var valid = (Array.isArray(entries) ? entries : []).filter(function (e) {
      return e && nonEmptyString(e.question) && nonEmptyString(e.answer);
    });
    if (!valid.length) {
      message(root, "No FAQ entries yet.");
      return;
    }
    var list = document.createElement("div");
    list.className = "faq__list";
    valid.forEach(function (entry, index) {
      var item = document.createElement("article");
      item.className = "faq__item";
      var triggerId = "faq-trigger-" + index;
      var panelId = "faq-panel-" + index;

      var heading = document.createElement("h3");
      heading.className = "faq__question-heading";
      var trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "faq__trigger";
      trigger.id = triggerId;
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", panelId);
      trigger.textContent = entry.question;
      heading.appendChild(trigger);
      item.appendChild(heading);

      var panel = document.createElement("div");
      panel.id = panelId;
      panel.className = "faq__panel";
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", triggerId);
      panel.hidden = true;
      var answer = document.createElement("p");
      answer.className = "faq__answer";
      answer.textContent = entry.answer;
      panel.appendChild(answer);
      item.appendChild(panel);

      trigger.addEventListener("click", function () {
        toggleFaqPanel(trigger, panel);
      });

      list.appendChild(item);
    });
    root.replaceChildren(list);
  }

  var GITHUB_REPO_URL = "https://github.com/Tetheree-Inc/eco-build-pilot-3";

  function validChangelogEntries(entries) {
    var valid = (Array.isArray(entries) ? entries : []).filter(function (e) {
      return e && nonEmptyString(e.title) && nonEmptyString(e.date);
    });
    valid.sort(function (a, b) {
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });
    return valid;
  }

  function renderFooter(root, entries) {
    if (!root) {
      return;
    }
    root.replaceChildren();
    var latest = validChangelogEntries(entries)[0];
    if (!latest) {
      root.textContent = "Release info unavailable.";
      return;
    }

    root.appendChild(document.createTextNode("Release "));

    if (nonEmptyString(latest.version)) {
      var version = document.createElement("span");
      version.className = "site-footer__version";
      version.textContent = latest.version;
      root.appendChild(version);
      root.appendChild(document.createTextNode(" · "));
    }

    var releaseDate = document.createElement("time");
    releaseDate.dateTime = latest.date;
    releaseDate.textContent = latest.date;
    root.appendChild(releaseDate);
    root.appendChild(document.createTextNode(" · "));

    var repoLink = document.createElement("a");
    repoLink.className = "site-footer__repo-link";
    repoLink.href = GITHUB_REPO_URL;
    repoLink.target = "_blank";
    repoLink.rel = "noopener";
    repoLink.textContent = "GitHub repository";
    root.appendChild(repoLink);
  }

  function renderChangelog(root, entries) {
    var valid = validChangelogEntries(entries);
    if (!valid.length) {
      message(root, "No changelog entries yet.");
      return;
    }
    var list = document.createElement("ul");
    list.className = "changelog__list";
    valid.forEach(function (entry) {
      var li = document.createElement("li");
      li.className = "changelog__entry";
      var header = document.createElement("p");
      header.className = "changelog__entry-meta";
      if (nonEmptyString(entry.version)) {
        var v = document.createElement("span");
        v.className = "changelog__entry-version";
        v.textContent = entry.version;
        header.appendChild(v);
        header.appendChild(document.createTextNode(" · "));
      }
      var t = document.createElement("time");
      t.dateTime = entry.date;
      t.textContent = entry.date;
      header.appendChild(t);
      var title = document.createElement("h3");
      title.className = "changelog__entry-title";
      title.textContent = entry.title;
      li.appendChild(header);
      li.appendChild(title);
      if (nonEmptyString(entry.summary)) {
        var s = document.createElement("p");
        s.className = "changelog__entry-summary";
        s.textContent = entry.summary;
        li.appendChild(s);
      }
      list.appendChild(li);
    });
    root.replaceChildren(list);
  }

  function init() {
    initTheme();

    var sectionsRoot = document.getElementById("sections-root");
    var faqRoot = document.getElementById("faq-root");
    var changelogRoot = document.getElementById("changelog-root");
    var footerMeta = document.getElementById("site-footer-meta");

    loadJson("content.json")
      .then(function (data) {
        renderSections(sectionsRoot, data);
      })
      .catch(function () {
        message(sectionsRoot, "We couldn't load the status right now.");
      });

    loadJson("faq.json")
      .then(function (data) {
        renderFaq(faqRoot, data);
      })
      .catch(function () {
        message(faqRoot, "We couldn't load the FAQ right now.");
      });

    loadJson("changelog.json")
      .then(function (data) {
        renderChangelog(changelogRoot, data);
        renderFooter(footerMeta, data);
      })
      .catch(function () {
        message(changelogRoot, "We couldn't load the changelog right now.");
        if (footerMeta) {
          footerMeta.textContent = "Release info unavailable.";
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
