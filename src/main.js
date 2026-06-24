import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
document.documentElement.classList.remove("no-js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ----------------------------------------------------------------
   Smooth scroll (Lenis) + GSAP sync
---------------------------------------------------------------- */
let lenis;
function initLenis() {
  if (reduceMotion) return;
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // anchor links -> smooth
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length > 1 && $(id)) {
        e.preventDefault();
        lenis.scrollTo(id, { offset: -80 });
      }
    });
  });
}

/* ----------------------------------------------------------------
   Cinematic page transitions (curtain)
---------------------------------------------------------------- */
function revealCurtain() {
  // Mark JS ready (cancels the CSS fallback reveal) and animate the entrance reveal.
  document.documentElement.classList.add("js-ready");
  const curtain = $(".curtain");
  if (!curtain) return;
  const mark = $(".curtain__mark", curtain);
  if (reduceMotion) { gsap.set(curtain, { yPercent: -100 }); return; }
  const tl = gsap.timeline();
  tl.to(mark, { opacity: 0, duration: 0.35, ease: "power2.out" }, 0.15)
    .to(curtain, { yPercent: -100, duration: 0.8, ease: "power4.inOut" }, 0.2)
    .set(curtain, { yPercent: 100 }); // park below for any future use
}

function initTransitions() {
  const curtain = $(".curtain");
  if (!curtain || reduceMotion) return;
  const internal = (a) => {
    const href = a.getAttribute("href") || "";
    if (a.target === "_blank" || a.hasAttribute("download")) return false;
    if (/^(#|tel:|mailto:|https?:|wa\.me)/i.test(href) && !href.startsWith(location.origin)) {
      // allow same-origin absolute, block external/protocol links
      if (!href.startsWith("/") && !href.endsWith(".html") && href !== "/") return false;
    }
    return href.endsWith(".html") || href === "/" || href.startsWith("/");
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    const isExternal = /^(tel:|mailto:|https?:\/\/|wa\.me)/i.test(href) && !href.startsWith(location.origin + "/");
    const isHash = href.startsWith("#");
    if (!href || isHash || isExternal || a.target === "_blank") return;
    if (!(href.endsWith(".html") || href === "/" || href === "index.html" || href.startsWith("/"))) return;
    e.preventDefault();
    const mark = $(".curtain__mark", curtain);
    const tl = gsap.timeline({ onComplete: () => { window.location.href = href; } });
    tl.set(curtain, { yPercent: 100 })
      .to(curtain, { yPercent: 0, duration: 0.55, ease: "power4.inOut" })
      .to(mark, { opacity: 0.85, duration: 0.3 }, "-=0.25");
  });
}

/* ----------------------------------------------------------------
   Custom cursor
---------------------------------------------------------------- */
function initCursor() {
  if (window.matchMedia("(hover: none)").matches || reduceMotion) return;
  const dot = document.createElement("div");
  const ring = document.createElement("div");
  dot.className = "cursor-dot";
  ring.className = "cursor-ring";
  ring.innerHTML = '<span class="cursor__label"></span>';
  const label = ring.querySelector(".cursor__label");
  document.body.append(dot, ring);
  let rx = 0, ry = 0, x = 0, y = 0;
  window.addEventListener("mousemove", (e) => {
    x = e.clientX; y = e.clientY;
    gsap.set(dot, { x, y });
  });
  gsap.ticker.add(() => {
    rx += (x - rx) * 0.15; ry += (y - ry) * 0.15;
    gsap.set(ring, { x: rx, y: ry });
  });
  const hoverables = "a, button, .card-service, .gallery-item, input, select, textarea";
  document.addEventListener("mouseover", (e) => {
    const cv = e.target.closest("[data-cursor]");
    if (cv) { ring.classList.add("is-view"); label.textContent = cv.getAttribute("data-cursor") || "View"; return; }
    if (e.target.closest(hoverables)) ring.classList.add("is-hover");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("[data-cursor]")) { ring.classList.remove("is-view"); label.textContent = ""; }
    if (e.target.closest(hoverables)) ring.classList.remove("is-hover");
  });
}

/* ----------------------------------------------------------------
   Magnetic buttons (subtle luxury microinteraction)
---------------------------------------------------------------- */
function initMagnetic() {
  if (window.matchMedia("(hover: none)").matches || reduceMotion) return;
  $$(".btn, .fab").forEach((el) => {
    const strength = el.classList.contains("fab") ? 0.3 : 0.38;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: mx * strength, y: my * strength, duration: 0.4, ease: "power3.out" });
    });
    el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" }));
  });
}

