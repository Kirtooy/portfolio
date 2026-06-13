/* ============================================================
   KIRT CORPUZ — Abyssal Liquid Glass · Vol.02
   Reveals · nav state · specular tracking · pointer tilt
   ============================================================ */

(() => {
  "use strict";

  const fine = window.matchMedia("(pointer: fine)").matches;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Staggered scroll reveals ---------- */
  const reveals = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Nav: darken glass once scrolled ---------- */
  const nav = document.querySelector(".nav");
  let ticking = false;

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        nav.classList.toggle("is-scrolled", window.scrollY > 40);
        ticking = false;
      });
    },
    { passive: true }
  );

  /* ---------- Nav: highlight the section in view ---------- */
  const navLinks = document.querySelectorAll(".nav__links a[data-link]");

  if ("IntersectionObserver" in window && navLinks.length) {
    const sectionIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          navLinks.forEach((a) =>
            a.classList.toggle("is-active", a.dataset.link === entry.target.id)
          );
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    navLinks.forEach((a) => {
      const section = document.getElementById(a.dataset.link);
      if (section) sectionIO.observe(section);
    });
  }

  /* ---------- Specular highlight follows the cursor ---------- */
  if (fine && !calm) {
    document.querySelectorAll(".glass").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      });
      el.addEventListener("pointerleave", () => {
        el.style.removeProperty("--mx");
        el.style.removeProperty("--my");
      });
    });
  }

  /* ---------- Copy email to clipboard + toast ---------- */
  const toast = document.createElement("div");
  toast.className = "toast glass mono";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.appendChild(toast);

  let toastTimer;
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  };

  const copyText = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    /* fallback for non-secure contexts (e.g. opening the file directly) */
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok ? Promise.resolve() : Promise.reject();
  };

  document.querySelectorAll("[data-copy-email]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      copyText(el.dataset.copyEmail)
        .then(() => showToast("Email address copied to clipboard"))
        .catch(() => showToast("Couldn’t copy — " + el.dataset.copyEmail));
    });
  });

  /* ---------- Liquid 3D tilt on glass cards ---------- */
  const MAX_TILT = 5; /* degrees */

  if (fine && !calm) {
    document.querySelectorAll(".tilt").forEach((el) => {
      el.addEventListener("pointerenter", () => {
        el.classList.add("is-tilting");
      });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", `${(px * MAX_TILT * 2).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-py * MAX_TILT * 2).toFixed(2)}deg`);
      });
      el.addEventListener("pointerleave", () => {
        /* drop the fast-tracking transition so the reset below
           glides back with the springy .tilt transition */
        el.classList.remove("is-tilting");
        el.style.removeProperty("--rx");
        el.style.removeProperty("--ry");
      });
    });
  }

  /* ---------- Project gallery lightbox ---------- */
  const GALLERIES = {
    agriprofile: {
      title: "AgriProfile System",
      images: [
        "assets/agriprofile/Screenshot 2026-06-11 183626.png",
        "assets/agriprofile/Screenshot 2026-06-11 183641.png",
        "assets/agriprofile/Screenshot 2026-06-11 183655.png",
        "assets/agriprofile/Screenshot 2026-06-11 183720.png",
      ],
    },
    hardwhere: {
      title: "HardWhere Startup",
      images: [
        "assets/hardwhere/hardwhere.onrender.com_.png",
        "assets/hardwhere/hardwhere.onrender.com_about_.png",
        "assets/hardwhere/hardwhere.onrender.com_services_.png",
        "assets/hardwhere/hardwhere.onrender.com_contact_.png",
      ],
    },
    sprig: {
      title: "Sprig Mobile Application",
      images: [
        "assets/sprig/Screenshot_20260611-183816.png",
        "assets/sprig/Screenshot_20260611-183823.png",
        "assets/sprig/Screenshot_20260611-183845.png",
      ],
    },
  };

  const lightbox = document.getElementById("lightbox");

  if (lightbox) {
    const lbImg = lightbox.querySelector(".lightbox__img");
    const lbTitle = lightbox.querySelector(".lightbox__title");
    const lbCount = lightbox.querySelector(".lightbox__count");
    const lbDots = lightbox.querySelector(".lightbox__dots");
    const lbClose = lightbox.querySelector(".lightbox__close");

    let gallery = null;
    let index = 0;
    let lastFocus = null;
    let hideTimer;

    const pad = (n) => String(n).padStart(2, "0");

    const show = (i) => {
      index = (i + gallery.images.length) % gallery.images.length;
      lbImg.classList.remove("is-loaded");
      lbImg.src = encodeURI(gallery.images[index]);
      lbImg.alt =
        gallery.images.length > 1
          ? `${gallery.title} — image ${index + 1} of ${gallery.images.length}`
          : gallery.title;
      lbCount.textContent = `${pad(index + 1)} / ${pad(gallery.images.length)}`;
      lbDots.querySelectorAll(".lightbox__dot").forEach((dot, d) => {
        dot.classList.toggle("is-active", d === index);
        dot.setAttribute("aria-selected", d === index ? "true" : "false");
      });
    };

    lbImg.addEventListener("load", () => lbImg.classList.add("is-loaded"));

    const open = (g) => {
      gallery = g;
      lastFocus = document.activeElement;
      lbTitle.textContent = gallery.title;
      /* hide arrows / dots / count for single-image views (e.g. certificates) */
      lightbox.classList.toggle("is-single", gallery.images.length < 2);

      lbDots.innerHTML = "";
      gallery.images.forEach((_, d) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "lightbox__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Image ${d + 1}`);
        dot.addEventListener("click", () => show(d));
        lbDots.appendChild(dot);
      });

      show(0);
      clearTimeout(hideTimer);
      lightbox.hidden = false;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => lightbox.classList.add("is-open"))
      );
      document.body.style.overflow = "hidden";
      lbClose.focus();
    };

    const close = () => {
      lightbox.classList.remove("is-open");
      hideTimer = setTimeout(() => { lightbox.hidden = true; }, calm ? 0 : 360);
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };

    lightbox.querySelectorAll("[data-lightbox-close]").forEach((el) =>
      el.addEventListener("click", close)
    );
    lightbox.querySelector("[data-lightbox-prev]")
      .addEventListener("click", () => show(index - 1));
    lightbox.querySelector("[data-lightbox-next]")
      .addEventListener("click", () => show(index + 1));

    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(index - 1);
      else if (e.key === "ArrowRight") show(index + 1);
    });

    /* swipe between images on touch */
    const stage = lightbox.querySelector(".lightbox__stage");
    let swipeX = null;
    stage.addEventListener("pointerdown", (e) => { swipeX = e.clientX; });
    stage.addEventListener("pointerup", (e) => {
      if (swipeX === null) return;
      const dx = e.clientX - swipeX;
      swipeX = null;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    });

    document.querySelectorAll(".card").forEach((card) => {
      const key = card.dataset.gallery;
      const activate = () => {
        if (key && GALLERIES[key]) open(GALLERIES[key]);
        else showToast("Gallery coming soon for this project");
      };
      card.addEventListener("click", activate);
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
    });

    /* ---------- Certificate previews (single-image lightbox) ---------- */
    document.querySelectorAll(".cert").forEach((cert) => {
      const src = cert.dataset.cert;
      const title =
        cert.querySelector(".cert__title")?.textContent.trim() || "Certificate";
      const activate = (e) => {
        /* let the VERIFY link do its own thing */
        if (e && e.target.closest(".cert__verify")) return;
        if (src) open({ title, images: [src] });
        else showToast("Certificate image coming soon");
      };
      cert.addEventListener("click", activate);
      cert.setAttribute("tabindex", "0");
      cert.setAttribute("role", "button");
      cert.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate(e);
        }
      });
    });
  }
})();
