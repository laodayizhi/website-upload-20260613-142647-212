import { H as Hls } from "./hls.js";

function ready(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

function initPlayer(player) {
  const video = player.querySelector("video[data-src]");
  const playButton = player.querySelector("[data-play-button]");
  const sourceButtons = Array.from(player.querySelectorAll("[data-source]"));
  let hls = null;
  let currentUrl = "";
  let currentFallback = "";

  if (!video) {
    return;
  }

  function destroyHls() {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  }

  function useFallback() {
    if (!currentFallback) {
      return;
    }
    destroyHls();
    video.src = currentFallback;
    video.load();
  }

  function bindSource(url, fallback) {
    currentUrl = url;
    currentFallback = fallback || "";
    destroyHls();
    video.removeAttribute("src");
    video.load();

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.load();
      return;
    }

    if (Hls && Hls.isSupported && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(url);
      hls.attachMedia(video);

      if (Hls.Events && Hls.Events.ERROR) {
        hls.on(Hls.Events.ERROR, function (_event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            useFallback();
          }
        });
      }
      return;
    }

    useFallback();
  }

  function playVideo() {
    if (!currentUrl) {
      bindSource(video.dataset.src, video.dataset.fallback);
    }
    const promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {
        if (currentFallback && video.src.indexOf(currentFallback) === -1) {
          useFallback();
          video.play().catch(function () {});
        }
      });
    }
  }

  bindSource(video.dataset.src, video.dataset.fallback);

  if (playButton) {
    playButton.addEventListener("click", playVideo);
    video.addEventListener("play", function () {
      playButton.classList.add("is-hidden");
    });
    video.addEventListener("pause", function () {
      playButton.classList.remove("is-hidden");
    });
  }

  sourceButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      sourceButtons.forEach(function (item) {
        item.classList.toggle("is-active", item === button);
      });
      bindSource(button.dataset.source, button.dataset.fallback);
      playVideo();
    });
  });
}

ready(function () {
  document.querySelectorAll("[data-player]").forEach(initPlayer);
});
