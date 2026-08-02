document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("intro");
  const beginBtn = document.getElementById("beginBtn");
  const music = document.getElementById("music");
  const musicBtn = document.getElementById("musicBtn");
  const scenes = [...document.querySelectorAll(".scroll-scene")];

  beginBtn.addEventListener("click", async () => {
    try {
      await music.play();
      musicBtn.textContent = "❚❚";
    } catch (_) {}
    document.body.classList.remove("locked");
    intro.style.opacity = "0";
    setTimeout(() => intro.remove(), 1000);
  });

  musicBtn.addEventListener("click", async () => {
    if (music.paused) {
      try {
        await music.play();
        musicBtn.textContent = "❚❚";
      } catch (_) {}
    } else {
      music.pause();
      musicBtn.textContent = "♪";
    }
  });

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  function smoothStep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function chapterOpacity(progress, start, peakIn, peakOut, end) {
    const a = smoothStep(start, peakIn, progress);
    const b = 1 - smoothStep(peakOut, end, progress);
    return Math.min(a, b);
  }

  const states = scenes.map(scene => {
    const video = scene.querySelector(".scene-video");
    const src = scene.dataset.video;
    video.src = src;
    const copies = [...scene.querySelectorAll(".copy")];
    const progressBar = scene.querySelector(".progress span");

    const state = {
      scene,
      video,
      copies,
      progressBar,
      duration: 0,
      targetTime: 0,
      displayedTime: 0
    };

    video.addEventListener("loadedmetadata", () => {
      state.duration = Math.max(0.1, video.duration);
      video.currentTime = 0;
    });

    return state;
  });

  function updateScene(state) {
    const rect = state.scene.getBoundingClientRect();
    const scrollable = state.scene.offsetHeight - window.innerHeight;
    const progress = clamp(-rect.top / scrollable, 0, 1);

    if (state.duration) {
      state.targetTime = progress * Math.max(0, state.duration - 0.04);
    }

    state.progressBar.style.width = `${progress * 100}%`;

    state.copies.forEach(copy => {
      const opacity = chapterOpacity(
        progress,
        Number(copy.dataset.start),
        Number(copy.dataset.peakIn),
        Number(copy.dataset.peakOut),
        Number(copy.dataset.end)
      );
      const y = (1 - opacity) * 30;
      const scale = 0.985 + opacity * 0.015;
      copy.style.opacity = opacity.toFixed(3);
      copy.style.transform = `translateY(${y}px) scale(${scale})`;
    });
  }

  function onScroll() {
    states.forEach(updateScene);
  }

  function render() {
    states.forEach(state => {
      state.displayedTime += (state.targetTime - state.displayedTime) * 0.12;
      if (state.duration && Math.abs(state.video.currentTime - state.displayedTime) > 0.016) {
        state.video.currentTime = state.displayedTime;
      }
    });
    requestAnimationFrame(render);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
  render();
});
