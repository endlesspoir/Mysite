document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const CONFIG = Object.assign({
    leadEndpoint: '',
    web3formsKey: '',
    email: 'romanetsmaks0@gmail.com',
    botUrl: '',
    siteUrl: 'https://novespoir.tech'
  }, window.NOVESPOIR_CONFIG || {});

  const EMAIL = String(CONFIG.email || 'romanetsmaks0@gmail.com').trim();
  const WEB3FORMS_KEY = String(CONFIG.web3formsKey || '').trim();
  const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
  const LEAD_ENDPOINT = String(CONFIG.leadEndpoint || '').trim().replace(/\/+$/, '')
    || (WEB3FORMS_KEY ? WEB3FORMS_ENDPOINT : '');
  const USING_WEB3FORMS = Boolean(WEB3FORMS_KEY) && LEAD_ENDPOINT === WEB3FORMS_ENDPOINT;
  const BOT_URL = String(CONFIG.botUrl || '').trim();

  const isMobileLayout = () => window.matchMedia('(max-width: 760px)').matches;
  const isSceneSlide = slide => !slide.classList.contains('seo-content');
  const isModalOpen = () => document.documentElement.classList.contains('modal-open');
  const isFormControl = target => target instanceof Element && Boolean(target.closest('input, textarea, select, button, a, [contenteditable="true"]'));

  const initialHashId = location.hash.slice(1);
  window.scrollTo(0, 0);
  if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }

  const deck = document.getElementById('deck');
  const slides = [...deck.querySelectorAll('.slide')].filter(isSceneSlide);
  const railButtons = [...document.querySelectorAll('.chapter-rail button')];
  const mapButtons = [...document.querySelectorAll('.mobile-map [data-target]')];
  const langToggle = document.getElementById('langToggle');
  let currentIndex = Math.max(0, slides.findIndex(slide => slide.classList.contains('is-active')));
  let isAnimating = false;

  const translations = {
    en: {
      status: 'TAKING REQUESTS',
      startTag: 'DIGITAL PRODUCTS, END TO END',
      startTitle: 'Websites, Telegram bots and AI automation for business',
      startLead: 'I launch landing pages, bots, integrations and MVPs — taking the task from idea to a working product.',
      heroPrimary: 'Leave a request',
      heroSecondary: 'See services',
      statProjects: 'days to a landing page',
      statLaunch: 'week to website + bot',
      statLaunchValue: 'from 1',
      statSupport: 'weeks to an MVP',
      statSupportValue: 'from 2',
      playerCard: 'PROJECT CARD',
      role: 'Independent developer',
      cardText: 'I build the product myself: website, bot, payments and analytics. No extra contractors or missed deadlines.',
      skillSites: 'Websites & landing pages',
      skillBots: 'Telegram bots',
      skillAi: 'AI automation',
      skillIntegrations: 'Integrations',
      aboutTag: 'WHY NOVESPOIR',
      aboutTitle: 'Not just a website — a tool that brings leads',
      aboutText: 'I design the flow, structure and integrations so your website or bot brings inquiries, not just looks good. I launch it and stay around for support.',
      traitLeads: 'Focus on leads',
      traitDeadlines: 'Clear timelines',
      traitSupport: 'Post-launch support',
      traitStart: 'Fast start',
      strengths: 'Timeline and format',
      strengthSpeed: 'reply to a request',
      strengthSpeedValue: '24h',
      strengthDesign: 'days to a landing page',
      strengthReliability: 'weeks to website + bot',
      strengthReliabilityValue: 'from 1',
      strengthSupport: 'weeks to an MVP',
      strengthSupportValue: '2+',
      portfolioTag: 'SOLUTION EXAMPLES',
      portfolioTitle: 'What I can launch',
      projectLanding: 'Service landing page',
      q1: 'A conversion-focused page with a lead form, analytics and a fast launch.',
      projectShop: 'Online store',
      q2: 'Catalog, cart, payments, delivery and notifications in one flow.',
      projectBot: 'Telegram sales bot',
      q3: 'Requests, bookings, payments and notifications right inside Telegram.',
      projectAiDocs: 'AI document processing',
      q4: 'DOCX generation, text analysis and routine automation.',
      projectSaas: 'SaaS / user portal',
      q5: 'Subscriptions, roles, payments and authentication without extra complexity.',
      projectMobile: 'Mobile app',
      q6: 'Android on Kotlin: orders, statuses, payments and push notifications.',
      projectPayments: 'Payments & integrations',
      q7: 'Payment providers, CRM, delivery and external APIs.',
      projectAssistant: 'AI assistant',
      q8: 'Answers from your knowledge base, customer support and internal workflows.',
      shopTag: 'SERVICES',
      shopTitle: 'What I do',
      orderNow: 'Get a quote',
      popularBadge: 'Popular',
      serviceSites: 'Websites & landing pages',
      svcSites: 'Conversion-focused pages and corporate websites with analytics and lead forms.',
      serviceBots: 'Telegram bots',
      svcBots: 'Requests, bookings, payments, support and notifications in Telegram.',
      serviceAi: 'AI automation',
      svcAi: 'Documents, knowledge-base answers, request triage and assistants.',
      serviceBackend: 'Backend & API',
      svcBackend: 'Reliable server-side logic, databases and user portals.',
      serviceMobile: 'Mobile apps',
      svcMobile: 'MVPs and Android apps on Kotlin with payments and push.',
      serviceIntegrations: 'Integrations & payments',
      svcIntegrations: 'Payments, CRM, delivery, maps and external APIs in one system.',
      serviceWeb3: 'Web3 solutions',
      svcWeb3: 'Wallets, tokens, NFTs and blockchain events.',
      serviceMvp: 'MVP end to end',
      svcMvp: 'From idea to release: architecture, design, development and support.',
      svcConsult: 'I’ll help choose a format, scope and timeline.',
      packagesTag: 'ENGAGEMENT MODELS',
      packagesTitle: 'Where to start',
      packagesLead: 'No fixed prices: scope and cost depend on the task. After a short brief I send a clear plan and quote.',
      packageStart: 'Start',
      packageStartDesc: 'A landing page for a fast launch and first leads.',
      packageStartTime: '2–3 days',
      packageGrowth: 'Growth',
      packageGrowthDesc: 'Website plus bot: leads, payments, CRM and notifications in one flow.',
      packageGrowthTime: 'from 1 week',
      packageTurnkey: 'Turnkey',
      packageTurnkeyDesc: 'An MVP, AI automation or a complex product with integrations and support.',
      packageTurnkeyTime: 'from 2 weeks',
      packageCta: 'Discuss',
      packagesNote: 'You can start with one task and grow the project step by step.',
      stackTag: 'TECHNOLOGY',
      stackTitle: 'A reliable stack, no exotic bets',
      stackWeb: 'Web',
      stackWebText: 'HTML · CSS · JavaScript · Appwrite',
      stackBots: 'Bots',
      stackBotsText: 'Telegram Bot API · webhooks · payments',
      stackAi: 'AI',
      stackAiText: 'OpenAI · Spring AI · RAG · documents',
      stackPayments: 'Payments',
      stackPaymentsText: 'YooKassa · Stripe · Crypto · CRM',
      stackData: 'Data',
      stackDataText: 'PostgreSQL · Redis · Kafka · API',
      stackInfra: 'Infra',
      stackInfraText: 'Docker · CI/CD · Appwrite · monitoring',
      stackNote: 'I choose the stack for the job — not the other way around. Tools are picked for scope, speed and budget.',
      stackCta: 'Discuss a project',
      contactTag: 'LET’S TALK',
      contactTitle: 'Leave a request — I’ll come back with a plan and a quote',
      contactText: 'Tell me what you need. I usually reply within one business day. No spam or pushy calls.',
      writeMail: 'Send an email',
      contactNote: 'Send a brief, a reference link, or just describe the idea in your own words.',
      howStart: 'How the work goes',
      stepRequest: 'Request',
      stepRequestText: 'you describe the task',
      stepBrief: 'Brief',
      stepBriefText: 'I clarify the details',
      stepPlan: 'Plan & quote',
      stepPlanText: 'timeline and cost',
      stepLaunch: 'Launch',
      stepLaunchText: 'result and support',
      leadTag: 'PROJECT REQUEST',
      leadTitle: 'Tell me about the task',
      leadSubtitle: 'I’ll reply within one business day with a solution and a quote.',
      leadName: 'Your name',
      leadNamePlaceholder: 'Name',
      leadContact: 'Contact',
      leadContactPlaceholder: 'Telegram, phone or email',
      leadService: 'What do you need',
      leadBudget: 'Project scope',
      leadMessage: 'The task',
      leadMessagePlaceholder: 'What needs to be done, for whom, deadlines and reference links',
      leadConsent: 'I agree to the <a href="privacy.html" target="_blank" rel="noopener">personal data policy</a>',
      leadSubmit: 'Send request',
      leadFallback: 'Couldn’t send it? Email me at',
      leadNote: 'Or email me at <a href="mailto:romanetsmaks0@gmail.com">romanetsmaks0@gmail.com</a>',
      leadClose: 'Close',
      leadAnother: 'Send another',
      leadSuccessTitle: 'Request sent',
      leadSuccessText: 'Thank you! I’ll get in touch within one business day.',
      serviceConsult: 'Need a consultation',
      serviceSites: 'Website or landing page',
      serviceBots: 'Telegram bot',
      serviceAi: 'AI automation',
      serviceBackend: 'Backend & API',
      serviceMobile: 'Mobile app',
      serviceIntegrations: 'Integrations & payments',
      serviceWeb3: 'Web3 solutions',
      serviceMvp: 'MVP end to end',
      budgetUnknown: 'Not sure yet',
      budgetLow: 'Small task',
      budgetMid: 'Medium project',
      budgetHigh: 'Large project',
      budgetEnterprise: 'Complex / long-term',
      footerCopyright: '© 2026 NovEspoir · Websites, bots and AI solutions',
      footerPrivacy: 'Privacy policy',
      navStart: 'Start',
      navAbout: 'About',
      navWork: 'Examples',
      navServices: 'Services',
      navPackages: 'Timelines',
      navStack: 'Stack',
      navContact: 'Request',
      mStart: 'Start',
      mAbout: 'About',
      mWork: 'Examples',
      mServices: 'Services',
      mPackages: 'Plans',
      mStack: 'Stack',
      mContact: 'Request'
    }
  };

  const meta = {
    ru: {
      title: 'NovEspoir — независимый разработчик сайтов, ботов и AI-автоматизации',
      description: 'Независимый разработчик сайтов, лендингов, Telegram-ботов, AI-автоматизации и интеграций. Оставьте заявку — предложу решение, сроки и смету.',
      ogTitle: 'NovEspoir — независимый разработчик сайтов, ботов и AI-автоматизации',
      ogDescription: 'Независимый разработчик сайтов, Telegram-ботов, AI-автоматизации и интеграций. Оставьте заявку — рассчитаю проект, сроки и смету.',
      twitterTitle: 'NovEspoir — сайты, боты и AI-автоматизация',
      twitterDescription: 'Разработка сайтов, Telegram-ботов, AI-автоматизации и интеграций. Оставьте заявку — рассчитаем проект.',
      locale: 'ru_RU'
    },
    en: {
      title: 'NovEspoir — independent developer for websites, bots and AI automation',
      description: 'Independent developer for websites, landing pages, Telegram bots, AI automation and integrations. Leave a request and get a solution, timeline and quote.',
      ogTitle: 'NovEspoir — independent developer for websites, bots and AI automation',
      ogDescription: 'Independent developer for websites, Telegram bots, AI automation and integrations. Leave a request and get a project quote.',
      twitterTitle: 'NovEspoir — websites, bots and AI automation',
      twitterDescription: 'Websites, Telegram bots, AI automation and integrations. Leave a request and get a quote.',
      locale: 'en_US'
    }
  };

  const messages = {
    ru: {
      sending: 'Отправляем…',
      required: 'Заполните имя, контакт и описание задачи.',
      contact: 'Укажите контакт: Telegram, телефон или email.',
      message: 'Добавьте пару слов о задаче.',
      consent: 'Нужно согласие на обработку персональных данных.',
      notConfigured: 'Форма временно недоступна. Напишите на почту — отвечу.',
      network: 'Не удалось отправить заявку. Проверьте соединение или напишите на почту.',
      rate: 'Слишком много заявок. Попробуйте позже или напишите на почту.',
      generic: 'Что-то пошло не так. Попробуйте ещё раз или напишите на почту.'
    },
    en: {
      sending: 'Sending…',
      required: 'Please fill in your name, contact and task description.',
      contact: 'Add a contact: Telegram, phone or email.',
      message: 'Add a few words about the task.',
      consent: 'Please agree to the personal data policy.',
      notConfigured: 'The form is temporarily unavailable. Email me and I’ll reply.',
      network: 'Could not send the request. Check your connection or email me.',
      rate: 'Too many requests. Please try again later or email me.',
      generic: 'Something went wrong. Please try again or email me.'
    }
  };

  const russian = {};
  const russianPlaceholders = {};
  const russianAriaLabels = {};

  document.querySelectorAll('[data-i18n]').forEach(element => {
    russian[element.dataset.i18n] = element.innerHTML;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    russianPlaceholders[element.dataset.i18nPlaceholder] = element.getAttribute('placeholder') || '';
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
    russianAriaLabels[element.dataset.i18nAriaLabel] = element.getAttribute('aria-label') || '';
  });

  let currentLang = document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'ru';

  const setMetaContent = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.setAttribute('content', value);
  };

  const updateMeta = language => {
    const values = meta[language];
    document.title = values.title;
    setMetaContent('meta[name="description"]', values.description);
    setMetaContent('meta[property="og:title"]', values.ogTitle);
    setMetaContent('meta[property="og:description"]', values.ogDescription);
    setMetaContent('meta[name="twitter:title"]', values.twitterTitle);
    setMetaContent('meta[name="twitter:description"]', values.twitterDescription);
    setMetaContent('meta[property="og:locale"]', values.locale);
    setMetaContent('meta[property="og:locale:alternate"]', language === 'ru' ? 'en_US' : 'ru_RU');
    setMetaContent('meta[name="language"]', language === 'ru' ? 'Russian' : 'English');
  };

  const applyLanguage = language => {
    currentLang = language === 'en' ? 'en' : 'ru';
    document.documentElement.lang = currentLang;
    document.documentElement.setAttribute('data-lang', currentLang);

    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      const value = currentLang === 'en' ? translations.en[key] : russian[key];
      if (typeof value === 'string') element.innerHTML = value;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.dataset.i18nPlaceholder;
      const value = currentLang === 'en' ? translations.en[key] : russianPlaceholders[key];
      if (typeof value === 'string') element.setAttribute('placeholder', value);
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
      const key = element.dataset.i18nAriaLabel;
      const value = currentLang === 'en' ? translations.en[key] : russianAriaLabels[key];
      if (typeof value === 'string') element.setAttribute('aria-label', value);
    });

    document.querySelectorAll('.chapter-rail button').forEach(button => {
      const label = button.querySelector('span');
      if (label) button.setAttribute('aria-label', label.textContent.trim());
    });

    langToggle.textContent = currentLang === 'ru' ? 'EN' : 'RU';
    langToggle.setAttribute('aria-label', currentLang === 'ru' ? 'Switch to English' : 'Переключить на русский');
    langToggle.setAttribute('title', currentLang === 'ru' ? 'Switch to English' : 'Переключить на русский');
    updateMeta(currentLang);
  };

  applyLanguage(currentLang);

  langToggle.addEventListener('click', () => {
    const nextLanguage = currentLang === 'ru' ? 'en' : 'ru';
    try {
      localStorage.setItem('novespoir:lang', nextLanguage);
    } catch (error) {
      // Storage can be unavailable in private mode; the URL still keeps the choice.
    }
    try {
      const url = new URL(location.href);
      url.searchParams.set('lang', nextLanguage);
      history.replaceState(null, '', url);
    } catch (error) {
      // Ignore malformed URL edge cases.
    }
    applyLanguage(nextLanguage);
  });

  const syncNavigation = () => {
    const activeId = slides[currentIndex].id;
    railButtons.forEach(button => button.classList.toggle('is-active', button.dataset.target === activeId));
    mapButtons.forEach(button => button.classList.toggle('is-current', button.dataset.target === activeId));
    slides.forEach((slide, index) => slide.setAttribute('aria-hidden', String(index !== currentIndex)));
  };

  const goToSlide = (target, updateHash = true, force = false) => {
    const nextIndex = typeof target === 'number' ? (target + slides.length) % slides.length : slides.findIndex(slide => slide.id === target);
    if (!force && (nextIndex < 0 || nextIndex === currentIndex || isAnimating)) return;

    isAnimating = true;
    const nextSlide = slides[nextIndex];
    // Paint the new scene color first so the old slide fade doesn't flash the gradient.
    document.body.className = `theme-${nextSlide.id}`;
    slides[currentIndex].classList.remove('is-active');
    nextSlide.classList.add('is-active');
    currentIndex = nextIndex;
    window.scrollTo({ top: 0, behavior: 'instant' });
    syncNavigation();
    if (updateHash) history.replaceState(null, '', `#${nextSlide.id}`);

    setTimeout(() => { isAnimating = false; }, 310);
  };

  document.querySelectorAll('[data-target]').forEach(control => {
    control.addEventListener('click', event => {
      event.preventDefault();
      goToSlide(control.dataset.target);
    });
  });

  document.querySelectorAll('[data-action]').forEach(control => {
    control.addEventListener('click', event => {
      event.preventDefault();
      goToSlide(currentIndex + (control.dataset.action === 'next' ? 1 : -1));
    });
  });

  document.addEventListener('keydown', event => {
    if (isModalOpen() || isFormControl(event.target)) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      goToSlide(currentIndex + 1);
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      goToSlide(currentIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      goToSlide(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      goToSlide(slides.length - 1);
    }
  });

  let wheelLock = false;
  const getScrollableScene = event => {
    const scene = event.target.closest('.slide-inner.scene-page');
    if (!scene || scene.scrollHeight - scene.clientHeight <= 1) return null;

    const goingDown = event.deltaY > 0;
    const atTop = scene.scrollTop <= 1;
    const atBottom = scene.scrollTop + scene.clientHeight >= scene.scrollHeight - 1;
    return goingDown && !atBottom || !goingDown && !atTop ? scene : null;
  };

  window.addEventListener('wheel', event => {
    if (isMobileLayout() || isModalOpen() || wheelLock || Math.abs(event.deltaY) < 18) return;
    if (getScrollableScene(event)) return;
    event.preventDefault();
    wheelLock = true;
    goToSlide(currentIndex + (event.deltaY > 0 ? 1 : -1));
    setTimeout(() => { wheelLock = false; }, 420);
  }, { passive: false });

  let startX = 0;
  let startY = 0;
  let tracking = false;

  window.addEventListener('touchstart', event => {
    if (isModalOpen() || event.touches.length !== 1) return;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  // Desktop only: block horizontal page pan while swiping between scenes.
  // On mobile Chrome a non-passive touchmove (even without preventDefault on
  // vertical moves) can freeze native up/down scrolling — rely on touch-action:pan-y.
  window.addEventListener('touchmove', event => {
    if (!tracking || isModalOpen() || isMobileLayout()) return;
    const deltaX = Math.abs(event.touches[0].clientX - startX);
    const deltaY = Math.abs(event.touches[0].clientY - startY);
    if (deltaX <= deltaY || deltaX < 12) return;
    event.preventDefault();
  }, { passive: false });

  window.addEventListener('touchend', event => {
    if (!tracking) return;
    tracking = false;
    if (isModalOpen() || !event.changedTouches.length) return;

    const deltaX = event.changedTouches[0].clientX - startX;
    const deltaY = event.changedTouches[0].clientY - startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX < 48 || absY >= 72 || absX < absY * 1.5) return;
    goToSlide(currentIndex + (deltaX < 0 ? 1 : -1));
  }, { passive: true });

  document.body.className = `theme-${slides[currentIndex].id}`;
  if (initialHashId && slides.some(slide => slide.id === initialHashId)) {
    goToSlide(initialHashId, false, true);
  }
  syncNavigation();

  /* ------------------------------------------------------------------ *
   * Lead form
   * ------------------------------------------------------------------ */

  const modal = document.getElementById('leadModal');
  const form = document.getElementById('leadForm');
  const successPanel = document.getElementById('leadSuccess');
  const errorPanel = document.getElementById('leadError');
  const fallbackPanel = document.getElementById('leadFallback');
  const mailFallback = document.getElementById('leadMailFallback');
  const againButton = document.getElementById('leadAgain');
  const submitButton = form ? form.querySelector('.lead-submit') : null;
  const modalDialog = modal ? modal.querySelector('.lead-modal__dialog') : null;
  const backgroundElements = [
    document.querySelector('.topbar'),
    deck,
    document.getElementById('seo'),
    document.querySelector('.chapter-rail'),
    document.querySelector('.mobile-map'),
    document.querySelector('.site-disclaimer')
  ].filter(Boolean);

  let lastFocusedElement = null;
  let openedAt = 0;
  let activeRequest = null;

  const defaultSubmitLabel = () => (currentLang === 'en' ? translations.en.leadSubmit : russian.leadSubmit);

  const setBackgroundInert = inert => {
    backgroundElements.forEach(element => {
      try {
        element.inert = inert;
      } catch (error) {
        // Older browsers simply ignore this.
      }
    });
  };

  const getFormValues = () => {
    const serviceSelect = form.elements.service;
    const budgetSelect = form.elements.budget;
    const selectedService = serviceSelect && serviceSelect.selectedOptions[0];
    const selectedBudget = budgetSelect && budgetSelect.selectedOptions[0];
    return {
      name: String(form.elements.name.value || '').trim(),
      contact: String(form.elements.contact.value || '').trim(),
      service: serviceSelect ? serviceSelect.value : 'consult',
      serviceLabel: selectedService ? selectedService.textContent.trim() : '',
      budget: budgetSelect ? budgetSelect.value : 'unknown',
      budgetLabel: selectedBudget ? selectedBudget.textContent.trim() : '',
      message: String(form.elements.message.value || '').trim(),
      consent: Boolean(form.elements.consent.checked),
      company: String(form.elements.company.value || '')
    };
  };

  const readAttribution = () => {
    const keys = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'ttclid', 'yclid', 'gclid', 'fbclid', 'ref', 'from'
    ];
    const params = new URLSearchParams(location.search);
    const current = {};
    keys.forEach(key => {
      const value = params.get(key);
      if (value) current[key] = String(value).slice(0, 200);
    });

    let saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem('novespoir:attribution') || 'null');
    } catch (error) {
      saved = null;
    }

    const hasCurrent = Object.keys(current).length > 0;
    if (saved && saved.ts && !hasCurrent) return saved;

    const attribution = Object.assign(
      {
        landing: location.href.slice(0, 600),
        referrer: document.referrer.slice(0, 600),
        ts: Date.now()
      },
      saved || {},
      current
    );
    attribution.ts = Date.now();

    if (hasCurrent || !saved) {
      try {
        sessionStorage.setItem('novespoir:attribution', JSON.stringify(attribution));
      } catch (error) {
        // Storage is optional.
      }
    }
    return attribution;
  };

  const buildMailto = () => {
    const values = getFormValues();
    const attribution = readAttribution();
    const subject = currentLang === 'en'
      ? `Website request: ${values.serviceLabel || values.service}`
      : `Заявка с сайта: ${values.serviceLabel || values.service}`;
    const lines = currentLang === 'en'
      ? [
          `Name: ${values.name}`,
          `Contact: ${values.contact}`,
          `Service: ${values.serviceLabel || values.service}`,
          `Budget: ${values.budgetLabel || values.budget}`,
          '',
          values.message.slice(0, 1500),
          '',
          `Page: ${location.href}`,
          `Source: ${attribution.utm_source || attribution.ref || attribution.from || 'direct'}`
        ]
      : [
          `Имя: ${values.name}`,
          `Контакт: ${values.contact}`,
          `Услуга: ${values.serviceLabel || values.service}`,
          `Бюджет: ${values.budgetLabel || values.budget}`,
          '',
          values.message.slice(0, 1500),
          '',
          `Страница: ${location.href}`,
          `Источник: ${attribution.utm_source || attribution.ref || attribution.from || 'прямой'}`
        ];
    return `mailto:${encodeURIComponent(EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  };

  const clearError = () => {
    if (!errorPanel) return;
    errorPanel.hidden = true;
    errorPanel.textContent = '';
    if (fallbackPanel) fallbackPanel.hidden = true;
    form.querySelectorAll('[aria-invalid="true"]').forEach(element => element.removeAttribute('aria-invalid'));
  };

  const showError = (message, withFallback = true) => {
    if (!errorPanel) return;
    errorPanel.textContent = message;
    errorPanel.hidden = false;
    if (fallbackPanel) fallbackPanel.hidden = !withFallback;
    if (withFallback && mailFallback) mailFallback.href = buildMailto();
  };

  const invalidate = field => {
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.focus({ preventScroll: false });
    }
    return false;
  };

  const validateForm = () => {
    const values = getFormValues();
    if (!values.name || values.name.length < 2) {
      showError(messages[currentLang].required, false);
      return invalidate(form.elements.name);
    }
    if (!values.contact || values.contact.length < 3) {
      showError(messages[currentLang].contact, false);
      return invalidate(form.elements.contact);
    }
    if (!values.message || values.message.length < 5) {
      showError(messages[currentLang].message, false);
      return invalidate(form.elements.message);
    }
    if (!values.consent) {
      showError(messages[currentLang].consent, false);
      return invalidate(form.elements.consent);
    }
    return true;
  };

  const showFormView = () => {
    if (!form || !successPanel) return;
    form.hidden = false;
    successPanel.hidden = true;
    clearError();
    if (modalDialog) modalDialog.scrollTop = 0;
  };

  const focusFirstField = () => {
    if (form && !form.hidden && form.elements.name) {
      window.setTimeout(() => form.elements.name.focus({ preventScroll: true }), 80);
    }
  };

  const openLead = service => {
    if (!modal || !form) return;
    lastFocusedElement = document.activeElement;
    openedAt = Date.now();
    showFormView();

    if (service && form.elements.service) {
      const options = [...form.elements.service.options];
      if (options.some(option => option.value === service)) form.elements.service.value = service;
    }

    modal.hidden = false;
    modal.classList.add('is-open');
    document.documentElement.classList.add('modal-open');
    setBackgroundInert(true);
    if (modalDialog) modalDialog.scrollTop = 0;
    focusFirstField();
  };

  const closeLead = () => {
    if (!modal || modal.hidden) return;
    if (activeRequest) {
      activeRequest.abort();
      activeRequest = null;
    }
    modal.classList.remove('is-open');
    modal.hidden = true;
    document.documentElement.classList.remove('modal-open');
    setBackgroundInert(false);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = defaultSubmitLabel();
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus({ preventScroll: true });
    }
  };

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-lead]');
    if (!trigger) return;
    event.preventDefault();
    openLead(trigger.dataset.service || '');
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const trigger = event.target.closest('[data-lead][role="button"]');
    if (!trigger) return;
    event.preventDefault();
    openLead(trigger.dataset.service || '');
  });

  if (modal) {
    modal.addEventListener('click', event => {
      if (event.target.closest('[data-close-lead]')) closeLead();
    });

    modal.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter(element => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal && !modal.hidden) {
      event.preventDefault();
      closeLead();
    }
  });

  if (againButton) {
    againButton.addEventListener('click', () => {
      if (!form) return;
      form.reset();
      openedAt = Date.now();
      showFormView();
      focusFirstField();
    });
  }

  if (form) {
    form.addEventListener('input', () => {
      if (errorPanel && !errorPanel.hidden) clearError();
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      clearError();

      if (!validateForm()) return;

      if (!LEAD_ENDPOINT) {
        showError(messages[currentLang].notConfigured, true);
        return;
      }

      const values = getFormValues();
      const attribution = readAttribution();
      const payload = {
        name: values.name,
        contact: values.contact,
        service: values.service,
        serviceLabel: values.serviceLabel,
        budget: values.budget,
        budgetLabel: values.budgetLabel,
        message: values.message,
        consent: values.consent,
        company: values.company,
        elapsedMs: Math.max(0, Date.now() - openedAt),
        lang: currentLang,
        page: location.href,
        landing: attribution.landing || '',
        referrer: attribution.referrer || document.referrer,
        utm: {
          source: attribution.utm_source || '',
          medium: attribution.utm_medium || '',
          campaign: attribution.utm_campaign || '',
          content: attribution.utm_content || '',
          term: attribution.utm_term || '',
          ttclid: attribution.ttclid || '',
          yclid: attribution.yclid || '',
          gclid: attribution.gclid || '',
          fbclid: attribution.fbclid || '',
          ref: attribution.ref || attribution.from || ''
        }
      };

      if (USING_WEB3FORMS) {
        Object.assign(payload, {
          access_key: WEB3FORMS_KEY,
          subject: currentLang === 'en'
            ? `Website request: ${values.serviceLabel || values.service}`
            : `Заявка с сайта: ${values.serviceLabel || values.service}`,
          from_name: 'NovEspoir',
          botcheck: values.company,
          source: attribution.utm_source || attribution.ref || attribution.from || 'direct',
          medium: attribution.utm_medium || '',
          campaign: attribution.utm_campaign || '',
          ttclid: attribution.ttclid || ''
        });
        if (values.contact.includes('@')) payload.email = values.contact;
      }

      const controller = new AbortController();
      activeRequest = controller;
      const timeout = window.setTimeout(() => controller.abort(), 20000);

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = messages[currentLang].sending;
      }

      try {
        const response = await fetch(LEAD_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store'
        });

        let data = {};
        try {
          data = await response.json();
        } catch (error) {
          data = {};
        }

        const delivered = data.ok === true || data.success === true || data.success === 'true';
        if (!response.ok || !delivered) {
          if (response.status === 429) throw new Error('rate_limited');
          throw new Error(data.message || data.error || 'request_failed');
        }

        form.reset();
        clearError();
        form.hidden = true;
        if (successPanel) {
          successPanel.hidden = false;
          const heading = successPanel.querySelector('h3');
          if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
          }
        }
        if (modalDialog) modalDialog.scrollTop = 0;
      } catch (error) {
        if (!modal || modal.hidden) return;
        if (error && error.message === 'rate_limited') {
          showError(messages[currentLang].rate, true);
        } else if (error && error.name === 'AbortError') {
          showError(messages[currentLang].network, true);
        } else {
          showError(messages[currentLang].generic, true);
        }
      } finally {
        window.clearTimeout(timeout);
        if (activeRequest === controller) activeRequest = null;
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = defaultSubmitLabel();
        }
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Config-driven links
   * ------------------------------------------------------------------ */

  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    link.href = `mailto:${EMAIL}`;
    if (link.textContent.trim() === 'romanetsmaks0@gmail.com') link.textContent = EMAIL;
  });
  if (mailFallback) {
    mailFallback.textContent = EMAIL;
    mailFallback.href = `mailto:${EMAIL}`;
  }

  if (BOT_URL) {
    document.querySelectorAll('[data-bot-link]').forEach(link => {
      link.href = BOT_URL;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.hidden = false;
    });
  }
});