/* ----------------------------------------------------------------
   Signature horizontal Lookbook (desktop pin / mobile swipe-snap)
---------------------------------------------------------------- */
function initLookbook() {
  const sec = document.getElementById("lookbook");
  if (!sec) return;
  const track = sec.querySelector(".lookbook__track");
  const vp = sec.querySelector(".lookbook__viewport");
  if (!track || !vp) return;

  // Force-load the cards as the section approaches — lazy-loading is unreliable
  // for horizontally translated (transformed) content, so kick the fetch manually.
  const imgs = [...track.querySelectorAll("img")];
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      imgs.forEach((im) => { im.loading = "eager"; const s = im.getAttribute("src"); if (s) im.setAttribute("src", s); });
      io.disconnect();
    }
  }, { rootMargin: "700px 0px" });
  io.observe(sec);

  if (reduceMotion) return; // mobile + reduced-motion keep native horizontal swipe
  const mm = gsap.matchMedia();
  mm.add("(min-width: 768px)", () => {
    vp.style.overflow = "hidden";
    const dist = () => Math.max(0, track.scrollWidth - vp.clientWidth);
    const tween = gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: sec,
        start: "top top",
        end: () => "+=" + dist(),
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    return () => { tween.kill(); vp.style.overflow = ""; };
  });
}

/* ----------------------------------------------------------------
   Header + mobile nav
---------------------------------------------------------------- */
function initHeader() {
  const header = $("#header");
  const toggle = $("#navToggle");
  const nav = $("#nav");
  const close = $("#navClose");
  const openNav = () => { nav?.classList.add("is-open"); document.body.classList.add("nav-open"); };
  const closeNav = () => { nav?.classList.remove("is-open"); document.body.classList.remove("nav-open"); };
  toggle?.addEventListener("click", openNav);
  close?.addEventListener("click", closeNav);
  $$("a", nav).forEach((a) => a.addEventListener("click", closeNav));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });
  if (header) {
    ScrollTrigger.create({
      start: "top -8",
      onUpdate: (self) => header.classList.toggle("is-stuck", self.scroll() > 8),
      onToggle: (self) => header.classList.toggle("is-stuck", self.isActive || self.scroll() > 8),
    });
    window.addEventListener("scroll", () => header.classList.toggle("is-stuck", window.scrollY > 8), { passive: true });
  }
}

/* ----------------------------------------------------------------
   Intro: hero line reveals + clip images
---------------------------------------------------------------- */
function initIntro() {
  if (reduceMotion) return;
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  const heroLines = $$(".hero .line-mask > *");
  if (heroLines.length) {
    tl.to(heroLines, { yPercent: 0, duration: 1.1, stagger: 0.12 }, 0.1);
  }
  $$(".hero [data-fade]").forEach((el, i) => {
    tl.from(el, { y: 30, opacity: 0, duration: 0.9 }, 0.5 + i * 0.12);
  });
}

