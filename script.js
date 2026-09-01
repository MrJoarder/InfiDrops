const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.nav-links');
const navBackdrop = document.getElementById('navBackdrop');
const menuIcon = menuButton?.querySelector('.menu-icon');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  const willOpen = !open;
  menuButton.setAttribute('aria-expanded', String(willOpen));
  menuButton.setAttribute('aria-label', willOpen ? 'Close navigation' : 'Open navigation');
  if (menuIcon) menuIcon.textContent = willOpen ? '✕' : '☰';
  nav.classList.toggle('is-open', willOpen);
  navBackdrop?.classList.toggle('is-open', willOpen);
});

// Close the mobile menu after a nav link is followed, so it doesn't stay
// open over the section the user just navigated to.
nav?.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' && menuButton?.getAttribute('aria-expanded') === 'true') {
    menuButton.click();
  }
});

// Tapping the dimmed backdrop closes the menu, same as a nav link would.
navBackdrop?.addEventListener('click', () => {
  if (menuButton?.getAttribute('aria-expanded') === 'true') menuButton.click();
});

document.getElementById('copyrightYear')?.replaceChildren(String(new Date().getFullYear()));

const slides = document.querySelectorAll('main > section');
const revealSlides = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-in-view');
  });
}, { threshold: 0.18 });

slides.forEach((slide) => revealSlides.observe(slide));

const siteFooter = document.getElementById('siteFooter');
if (siteFooter) revealSlides.observe(siteFooter);

/* ---------- Sticky header: shrinks and strengthens its glass once the page
   has scrolled past the announcement bar, per the "premium, not distracting
   sticky header" requirement. ---------- */
const siteHeader = document.getElementById('siteHeader');
if (siteHeader) {
  const updateHeaderScrollState = () => {
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  updateHeaderScrollState();
  window.addEventListener('scroll', updateHeaderScrollState, { passive: true });
}

/* ---------- Scrollspy: highlights the nav link for whichever section is
   currently centered in the viewport with a small active-state indicator. */
(() => {
  const navLinkMap = new Map();
  document.querySelectorAll('.nav-links a[href^="#"]:not(.nav-cta-mobile)').forEach((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section) navLinkMap.set(section, link);
  });
  if (!navLinkMap.size) return;

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const link = navLinkMap.get(entry.target);
      if (!link) return;
      document.querySelectorAll('.nav-links a.is-active').forEach((a) => a.classList.remove('is-active'));
      link.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  navLinkMap.forEach((_, section) => spy.observe(section));
})();

