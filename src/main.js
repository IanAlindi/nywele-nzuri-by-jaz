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
   Preloader
---------------------------------------------------------------- */
function initPreloader(done) {
  const pre = $(".preloader");
  if (!pre) { done(); return; }
  const bar = $(".preloader__bar > span", pre);
  const pct = $(".preloader__pct", pre);
  const obj = { v: 0 };
  gsap.to(obj, {
    v: 100,
    duration: reduceMotion ? 0.2 : 1.5,
    ease: "power2.inOut",
    onUpdate() {
      const v = Math.round(obj.v);
      if (bar) bar.style.width = v + "%";
      if (pct) pct.textContent = String(v).padStart(2, "0") + "%";
    },
    onComplete() {
      gsap.to(pre, {
        yPercent: -100,
        duration: reduceMotion ? 0 : 0.9,
        ease: "power4.inOut",
        onComplete() { pre.remove(); done(); },
      });
    },
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
    if (e.target.closest(hoverables)) ring.classList.add("is-hover");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(hoverables)) ring.classList.remove("is-hover");
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
    start: "top 86%",
    onEnter: (els) =>
      gsap.to(els, { opacity: 1, y: 0, duration: 0.95, ease: "power3.out", stagger: 0.12, overwrite: true }),
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
  // parallax
  $$("[data-parallax]").forEach((el) => {
    const amt = parseFloat(el.dataset.parallax) || 12;
    gsap.to(el, {
      yPercent: amt,
      ease: "none",
      scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
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
  if (!visuals.length || !chapters.length) return;

  const setActive = (i) => {
    visuals.forEach((v, k) => v.classList.toggle("is-active", k === i));
    chapters.forEach((c, k) => c.classList.toggle("opacity-100", k === i) || c.classList.toggle("opacity-30", k !== i));
  };
  setActive(0);

  if (reduceMotion) { visuals[0].classList.add("is-active"); return; }

  // pin the visual column while chapters scroll
  const mm = gsap.matchMedia();
  mm.add("(min-width: 768px)", () => {
    ScrollTrigger.create({
      trigger: story,
      start: "top top",
      end: "bottom bottom",
      pin: ".story__visual-wrap",
      pinSpacing: false,
    });
    chapters.forEach((ch, i) => {
      ScrollTrigger.create({
        trigger: ch,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => { if (self.isActive) setActive(i); },
      });
    });
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
    if (note) { note.hidden = false; note.textContent = "Thank you, " + g("name") + "! Opening WhatsApp to confirm…"; }
    window.open("https://wa.me/254705186262?text=" + text, "_blank", "noopener");
    form.reset();
  });
}

/* ----------------------------------------------------------------
   Boot
---------------------------------------------------------------- */
function boot() {
  initLenis();
  initCursor();
  initHeader();
  initReveals();
  initHeroParallax();
  initMarquee();
  initStory();
  initCounters();
  initForm();
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
  ScrollTrigger.refresh();
}

window.addEventListener("DOMContentLoaded", () => {
  initPreloader(() => { boot(); initIntro(); });
});
window.addEventListener("load", () => ScrollTrigger.refresh());