/* ----------------------------------------------------------------
   Scroll reveals (generic)
---------------------------------------------------------------- */
function initReveals() {
  if (reduceMotion) { $$(".reveal").forEach((e) => e.classList.add("is-in")); return; }
  ScrollTrigger.batch(".reveal", {
    start: "top 88%",
    onEnter: (els) =>
      gsap.to(els, { opacity: 1, y: 0, duration: 0.85, ease: "power4.out", stagger: 0.09, overwrite: true }),
  });
  // clip image reveals
  $$(".clip-img").forEach((img) => {
    gsap.to(img, {
      clipPath: "inset(0 0 0% 0)",
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: { trigger: img, start: "top 85%" },
    });
  });
  // line masks (non-hero)
  $$(".line-mask:not(.hero .line-mask) > *").forEach((el) => {
    gsap.to(el, {
      yPercent: 0,
      duration: 1,
      ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 90%" },
    });
  });
  // parallax (skip on small screens for smoother mobile scrolling)
  if (window.innerWidth >= 768) {
    $$("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 12;
      gsap.to(el, {
        yPercent: amt,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }
}

/* ----------------------------------------------------------------
   Hero background parallax
---------------------------------------------------------------- */
function initHeroParallax() {
  const bg = $(".hero__bg");
  if (!bg || reduceMotion) return;
  gsap.to(bg, {
    yPercent: 18,
    scale: 1.12,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
}

/* ----------------------------------------------------------------
   Marquee
---------------------------------------------------------------- */
function initMarquee() {
  const track = $(".marquee__track");
  if (!track || reduceMotion) return;
  // duplicate content for seamless loop
  track.innerHTML += track.innerHTML;
  const total = track.scrollWidth / 2;
  gsap.to(track, { x: -total, duration: 28, ease: "none", repeat: -1 });
}

/* ----------------------------------------------------------------
   Pinned scrollytelling story
---------------------------------------------------------------- */
function initStory() {
  const story = $("#story");
  if (!story) return;
  const visuals = $$(".story__visual img", story);
  const chapters = $$(".story__chapter", story);
  const dots = $$(".story__dot", story);
  if (!visuals.length || !chapters.length) return;

  const setActive = (i) => {
    visuals.forEach((v, k) => v.classList.toggle("is-active", k === i));
    chapters.forEach((c, k) => {
      c.classList.toggle("opacity-100", k === i);
      c.classList.toggle("opacity-40", k !== i);
    });
    dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
  };
  setActive(0);

  if (reduceMotion) { visuals[0].classList.add("is-active"); return; }

  // Chapter crossfade — runs on ALL viewports (mobile uses CSS sticky visual)
  chapters.forEach((ch, i) => {
    ScrollTrigger.create({
      trigger: ch,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => { if (self.isActive) setActive(i); },
    });
  });

  // Pin the visual column only on desktop (mobile relies on position: sticky)
  const mm = gsap.matchMedia();
  mm.add("(min-width: 768px)", () => {
    const pin = ScrollTrigger.create({
      trigger: story,
      start: "top top",
      end: "bottom bottom",
      pin: ".story__visual-wrap",
      pinSpacing: false,
    });
    return () => pin.kill();
  });
}

/* ----------------------------------------------------------------
   Counters
---------------------------------------------------------------- */
function initCounters() {
  $$("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () =>
        gsap.to(obj, {
          v: target,
          duration: 1.8,
          ease: "power2.out",
          onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; },
        }),
    });
  });
}

/* ----------------------------------------------------------------
   Interactive locations panel (selectable pins + live open status)
---------------------------------------------------------------- */
function initLocations() {
  const panel = document.getElementById("locPanel");
  if (!panel) return;
  const data = [
    { name: "The Junction Mall", addr: "4th Floor · Ngong Road, Nairobi", tel: "+254705186262", disp: "0705 186262", map: "https://www.google.com/maps/search/Nywele+Nzuri+Junction+Mall+Nairobi" },
    { name: "Lana Plaza", addr: "1st Floor · Oloitoktok Road, Nairobi", tel: "+254713477122", disp: "0713 477122", map: "https://www.google.com/maps/search/Lana+Plaza+Oloitoktok+Road+Nairobi" },
  ];
  const pins = [...panel.querySelectorAll(".loc-pin")];
  const tabs = [...panel.querySelectorAll(".loc-tab")];
  const fade = panel.querySelector(".loc-fade");
  const nameEl = panel.querySelector("#locName");
  const addrEl = panel.querySelector("#locAddr");
  const phoneEl = panel.querySelector("#locPhone");
  const mapEl = panel.querySelector("#locMap");
  let current = 0;

  function select(i) {
    if (i === current) return;
    current = i;
    pins.forEach((p, k) => { p.classList.toggle("is-active", k === i); p.setAttribute("aria-pressed", String(k === i)); });
    tabs.forEach((t, k) => { t.classList.toggle("is-active", k === i); t.setAttribute("aria-pressed", String(k === i)); });
    const d = data[i];
    if (fade) fade.style.opacity = "0";
    setTimeout(() => {
      nameEl.textContent = d.name;
      addrEl.textContent = d.addr;
      phoneEl.textContent = d.disp;
      phoneEl.href = "tel:" + d.tel;
      mapEl.href = d.map;
      if (fade) fade.style.opacity = "1";
    }, 180);
  }
  pins.forEach((p, i) => p.addEventListener("click", () => select(i)));
  tabs.forEach((t, i) => t.addEventListener("click", () => select(i)));
}

/* ----------------------------------------------------------------
   Shared "Open now · Nairobi time" status (panel, footer, locations)
---------------------------------------------------------------- */
function computeOpen() {
  try {
    const now = new Date();
    const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
    const wd = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Nairobi", weekday: "short" }).format(now);
    const hour = parseInt(time.split(":")[0], 10);
    return { ok: true, open: wd !== "Sun" && hour >= 8 && hour < 19, time };
  } catch (e) { return { ok: false }; }
}
function initOpenStatus() {
  const els = $$(".open-status");
  if (!els.length) return;
  function tick() {
    const s = computeOpen();
    els.forEach((el) => {
      const txt = el.querySelector(".open-status__text") || el;
      if (!s.ok) { txt.textContent = "Mon – Sat · 8AM – 7PM"; return; }
      el.classList.toggle("is-open", s.open);
      txt.textContent = (s.open ? "Open now" : "Closed") + " · Nairobi " + s.time;
    });
  }
  tick();
  setInterval(tick, 30000);
}

/* ----------------------------------------------------------------
   Gallery lightbox
---------------------------------------------------------------- */
function initLightbox() {
  const items = $$(".gallery-item img");
  if (!items.length) return;
  const srcs = items.map((im) => im.getAttribute("src"));
  let idx = 0;
  const box = document.createElement("div");
  box.className = "lightbox";
  box.innerHTML =
    '<button class="lightbox__btn lightbox__close" aria-label="Close">&times;</button>' +
    '<button class="lightbox__btn lightbox__nav prev" aria-label="Previous">&#8249;</button>' +
    '<img class="lightbox__img" alt="Gallery image" />' +
    '<button class="lightbox__btn lightbox__nav next" aria-label="Next">&#8250;</button>' +
    '<div class="lightbox__count"></div>';
  document.body.appendChild(box);
  const imgEl = box.querySelector(".lightbox__img");
  const countEl = box.querySelector(".lightbox__count");
  const show = (i) => {
    idx = (i + srcs.length) % srcs.length;
    imgEl.style.opacity = "0";
    const u = srcs[idx];
    const pre = new Image();
    pre.onload = () => { imgEl.src = u; imgEl.style.opacity = "1"; };
    pre.src = u;
    countEl.textContent = (idx + 1) + " / " + srcs.length;
  };
  const open = (i) => { show(i); box.classList.add("is-open"); document.body.classList.add("nav-open"); if (lenis) lenis.stop(); };
  const close = () => { box.classList.remove("is-open"); document.body.classList.remove("nav-open"); if (lenis) lenis.start(); };
  items.forEach((im, i) => { im.parentElement.style.cursor = "pointer"; im.parentElement.addEventListener("click", () => open(i)); });
  box.querySelector(".lightbox__close").addEventListener("click", close);
  box.querySelector(".next").addEventListener("click", () => show(idx + 1));
  box.querySelector(".prev").addEventListener("click", () => show(idx - 1));
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  document.addEventListener("keydown", (e) => {
    if (!box.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") show(idx + 1);
    else if (e.key === "ArrowLeft") show(idx - 1);
  });
}

/* ----------------------------------------------------------------
   Products notify
---------------------------------------------------------------- */
function initNotify() {
  const form = document.getElementById("notifyForm");
  if (!form) return;
  const note = document.getElementById("notifyNote");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (note) { note.hidden = false; note.textContent = "Thank you! We'll let you know the moment our store opens."; }
    form.reset();
  });
}

