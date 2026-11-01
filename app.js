(() => {
  "use strict";

  document.documentElement.classList.remove("no-js");

  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0.5, y: 0.5 };
  const targetPointer = { x: 0.5, y: 0.5 };

  const setPointer = (event) => {
    targetPointer.x = event.clientX / Math.max(window.innerWidth, 1);
    targetPointer.y = event.clientY / Math.max(window.innerHeight, 1);
  };

  let pointerFrame = 0;
  const animatePointer = () => {
    pointer.x += (targetPointer.x - pointer.x) * 0.1;
    pointer.y += (targetPointer.y - pointer.y) * 0.1;
    root.style.setProperty("--pointer-x", pointer.x.toFixed(4));
    root.style.setProperty("--pointer-y", pointer.y.toFixed(4));
    if (
      Math.abs(targetPointer.x - pointer.x) > 0.001 ||
      Math.abs(targetPointer.y - pointer.y) > 0.001
    ) {
      pointerFrame = requestAnimationFrame(animatePointer);
    } else {
      pointerFrame = 0;
    }
  };

  const requestPointerFrame = () => {
    if (!pointerFrame) pointerFrame = requestAnimationFrame(animatePointer);
  };

  window.addEventListener("pointermove", setPointer, { passive: true });
  window.addEventListener("pointerdown", setPointer, { passive: true });

  let scrollFrame = 0;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        root.style.setProperty("--scroll-y", Math.min(window.scrollY, 1200).toString());
        scrollFrame = 0;
      });
    },
    { passive: true }
  );

  const canvas = document.querySelector("#cloudDust");
  const context = canvas && canvas.getContext("2d");
  let dust = [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let dustFrame = 0;

  const createDust = () => {
    const count = width < 620 ? 18 : 34;
    dust = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.7 + Math.random() * 1.7,
      speedX: -0.09 + Math.random() * 0.18,
      speedY: -0.12 + Math.random() * 0.10,
      alpha: 0.18 + Math.random() * 0.38,
      phase: Math.random() * Math.PI * 2,
      pace: 0.004 + Math.random() * 0.008,
      depth: 0.35 + Math.random() * 0.85,
      index
    }));
  };

  const resizeCanvas = () => {
    if (!canvas || !context) return;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    createDust();
  };

  const drawDust = () => {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    const pointerX = pointer.x * width;
    const pointerY = pointer.y * height;

    for (const mote of dust) {
      mote.phase += mote.pace;
      mote.x += mote.speedX + Math.sin(mote.phase) * 0.045;
      mote.y += mote.speedY + Math.cos(mote.phase * 0.7) * 0.025;

      const dx = pointerX - mote.x;
      const dy = pointerY - mote.y;
      const distance = Math.hypot(dx, dy);
      const influence = Math.max(0, 1 - distance / 240) * mote.depth;
      mote.x -= dx * influence * 0.0007;
      mote.y -= dy * influence * 0.0007;

      if (mote.x < -15) mote.x = width + 15;
      if (mote.x > width + 15) mote.x = -15;
      if (mote.y < -15) mote.y = height + 15;
      if (mote.y > height + 15) mote.y = -15;

      const glow = context.createRadialGradient(
        mote.x,
        mote.y,
        0,
        mote.x,
        mote.y,
        mote.radius * (5 + influence * 5)
      );
      glow.addColorStop(0, `rgba(255,255,255,${mote.alpha})`);
      glow.addColorStop(0.3, `rgba(240,250,251,${mote.alpha * 0.5})`);
      glow.addColorStop(1, "rgba(240,250,251,0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(mote.x, mote.y, mote.radius * (5 + influence * 5), 0, Math.PI * 2);
      context.fill();
    }

    if (!reducedMotion.matches) dustFrame = requestAnimationFrame(drawDust);
  };

  if (canvas && context) {
    resizeCanvas();
    drawDust();
    window.addEventListener(
      "resize",
      () => {
        cancelAnimationFrame(dustFrame);
        resizeCanvas();
        if (reducedMotion.matches) drawDust();
        else dustFrame = requestAnimationFrame(drawDust);
      },
      { passive: true }
    );
  }

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
    );
    reveals.forEach((item) => observer.observe(item));
  } else {
    reveals.forEach((item) => item.classList.add("is-visible"));
  }

  const dialog = document.querySelector("#videoDialog");
  const video = document.querySelector("#guideVideo");
  const videoTitle = document.querySelector("#videoTitle");
  const dialogClose = document.querySelector("#dialogClose");
  let dialogTrigger = null;

  const stopVideo = () => {
    if (!video) return;
    video.pause();
    video.removeAttribute("src");
    video.load();
  };

  document.querySelectorAll("[data-video-src]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      if (!dialog || !video || !videoTitle) return;
      dialogTrigger = trigger;
      videoTitle.textContent = trigger.dataset.videoTitle || "视频教程";
      video.src = trigger.dataset.videoSrc;
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      video.play().catch(() => {});
    });
  });

  if (dialog) {
    dialog.addEventListener("close", () => {
      stopVideo();
      dialogTrigger?.focus();
      dialogTrigger = null;
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  if (dialogClose) {
    dialogClose.addEventListener("click", () => dialog?.close());
  }

  const toast = document.querySelector("#toast");
  let toastTimer = 0;
  const showToast = (message) => {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const tempInput = document.createElement("textarea");
    tempInput.value = text;
    tempInput.setAttribute("readonly", "");
    tempInput.style.position = "fixed";
    tempInput.style.opacity = "0";
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    tempInput.remove();
  };

  document.querySelector("#shareButton")?.addEventListener("click", async () => {
    try {
      await copyText(window.location.href);
      showToast("网址已复制");
    } catch {
      showToast("复制失败，请手动复制地址");
    }
  });

  if (!reducedMotion.matches) requestPointerFrame();

  reducedMotion.addEventListener?.("change", () => {
    cancelAnimationFrame(dustFrame);
    if (reducedMotion.matches) {
      drawDust();
    } else {
      dustFrame = requestAnimationFrame(drawDust);
    }
  });
})();