/* ---------- Premium hero: entrance choreography, graph draw, 3D parallax ---------- */
(() => {
  const hero = document.getElementById('heroSection');
  const heroArt = document.getElementById('heroArt');
  const dashboard = document.getElementById('dashboardCard');
  const chartLine = document.getElementById('chartLine');
  if (!hero || !heroArt) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Prep the graph line for a left-to-right draw animation.
  if (chartLine && !reduceMotion) {
    const length = chartLine.getTotalLength();
    chartLine.style.strokeDasharray = String(length);
    chartLine.style.strokeDashoffset = String(length);
  }

  // Kick off the staggered entrance once the page has settled, then enable
  // the continuous ambient floating loop.
  requestAnimationFrame(() => {
    hero.classList.add('is-ready');
    if (!reduceMotion) {
      window.setTimeout(() => hero.classList.add('hero-floating'), 1900);
    }
  });

  if (reduceMotion) return;

  // Layered mouse-follow parallax: the dashboard rotates toward the cursor
  // most strongly, marketplace cards drift at medium speed, and the
  // decorative grid/rings barely move — giving the scene a sense of depth.
  const depthEls = Array.from(heroArt.querySelectorAll('[data-depth]'));
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0, raf = null;

  const applyParallax = () => {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    depthEls.forEach((el) => {
      const depth = parseFloat(el.dataset.depth) || 0;
      const moveX = currentX * depth * 30;
      const moveY = currentY * depth * 30;
      if (el === dashboard) {
        const rotY = currentX * 7;
        const rotX = -currentY * 6;
        el.style.transform = `translate(${moveX}px, ${moveY}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
      } else if (el.classList.contains('os-card')) {
        const rotY = currentX * 4;
        el.style.transform = `translate(${moveX}px, ${moveY}px) rotateY(${rotY}deg)`;
      } else if (el.classList.contains('art-ring')) {
        // Rings keep their static rotateX tilt; parallax only nudges position.
        el.style.transform = `translate(${moveX}px, ${moveY}px) rotateX(58deg)`;
      } else {
        el.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    });

    raf = Math.abs(currentX - targetX) > 0.001 || Math.abs(currentY - targetY) > 0.001
      ? requestAnimationFrame(applyParallax)
      : null;
  };

  const queueParallax = () => { if (!raf) raf = requestAnimationFrame(applyParallax); };

  heroArt.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const rect = heroArt.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    queueParallax();
  });

  heroArt.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
    queueParallax();
  });

  // Mobile fallback: gentle gyroscope-driven parallax where supported.
  if (window.DeviceOrientationEvent && matchMedia('(pointer:coarse)').matches) {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma == null || e.beta == null) return;
      targetX = Math.max(-1, Math.min(1, e.gamma / 30));
      targetY = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      queueParallax();
    });
  }
})();

/* ---------- Contact form: client-side validation + mailto handoff ----------
   There's no backend on this static site, so a real submit would 404. We
   validate in the browser, then open the visitor's mail client pre-filled
   with their message — the button still does something useful. */
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
contactForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = contactForm.fullname.value.trim();
  const email = contactForm.email.value.trim();
  const message = contactForm.message.value.trim();
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Red borders appear only here, on a real failed submit attempt — never
  // while the visitor is still mid-typing (see the invalid:not(:placeholder-shown)
  // override in styles.css that keeps native validation quiet otherwise).
  contactForm.fullname.classList.toggle('has-error', !name);
  contactForm.email.classList.toggle('has-error', !emailLooksValid);
  contactForm.message.classList.toggle('has-error', !message);

  if (!name || !emailLooksValid || !message) {
    formStatus.textContent = 'Please fill in your name, a valid email and a short message.';
    formStatus.classList.add('is-error');
    formStatus.classList.remove('is-success');
    return;
  }

  formStatus.classList.remove('is-error');
  formStatus.classList.add('is-success');
  formStatus.textContent = "Thanks — we'll be in touch shortly.";

  const subject = encodeURIComponent(`Strategy call inquiry from ${name}`);
  const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
  window.location.href = `mailto:infidropsconsultingservices@gmail.com?subject=${subject}&body=${body}`;
  contactForm.reset();
});

// Clear a field's error state as soon as the visitor fixes it, rather than
// making them wait for another submit attempt.
contactForm?.addEventListener('input', (e) => {
  if (e.target.classList.contains('has-error')) e.target.classList.remove('has-error');
});

/* ---------- Contact section: extremely subtle mouse-follow glow ---------- */
(() => {
  const contactSection = document.getElementById('contact');
  const glow = document.getElementById('contactGlow');
  if (!contactSection || !glow) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let raf = null;
  contactSection.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || raf) return;
    raf = requestAnimationFrame(() => {
      const rect = contactSection.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      glow.style.setProperty('--mx', `${x}%`);
      glow.style.setProperty('--my', `${y}%`);
      raf = null;
    });
  });
})();

/* ---------- "How we work" left visual: Commerce Operating System ----------
   Mirrors the hero's outer/inner parallax split (outer element = JS target,
   inner = CSS keyframe owner) so the two transform sources never collide. */
(() => {
  const processSection = document.getElementById('process');
  const processVisual = document.getElementById('processVisual');
  const hub = document.getElementById('pvHub');
  if (!processSection || !processVisual) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    // Switch on the slow continuous floating loop once the entrance
    // stagger for this section has had time to finish.
    const floatObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        window.setTimeout(() => processSection.classList.add('pv-floating'), 1600);
        floatObserver.disconnect();
      });
    }, { threshold: 0.18 });
    floatObserver.observe(processSection);
  }

  if (reduceMotion) return;

  const depthEls = Array.from(processVisual.querySelectorAll('[data-depth]'));
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0, raf = null;

  const applyParallax = () => {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    depthEls.forEach((el) => {
      const depth = parseFloat(el.dataset.depth) || 0;
      const moveX = currentX * depth * 26;
      const moveY = currentY * depth * 26;
      if (el === hub) {
        const rotY = currentX * 5;
        const rotX = -currentY * 4;
        el.style.transform = `translate(-50%, -50%) translate(${moveX}px, ${moveY}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
      } else if (el.classList.contains('pv-node')) {
        el.style.transform = `translate(-50%, -50%) translate(${moveX}px, ${moveY}px)`;
      } else {
        el.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    });

    raf = Math.abs(currentX - targetX) > 0.001 || Math.abs(currentY - targetY) > 0.001
      ? requestAnimationFrame(applyParallax)
      : null;
  };

  const queueParallax = () => { if (!raf) raf = requestAnimationFrame(applyParallax); };

  processVisual.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const rect = processVisual.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    queueParallax();
  });

  processVisual.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
    queueParallax();
  });
})();

