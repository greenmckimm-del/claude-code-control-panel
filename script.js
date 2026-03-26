/* ============================================================
   The Control Panel — JS Infrastructure
   ============================================================ */

'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------------------------------------
   1. Scroll Animations (Intersection Observer)
   ---------------------------------------------------------- */
function initScrollAnimations() {
  const elements = document.querySelectorAll('[data-animate], .flow-steps, .agent-diagram, .file-tree');
  if (!elements.length) return;

  if (prefersReducedMotion) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach(el => observer.observe(el));
}

/* ----------------------------------------------------------
   2. Counter Animation
   ---------------------------------------------------------- */
function animateCounter(el, target, duration) {
  const startTime = performance.now();
  const isFloat = target % 1 !== 0;

  function easeOutQuad(t) {
    return t * (2 - t);
  }

  function tick(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuad(progress);
    const current = eased * target;

    el.textContent = isFloat
      ? current.toFixed(1)
      : Math.floor(current).toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = isFloat
        ? target.toFixed(1)
        : target.toLocaleString();
    }
  }

  requestAnimationFrame(tick);
}

/* ----------------------------------------------------------
   3. Init Counters
   ---------------------------------------------------------- */
function initCounters() {
  const statEls = document.querySelectorAll('.stat-value[data-count]');
  if (!statEls.length) return;

  if (prefersReducedMotion) {
    statEls.forEach(el => {
      el.textContent = el.dataset.count;
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseFloat(entry.target.dataset.count);
          animateCounter(entry.target, target, 1800);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statEls.forEach(el => {
    el.textContent = '0';
    observer.observe(el);
  });
}

/* ----------------------------------------------------------
   4. Typewriter
   ---------------------------------------------------------- */
function clearElement(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function typeWriter(lines, containerId, speed, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;

  clearElement(container);

  // Reduced motion: render everything instantly
  if (prefersReducedMotion) {
    lines.forEach(line => {
      const div = document.createElement('div');
      div.className = line.type === 'prompt' ? 'terminal-prompt' : 'terminal-response';
      div.textContent = line.text;
      container.appendChild(div);
    });
    if (typeof callback === 'function') callback();
    return;
  }

  let lineIndex = 0;
  let charIndex = 0;
  let currentEl = null;

  const cursor = document.createElement('span');
  cursor.className = 'terminal-cursor';

  function nextLine() {
    if (lineIndex >= lines.length) {
      if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
      if (typeof callback === 'function') callback();
      return;
    }

    const line = lines[lineIndex];
    currentEl = document.createElement('div');
    currentEl.className = line.type === 'prompt' ? 'terminal-prompt' : 'terminal-response';
    container.appendChild(currentEl);
    container.appendChild(cursor);
    charIndex = 0;
    typeChar();
  }

  function typeChar() {
    const line = lines[lineIndex];

    if (charIndex < line.text.length) {
      currentEl.textContent += line.text[charIndex];
      charIndex++;
      setTimeout(typeChar, speed);
    } else {
      lineIndex++;
      setTimeout(nextLine, 400);
    }
  }

  nextLine();
}

/* ----------------------------------------------------------
   5. Sticky Nav (show after 80% of hero height)
   ---------------------------------------------------------- */
function initStickyNav() {
  const nav = document.getElementById('sticky-nav');
  if (!nav) return;

  function getHeroHeight() {
    const hero =
      document.querySelector('[data-section="hero"]') ||
      document.querySelector('section:first-of-type');
    return hero ? hero.offsetHeight * 0.8 : 400;
  }

  // Cache threshold, update on resize
  let threshold = getHeroHeight();
  window.addEventListener('resize', () => { threshold = getHeroHeight(); }, { passive: true });

  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav-visible', window.scrollY > threshold);
  }, { passive: true });
}

/* ----------------------------------------------------------
   6. Nav Section Highlight
   ---------------------------------------------------------- */
function initNavHighlight() {
  const navLinks = document.querySelectorAll(
    '.nav-links a[href^="#"], .nav-panel a[href^="#"]'
  );
  if (!navLinks.length) return;

  const sectionIds = Array.from(navLinks)
    .map(a => a.getAttribute('href').slice(1))
    .filter(id => id && document.getElementById(id));

  const sections = sectionIds.map(id => document.getElementById(id));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        document.querySelectorAll('.nav-links a, .nav-panel a').forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, {
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  });

  sections.forEach(section => {
    if (section) observer.observe(section);
  });
}

/* ----------------------------------------------------------
   7. Mobile Nav
   ---------------------------------------------------------- */
function initMobileNav() {
  const hamburger = document.querySelector('.nav-hamburger');
  const panel = document.querySelector('.nav-panel');
  if (!hamburger || !panel) return;

  function openNav() {
    hamburger.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('panel-open');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    hamburger.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    panel.classList.remove('panel-open');
    document.body.style.overflow = '';
  }

  function toggleNav() {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    isOpen ? closeNav() : openNav();
  }

  hamburger.addEventListener('click', toggleNav);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
      closeNav();
      hamburger.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (
      hamburger.getAttribute('aria-expanded') === 'true' &&
      !panel.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      closeNav();
    }
  });

  panel.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeNav);
  });
}

