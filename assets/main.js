document.addEventListener('DOMContentLoaded', () => {
  const isMobileLayout = () => window.matchMedia('(max-width: 760px)').matches;
  const isSceneSlide = slide => !slide.classList.contains('seo-content');

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
      status:'OPEN TO CHAT', startTag:'SELECT PLAYER · MIDDLE DEV',
      startTitle:'Middle Java / Spring Boot developer — backend, Android, AI and bots', startLead:'Portfolio: Java and Spring Boot · Kotlin Android · AI · Telegram bots · Web3. Open to work and chat.',
      telegram:'Write on Telegram', integrations:'integrations', level:'backend level',
      playerCard:'PLAYER CARD', role:'Backend Developer', cardText:'I build services, connect mobile clients, add AI and deliver projects to a working result.',
      skillJava:'Java · Spring', skillKotlin:'Kotlin · Android', skillAiBots:'AI · Bots', skillWeb3:'Web3 · API',
      aboutTag:'CHARACTER STATS', aboutTitle:'Not just code — a complete solution',
      aboutText:'I build load-ready backends, connect Android apps to APIs, automate routines with AI and create clear frontends. I like tasks where the result is visible.',
      traitProduct:'Product mindset', traitStable:'Reliability', traitClear:'Clear communication', traitSpeed:'Fast start', strengths:'Strengths',
      backendPower:'Backend', botsPower:'Bots & Sites', aiPower:'AI', mobilePower:'Mobile',
      portfolioTag:'MINI PORTFOLIO', portfolioTitle:'Choose a level',
      projectAiDocuments:'AI Documents', projectEcommerce:'E-commerce', projectWeb3Payments:'Web3 Payments',
      projectNftMarketplace:'NFT Marketplace', projectSaasBooking:'SaaS Booking', projectMobileDelivery:'Mobile Delivery',
      projectTelegramCrm:'Telegram CRM', projectSmartLanding:'Smart Landing',
      q1:'DOCX generation, text analysis and document workflow automation.', q2:'Orders, payments, notifications and stable application APIs.',
      q3:'Wallets, transactions and blockchain network events.', q4:'Catalogs, orders, smart-contract events and operation history.',
      q5:'Bookings, roles, subscriptions and JWT authorization.', q6:'Android app for orders, statuses and payments.',
      q7:'Bot for requests, notifications, bookings and internal processes.', q8:'Bright service website with clear structure and fast launch.',
      shopTag:'SKILL TREE', shopTitle:'What I can do', orderNow:'Discuss a skill',
      disclaimer:' It is a personal portfolio for showcasing professional skills.',
      popularBadge:'Popular',
      serviceAi:'AI & Automation', serviceBackend:'Backend', serviceMobile:'Mobile Apps',
      serviceBots:'Telegram Bots', serviceSites:'Bright Websites', serviceWeb3:'Web3 Solutions',
      serviceAiAgents:'AI Agents', serviceIntegrations:'Integrations', serviceMvp:'MVP End-to-End',
      svcAi:'Documents, text analysis, smart hints and automated routine.', svcBackend:'API, databases, integrations, tests and documentation.',
      svcMobile:'MVP and Kotlin Android applications connected to your API.', svcBot:'Sales, booking, support, notifications and internal workflows.',
      svcSite:'Landings, portfolios and compact sites with lively design.', svcWeb3:'Wallets, tokens, NFT, transactions and blockchain integrations.',
      svcAiAgents:'Autonomous assistants for databases, documents and team workflows.', svcIntegrations:'Payments, CRM, Telegram, maps, email and external APIs in one system.', svcMvp:'Fast product launch: architecture, admin panel, API and first release.',
      stackTag:'INVENTORY', stackTitle:'Working stack', questAvailable:'NEW QUEST AVAILABLE',
      stackCore:'Core', stackCoreText:'Java 17/21 · Spring Boot · Security · PostgreSQL · Redis',
      stackMobile:'Mobile', stackMobileText:'Kotlin · Android · REST · UI flow',
      stackAi:'AI', stackAiText:'Spring AI · Apache POI · Automation',
      stackWeb3:'Web3', stackWeb3Text:'Web3j · wallets · tokens · NFT · events',
      stackData:'Data flow', stackDataText:'Kafka · RabbitMQ · gRPC · Elasticsearch',
      stackInfra:'Infrastructure', stackInfraText:'Docker · Kubernetes · CI/CD · monitoring',
      contactTitle:'Let’s build your product', contactText:'Describe your task — I will turn it into a clear plan and a working product.',
      writeTg:'Telegram', writeMail:'Send email', howStart:'How we start', stepRequest:'Request', stepRequestText:'your own words are fine',
      stepDiscuss:'Discussion', stepDiscussText:'goal and constraints', stepPlan:'Plan', stepPlanText:'solution and estimate',
      stepWork:'Work', stepWorkText:'result and handover', navStart:'Start', navAbout:'Hero', navWork:'Work',
      navServices:'Skills', navStack:'Stack', navContact:'Contact',
      mStart:'Start', mWork:'Work', mServices:'Skills', mStack:'Stack', mContact:'Chat'
    }
  };

  const russian = {};
  document.querySelectorAll('[data-i18n]').forEach(element => {
    russian[element.dataset.i18n] = element.innerHTML;
  });

  const applyLanguage = language => {
    document.documentElement.lang = language;
    langToggle.textContent = language === 'ru' ? 'EN' : 'RU';
    document.querySelectorAll('[data-i18n]').forEach(element => {
      element.innerHTML = language === 'en' ? translations.en[element.dataset.i18n] : russian[element.dataset.i18n];
    });
  };

  langToggle.addEventListener('click', () => {
    applyLanguage(document.documentElement.lang === 'ru' ? 'en' : 'ru');
  });

  const initialLang = new URLSearchParams(location.search).get('lang') === 'ru' ? 'ru' : 'en';
  applyLanguage(initialLang);

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
    if (['ArrowRight','ArrowDown','PageDown',' '].includes(event.key)) { event.preventDefault(); goToSlide(currentIndex + 1); }
    else if (['ArrowLeft','ArrowUp','PageUp'].includes(event.key)) { event.preventDefault(); goToSlide(currentIndex - 1); }
    else if (event.key === 'Home') { event.preventDefault(); goToSlide(0); }
    else if (event.key === 'End') { event.preventDefault(); goToSlide(slides.length - 1); }
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
    if (isMobileLayout() || wheelLock || Math.abs(event.deltaY) < 18) return;
    if (getScrollableScene(event)) return;
    event.preventDefault();
    wheelLock = true;
    goToSlide(currentIndex + (event.deltaY > 0 ? 1 : -1));
    setTimeout(() => { wheelLock = false; }, 420);
  }, { passive:false });

  let startX = 0, startY = 0, tracking = false;
  window.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    tracking = true;
  }, { passive:true });

  // Desktop only: block horizontal page pan while swiping between scenes.
  // On mobile Chrome a non-passive touchmove (even without preventDefault on
  // vertical moves) can freeze native up/down scrolling — rely on touch-action:pan-y.
  window.addEventListener('touchmove', event => {
    if (!tracking || isMobileLayout()) return;
    const deltaX = Math.abs(event.touches[0].clientX - startX);
    const deltaY = Math.abs(event.touches[0].clientY - startY);
    if (deltaX <= deltaY || deltaX < 12) return;
    event.preventDefault();
  }, { passive:false });

  window.addEventListener('touchend', event => {
    if (!tracking) return;
    tracking = false;
    if (!event.changedTouches.length) return;

    const deltaX = event.changedTouches[0].clientX - startX;
    const deltaY = event.changedTouches[0].clientY - startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX < 48 || absY >= 72 || absX < absY * 1.5) return;
    goToSlide(currentIndex + (deltaX < 0 ? 1 : -1));
  }, { passive:true });

  const hashId = location.hash.slice(1);
  document.body.className = `theme-${slides[currentIndex].id}`;
  if (hashId && slides.some(slide => slide.id === hashId)) {
    goToSlide(hashId, false, true);
  }
  syncNavigation();
});