/* ----------------------------------------------------------------
   Scroll progress bar
---------------------------------------------------------------- */
function initProgress() {
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  const update = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? (window.scrollY / h) * 100 : 0;
    bar.style.width = p + "%";
  };
  if (lenis) lenis.on("scroll", update);
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/* ----------------------------------------------------------------
   Booking form -> WhatsApp
---------------------------------------------------------------- */
function initForm() {
  const form = $("#bookingForm");
  if (!form) return;
  const note = $("#formNote");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const g = (n) => (form[n] ? form[n].value.trim() : "");
    let text =
      "Hello Nywele Nzuri by Jaz! I'd like to book an appointment.%0A%0A" +
      "Name: " + encodeURIComponent(g("name")) + "%0A" +
      "Phone: " + encodeURIComponent(g("phone")) + "%0A" +
      "Service: " + encodeURIComponent(g("service")) + "%0A" +
      "Location: " + encodeURIComponent(g("branch"));
    if (g("message")) text += "%0ANote: " + encodeURIComponent(g("message"));
    if (note) {
      note.hidden = false;
      note.classList.add("form-success");
      note.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2f6b34" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>Thank you, ' + g("name") + "! Opening WhatsApp to confirm your booking…</span>";
      gsap.fromTo(note, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
    }
    window.open("https://wa.me/254705186262?text=" + text, "_blank", "noopener");
    form.reset();
  });
}

/* ----------------------------------------------------------------
   Boot
---------------------------------------------------------------- */
function boot() {
  // film grain texture
  const grain = document.createElement("div");
  grain.className = "grain";
  document.body.appendChild(grain);

  initLenis();
  initCursor();
  initMagnetic();
  initHeader();
  initReveals();
  initHeroParallax();
  initMarquee();
  initStory();
  initLookbook();
  initLocations();
  initOpenStatus();
  initLightbox();
  initNotify();
  initTransitions();
  initCounters();
  initProgress();
  initForm();
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
  ScrollTrigger.refresh();
}

window.addEventListener("DOMContentLoaded", () => {
  revealCurtain();
  boot();
  initIntro();
});
window.addEventListener("load", () => ScrollTrigger.refresh());