/* ----------------------------------------------------------
   8. Smooth Scroll (with sticky nav offset)
   ---------------------------------------------------------- */
function initSmoothScroll() {
  const NAV_HEIGHT = 72;

  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const id = anchor.getAttribute('href').slice(1);
    if (!id) return;

    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();

    const targetTop = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;

    window.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  });
}

/* ----------------------------------------------------------
   9. Expandable Cards (Accordion)
   ---------------------------------------------------------- */
function initExpandableCards() {
  document.addEventListener('click', (e) => {
    const header = e.target.closest('.expandable-header');
    if (!header) return;

    const card = header.closest('.expandable-card');
    if (!card) return;

    const isOpen = card.classList.contains('open');

    const container = card.parentElement;
    if (container) {
      container.querySelectorAll('.expandable-card.open').forEach(sibling => {
        if (sibling !== card) {
          sibling.classList.remove('open');
          const siblingBtn = sibling.querySelector('.expandable-header');
          if (siblingBtn) siblingBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    card.classList.toggle('open', !isOpen);
    header.setAttribute('aria-expanded', String(!isOpen));
  });

  document.querySelectorAll('.expandable-header').forEach(btn => {
    const card = btn.closest('.expandable-card');
    const isOpen = card && card.classList.contains('open');
    btn.setAttribute('aria-expanded', String(!!isOpen));
  });
}

/* ----------------------------------------------------------
   10. Skill Categories (Accordion)
   ---------------------------------------------------------- */
function initSkillCategories() {
  document.querySelectorAll('.skill-category-header').forEach(btn => {
    const category = btn.closest('.skill-category');
    const isOpen = category && category.classList.contains('open');
    btn.setAttribute('aria-expanded', String(!!isOpen));

    btn.addEventListener('click', () => {
      const nowOpen = category.classList.contains('open');
      category.classList.toggle('open', !nowOpen);
      btn.setAttribute('aria-expanded', String(!nowOpen));
    });
  });
}

/* ----------------------------------------------------------
   11. Process Widget (Hero)
   ---------------------------------------------------------- */
function initProcessWidget() {
  const widget = document.getElementById('process-widget');
  if (!widget) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const promptText = 'fix the budget widget and run tests';

  const steps = [
    {
      id: 'pw-s1',
      label: 'Reading context (CLAUDE.md + BACKLOG.md)',
      agents: null,
      success: false,
    },
    {
      id: 'pw-s2',
      label: 'Skill selected: test-driven-development',
      agents: null,
      success: false,
    },
    {
      id: 'pw-s3',
      label: 'Dispatching 3 agents in parallel',
      agents: [
        { icon: '🔍', name: 'Explorer', result: '8 files found' },
        { icon: '🔨', name: 'Fix Agent', result: '3 issues patched' },
        { icon: '✅', name: 'Tests', result: '42 / 42 passing' },
      ],
      success: false,
    },
    {
      id: 'pw-s4',
      label: 'Committed & deployed to Vercel ✦',
      agents: null,
      success: true,
    },
  ];

  function createStepEl(step) {
    const div = document.createElement('div');
    div.className = 'pw-step';
    div.id = step.id;

    const statusSpan = document.createElement('span');
    statusSpan.className = 'pw-step-status';
    div.appendChild(statusSpan);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'pw-step-content';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'pw-step-label';
    labelDiv.textContent = step.label;
    contentDiv.appendChild(labelDiv);

    if (step.agents) {
      const agentsDiv = document.createElement('div');
      agentsDiv.className = 'pw-agents';
      step.agents.forEach(agent => {
        const agentDiv = document.createElement('div');
        agentDiv.className = 'pw-agent';

        const iconEl = document.createElement('span');
        iconEl.className = 'pw-agent-icon';
        iconEl.textContent = agent.icon;

        const nameEl = document.createElement('span');
        nameEl.className = 'pw-agent-name';
        nameEl.textContent = agent.name;

        const resultEl = document.createElement('span');
        resultEl.className = 'pw-agent-result';
        resultEl.textContent = agent.result;

        agentDiv.append(iconEl, nameEl, resultEl);
        agentsDiv.appendChild(agentDiv);
      });
      contentDiv.appendChild(agentsDiv);
    }

    div.appendChild(contentDiv);
    return div;
  }

  function renderInstant() {
    const promptEl = document.getElementById('pw-prompt');
    const pipeline = document.getElementById('pw-pipeline');
    if (!promptEl || !pipeline) return;
    promptEl.textContent = promptText;
    pipeline.innerHTML = '';
    steps.forEach(step => {
      const el = createStepEl(step);
      el.classList.add('pw-visible', 'pw-step-resolved');
      const statusEl = el.querySelector('.pw-step-status');
      statusEl.className = 'pw-step-status pw-done';
      if (step.success) el.classList.add('pw-step-success');
      if (step.agents) {
        el.querySelectorAll('.pw-agent').forEach(a => a.classList.add('pw-visible'));
      }
      pipeline.appendChild(el);
    });
  }

  if (prefersReduced) {
    renderInstant();
    return;
  }

  let loopTimer = null;

  function runAnimation() {
    const promptEl = document.getElementById('pw-prompt');
    const pipeline = document.getElementById('pw-pipeline');
    if (!promptEl || !pipeline) return;

    promptEl.innerHTML = '';
    pipeline.innerHTML = '';

    // Pre-render all steps (invisible)
    steps.forEach(step => pipeline.appendChild(createStepEl(step)));

    // Type the prompt
    let charIdx = 0;
    const cursor = document.createElement('span');
    cursor.className = 'pw-cursor';
    promptEl.appendChild(cursor);

    function typeChar() {
      if (charIdx < promptText.length) {
        cursor.insertAdjacentText('beforebegin', promptText[charIdx++]);
        setTimeout(typeChar, 32);
      } else {
        cursor.remove();
        setTimeout(() => activateStep(0), 380);
      }
    }

    function activateStep(idx) {
      if (idx >= steps.length) {
        loopTimer = setTimeout(runAnimation, 3200);
        return;
      }

      const stepEl = document.getElementById(steps[idx].id);
      if (!stepEl) return;

      // Show step with loading indicator
      stepEl.classList.add('pw-visible');
      const statusEl = stepEl.querySelector('.pw-step-status');
      statusEl.className = 'pw-step-status pw-loading';

      const hasAgents = !!steps[idx].agents;
      const loadDelay = hasAgents ? 700 : 480;

      setTimeout(() => {
        // Resolve step
        statusEl.className = 'pw-step-status pw-done';
        stepEl.classList.add('pw-step-resolved');
        if (steps[idx].success) stepEl.classList.add('pw-step-success');

        if (hasAgents) {
          const agentEls = stepEl.querySelectorAll('.pw-agent');
          agentEls.forEach((el, i) => {
            setTimeout(() => el.classList.add('pw-visible'), i * 300);
          });
          const agentDelay = agentEls.length * 300 + 480;
          setTimeout(() => activateStep(idx + 1), agentDelay);
        } else {
          setTimeout(() => activateStep(idx + 1), 220);
        }
      }, loadDelay);
    }

    setTimeout(typeChar, 500);
  }

  runAnimation();
}

/* ----------------------------------------------------------
   12. DOMContentLoaded — Init Everything
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initCounters();
  initStickyNav();
  initNavHighlight();
  initMobileNav();
  initSmoothScroll();
  initExpandableCards();
  initSkillCategories();
  initProcessWidget();
});