/* ---------- Showcase: Commerce Operations Command Center ----------
   Drives the two dashboard cards: cursor tilt + light reflection, the
   workflow's active-stage cycling, the marketplace tab switcher, and the
   performance graph's draw-in. All demo data — clearly labeled as such in
   the UI, never presented as a real business result. */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // CSS owns the resting asymmetric tilt; this only adds a small cursor-
  // tracked delta while actively hovering, then clears the inline style on
  // pointerleave so the CSS resting state (and its transition) takes back
  // over cleanly. The same pointermove also drives a soft light reflection
  // that follows the cursor across the card's glass surface.
  if (!reduceMotion) {
    const attachTilt = (card, baseRotY, baseRotX) => {
      if (!card) return;
      const glass = card.querySelector('.ops-glass');
      let raf = null;
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch' || raf) return;
        raf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          const rotY = baseRotY - px * 3;
          const rotX = baseRotX - py * 3;
          card.style.transform = `translateY(-6px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
          if (glass) {
            glass.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
            glass.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
          }
          raf = null;
        });
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    };

    attachTilt(document.getElementById('opsCard'), 1.6, 0.8);
    attachTilt(document.getElementById('perfCard'), -1.6, 0.8);
  }

  // Cycle the workflow's active stage continuously and subtly.
  const nodes = document.querySelectorAll('#opsWorkflow .ops-node');
  if (nodes.length) {
    let stage = 0;
    const setStage = (i) => nodes.forEach((n, idx) => n.classList.toggle('is-active', idx === i));
    setStage(0);
    if (!reduceMotion) {
      window.setInterval(() => {
        stage = (stage + 1) % nodes.length;
        setStage(stage);
      }, 1500);
    }
  }

  // Marketplace tabs: switch which (purely decorative) graph curve is shown.
  // There's no real per-platform performance data to report, so tabs only
  // change the illustrative curve and active state — never a claimed number.
  const tabs = document.querySelectorAll('.perf-tab');
  const activateMarket = (market) => {
    tabs.forEach((t) => {
      const isMatch = t.dataset.market === market;
      t.classList.toggle('is-active', isMatch);
      t.setAttribute('aria-selected', String(isMatch));
    });
    document.querySelectorAll('.perf-line').forEach((p) => p.classList.toggle('is-active', p.dataset.market === market));
  };
  tabs.forEach((tab) => {
    tab.addEventListener('mouseenter', () => activateMarket(tab.dataset.market));
    tab.addEventListener('focus', () => activateMarket(tab.dataset.market));
    tab.addEventListener('click', () => activateMarket(tab.dataset.market));
  });

  // Draw the performance graph's active line once the section is in view.
  const showcaseSection = document.getElementById('showcase');
  const activeLine = document.querySelector('.perf-line.is-active');
  if (showcaseSection && activeLine && !reduceMotion) {
    const length = activeLine.getTotalLength();
    activeLine.style.strokeDasharray = String(length);
    activeLine.style.strokeDashoffset = String(length);
    const drawObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        activeLine.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.3,.7,.2,1)';
        requestAnimationFrame(() => { activeLine.style.strokeDashoffset = '0'; });
        drawObserver.disconnect();
      });
    }, { threshold: 0.3 });
    drawObserver.observe(showcaseSection);
  }
})();

/* ---------- Showcase: gentle scroll parallax on the two card wrappers ----------
   Runs only while the section is near the viewport, and stays entirely on
   the wrapper elements — never touching the cards' own tilt transform. */
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const showcase = document.getElementById('showcase');
  const caseParallax = document.getElementById('caseParallax');
  const videoParallax = document.getElementById('videoParallax');
  const ambient = document.getElementById('showcaseAmbient');
  if (!showcase) return;

  let active = false;
  const io = new IntersectionObserver((entries) => {
    active = entries[0].isIntersecting;
  }, { rootMargin: '200px 0px' });
  io.observe(showcase);

  let raf = null;
  const update = () => {
    raf = null;
    // Wait for the shared reveal observer to add .is-in-view first, so the
    // entrance fade + upward slide plays out before parallax starts writing
    // its own inline transform over the same wrapper elements.
    if (!active || !showcase.classList.contains('is-in-view')) return;
    const rect = showcase.getBoundingClientRect();
    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    const offset = (progress - 0.5) * 46;
    if (caseParallax) caseParallax.style.transform = `translateY(${offset * 0.6}px)`;
    if (videoParallax) videoParallax.style.transform = `translateY(${offset * 0.35}px)`;
    if (ambient) ambient.style.transform = `translateY(${offset * 0.15}px)`;
  };

  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
})();

/* ---------- Sample Capabilities: subtle mouse-follow depth ----------
   A gentle, architectural parallax — the ambient glow drifts and the three
   pillars tilt at most ~2deg toward the cursor. Nothing here affects layout. */
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const resultsSection = document.getElementById('results');
  const ambient = document.getElementById('resultsAmbient');
  const pillars = document.querySelectorAll('#results .capability-pillar');
  if (!resultsSection) return;

  let raf = null;
  resultsSection.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || raf) return;
    raf = requestAnimationFrame(() => {
      const rect = resultsSection.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      if (ambient) ambient.style.transform = `translate(${px * 24}px, ${py * 24}px)`;
      pillars.forEach((pillar) => {
        pillar.style.transform = `rotateX(${-py * 2}deg) rotateY(${px * 2}deg)`;
      });
      raf = null;
    });
  });
  resultsSection.addEventListener('pointerleave', () => {
    if (ambient) ambient.style.transform = '';
    pillars.forEach((pillar) => { pillar.style.transform = ''; });
  });
})();

/* ---------- Values + Infidrops Standard: tilt, cursor glow, scroll parallax ----------
   Desktop (fine-pointer) only, per spec: mobile has no cursor, so it keeps
   only the CSS reveal/hover already wired up above. Tilt and scroll-parallax
   share one state+render step per item so they never fight over `transform`. */
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const setupGroup = (itemSelector, sectionSelector, maxTiltDeg, maxParallaxPx) => {
    const section = document.querySelector(sectionSelector);
    const items = Array.from(document.querySelectorAll(itemSelector));
    if (!section || !items.length) return;

    // `parallax` (scroll-driven) and `lift` (hover-driven, matches the
    // plain-CSS :hover{translateY(-3px)} fallback) both land on the same
    // translateY, so once JS starts writing inline transform on hover it
    // must include the lift itself — otherwise the inline style would
    // silently override and erase the CSS hover lift.
    const state = items.map(() => ({ parallax: 0, lift: 0, rx: 0, ry: 0 }));
    const render = (i) => {
      const s = state[i];
      items[i].style.transform = `translateY(${s.parallax + s.lift}px) rotateX(${s.rx}deg) rotateY(${s.ry}deg)`;
    };

    items.forEach((item, i) => {
      let moveRaf = null;
      item.addEventListener('pointermove', (e) => {
        if (moveRaf) return;
        moveRaf = requestAnimationFrame(() => {
          const rect = item.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          item.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
          item.style.setProperty('--my', `${(py + 0.5) * 100}%`);
          state[i].lift = -3;
          state[i].rx = -py * maxTiltDeg;
          state[i].ry = px * maxTiltDeg;
          render(i);
          moveRaf = null;
        });
      });
      item.addEventListener('pointerleave', () => {
        state[i].lift = 0;
        state[i].rx = 0;
        state[i].ry = 0;
        render(i);
      });
    });

    let scrollRaf = null;
    let sectionRevealed = false;
    const updateParallax = () => {
      scrollRaf = null;
      if (!sectionRevealed) {
        sectionRevealed = section.classList.contains('is-in-view');
        if (!sectionRevealed) return; // let the entrance reveal settle first
      }
      const rect = section.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const offset = (progress - 0.5) * maxParallaxPx * 2;
      items.forEach((item, i) => {
        state[i].parallax = offset * (0.5 + i * 0.15);
        render(i);
      });
    };
    window.addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(updateParallax); }, { passive: true });
  };

  setupGroup('.value-item', '#company', 1.4, 5);
  setupGroup('.benefit-item', '.partner-benefits', 1.4, 5);
})();
