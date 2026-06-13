(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function optionList(items, key, numeric) {
    var seen = Object.create(null);
    items.forEach(function (item) {
      if (item[key]) {
        seen[item[key]] = true;
      }
    });
    return Object.keys(seen).sort(function (a, b) {
      if (numeric) {
        return Number(b) - Number(a);
      }
      return a.localeCompare(b, "zh-CN");
    });
  }

  function fillSelect(select, values) {
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function createCard(movie) {
    var tags = Array.isArray(movie.tags) ? movie.tags.join(" ") : "";
    var text = movie.oneLine || movie.summary || "";
    var brief = text.length > 72 ? text.slice(0, 72).replace(/[，。,.、\s]+$/g, "") + "…" : text;
    var article = document.createElement("article");
    article.className = "movie-card";
    article.setAttribute("data-movie-card", "");
    article.setAttribute("data-title", movie.title || "");
    article.setAttribute("data-region", movie.region || "");
    article.setAttribute("data-type", movie.type || "");
    article.setAttribute("data-year", movie.year || "");
    article.setAttribute("data-genre", movie.genre || "");
    article.setAttribute("data-tags", tags);
    article.innerHTML = [
      '<a class="movie-card__link" href="' + movie.url + '">',
      '  <div class="movie-card__poster">',
      '    <img src="./' + movie.image + '.jpg" alt="' + escapeHtml(movie.title) + '海报" loading="lazy">',
      '    <span class="play-mark" aria-hidden="true">▶</span>',
      '    <span class="poster-pill poster-pill--top">' + escapeHtml(movie.type) + '</span>',
      '    <span class="poster-pill poster-pill--bottom">' + escapeHtml(movie.year) + '</span>',
      '  </div>',
      '  <div class="movie-card__body">',
      '    <h3>' + escapeHtml(movie.title) + '</h3>',
      '    <p>' + escapeHtml(brief) + '</p>',
      '    <div class="movie-card__meta">',
      '      <span>' + escapeHtml(movie.region) + '</span>',
      '      <span>' + escapeHtml(movie.genre) + '</span>',
      '    </div>',
      '  </div>',
      '</a>'
    ].join("");
    return article;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      }[character];
    });
  }

  function initSearch() {
    var data = window.MOVIE_SEARCH_DATA || [];
    var form = document.querySelector("[data-search-form]");
    var input = document.querySelector("[data-search-input]");
    var typeSelect = document.querySelector("[data-search-type]");
    var yearSelect = document.querySelector("[data-search-year]");
    var regionSelect = document.querySelector("[data-search-region]");
    var results = document.querySelector("[data-search-results]");
    var empty = document.querySelector("[data-search-empty]");
    if (!form || !input || !results) {
      return;
    }

    fillSelect(typeSelect, optionList(data, "type", false));
    fillSelect(yearSelect, optionList(data, "year", true));
    fillSelect(regionSelect, optionList(data, "region", false));

    var params = new URLSearchParams(window.location.search);
    input.value = params.get("q") || "";

    function apply() {
      var query = normalize(input.value);
      var type = typeSelect.value;
      var year = yearSelect.value;
      var region = regionSelect.value;
      var matched = data.filter(function (movie) {
        var haystack = normalize([
          movie.title,
          movie.type,
          movie.region,
          movie.year,
          movie.genre,
          movie.tags && movie.tags.join(" "),
          movie.oneLine,
          movie.summary
        ].join(" "));
        return (!query || haystack.indexOf(query) !== -1) &&
          (!type || movie.type === type) &&
          (!year || movie.year === year) &&
          (!region || movie.region === region);
      });

      if (!query && !type && !year && !region) {
        matched = data.slice(0, 48);
      }

      results.innerHTML = "";
      matched.forEach(function (movie) {
        results.appendChild(createCard(movie));
      });
      empty.hidden = matched.length !== 0;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var params = new URLSearchParams();
      if (input.value.trim()) {
        params.set("q", input.value.trim());
      }
      var url = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState({}, "", url);
      apply();
    });

    [input, typeSelect, yearSelect, regionSelect].forEach(function (control) {
      control.addEventListener("input", apply);
      control.addEventListener("change", apply);
    });

    apply();
  }

  ready(initSearch);
})();
