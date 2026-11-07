/* K-state consent-gated GA4 adapter. No names, emails, free text or raw URLs. */
(function (w, d) {
  'use strict';
  if (w.KStateAnalytics) return;
  const cfg = w.KSTATE_ANALYTICS_CONFIG || {};
  const valid = cfg.enabled === true && /^G-[A-Z0-9]{6,20}$/.test(cfg.measurementId || '') &&
    (cfg.allowedHosts || []).includes(w.location.hostname);
  const key = 'kstate_analytics_consent';
  const ttl = 180 * 24 * 60 * 60 * 1000;
  const eventRules = {
    cta_click: {cta_id: ['nav_consultation','hero_consultation','footer_consultation','footer_form','email','diagnosis','diagnosis_result','resource','service_consultation','guide']},
    contact_form_start: {form_id: ['contact']},
    contact_submit_attempt: {form_id: ['contact']},
    contact_submit_unverified: {form_id: ['contact']},
    contact_submit_error: {form_id: ['contact'], error_type: ['network']},
    diagnosis_start: {form_id: ['management_diagnosis']},
    diagnosis_complete: {form_id: ['management_diagnosis']},
    resource_click: {resource_id: ['book_bonus','management_kit']}
  };
  const knownPages = {
    '/': 'home', '/index.html': 'home', '/privacy.html': 'privacy',
    '/legal.html': 'legal', '/terms.html': 'terms', '/book-bonus.html': 'book_bonus',
    '/check/': 'management_diagnosis', '/check/index.html': 'management_diagnosis',
    "/services/management/": "service_management", "/services/management/index.html": "service_management",
    "/services/monthly-close/": "service_monthly_close", "/services/monthly-close/index.html": "service_monthly_close",
    "/services/ai-accounting/": "service_ai_accounting", "/services/ai-accounting/index.html": "service_ai_accounting",
    "/guides/monthly-close-checklist/": "guide_monthly_close_checklist", "/guides/monthly-close-checklist/index.html": "guide_monthly_close_checklist",
    "/guides/accounting-automation/": "guide_accounting_automation", "/guides/accounting-automation/index.html": "guide_accounting_automation",
    "/guides/backoffice-roles/": "guide_backoffice_roles", "/guides/backoffice-roles/index.html": "guide_backoffice_roles",
    "/services/": "services", "/services/index.html": "services",
    "/guides/": "guides", "/guides/index.html": "guides"
  };
  const label = knownPages[w.location.pathname] || 'other';
  let accepted = false, loaded = false, started = false;
  let banner, settingsButton, firstInputTracked = false;
  const cleanUrl = () => w.location.origin + (label === 'other' ? '/' : w.location.pathname);
  const cleanReferrer = () => {
    try { const u = new URL(d.referrer); return /https?:/.test(u.protocol) ? u.origin + '/' : ''; }
    catch (_) { return ''; }
  };
  const campaign = () => {
    const q = new URL(w.location.href).searchParams;
    const out = {};
    [['utm_source','campaign_source','campaignSources'],['utm_medium','campaign_medium','campaignMediums'],
     ['utm_campaign','campaign_name','campaignNames'],['utm_content','campaign_content','campaignContents']].forEach(([query, target, list]) => {
      const v = q.get(query);
      if (v && (cfg[list] || []).includes(v)) out[target] = v;
    });
    return out;
  };
  function command() { w.dataLayer.push(arguments); }
  function common() {
    return {page_location: cleanUrl(), page_referrer: cleanReferrer(), page_title: label, page_type: label};
  }
  function track(name, params) {
    if (!valid || !accepted || !started || !Object.hasOwn(eventRules, name)) return false;
    const safe = common();
    const rule = eventRules[name];
    Object.keys(rule).forEach(k => { if (params && rule[k].includes(params[k])) safe[k] = params[k]; });
    safe.send_to = cfg.measurementId;
    if (cfg.debug === true) safe.debug_mode = true;
    command('event', name, safe);
    return true;
  }
  function start() {
    if (!valid || !accepted || started) return;
    // Existing GTM/gtag must be consolidated, not silently double-loaded.
    if (w.gtag || d.querySelector('script[src*="googletagmanager.com"]')) return;
    started = true;
    w['ga-disable-' + cfg.measurementId] = false;
    w.dataLayer = w.dataLayer || [];
    w.gtag = command;
    command('consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
    command('consent', 'update', {analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
    command('js', new Date());
    command('config', cfg.measurementId, Object.assign(common(), campaign(), {
      send_page_view: false, allow_google_signals: false,
      allow_ad_personalization_signals: false, cookie_expires: 15552000,
      cookie_update: false, cookie_flags: 'SameSite=Lax;Secure'
    }));
    command('event', 'page_view', Object.assign(common(), {send_to: cfg.measurementId}, cfg.debug === true ? {debug_mode:true} : {}));
    const script = d.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.measurementId);
    // Do not send the current page URL, possibly containing free-text query data, as a Referer.
    script.referrerPolicy = 'no-referrer';
    script.onload = () => { loaded = true; };
    d.head.appendChild(script);
  }
  function clearCookies() {
    const names = d.cookie.split(';').map(c => c.trim().split('=')[0]).filter(n => /^_ga(?:_|$)/.test(n));
    const host = w.location.hostname;
    names.forEach(n => {
      ['', host, '.' + host, 'k-state.jp', '.k-state.jp'].forEach(domain => {
        d.cookie = n + '=; Max-Age=0; Path=/; SameSite=Lax' + (domain ? '; Domain=' + domain : '');
      });
    });
  }
  function setConsent(choice) {
    if (!valid || !['granted','denied'].includes(choice)) return false;
    accepted = choice === 'granted';
    try { w.localStorage.setItem(key, JSON.stringify({choice, version:cfg.consentVersion, expires:Date.now()+ttl})); } catch (_) {}
    if (banner) banner.hidden = true;
    if (accepted) {
      if (started) {
        w['ga-disable-' + cfg.measurementId] = false;
        command('consent','update',{analytics_storage:'granted'});
      } else start();
    } else if (started) {
      w['ga-disable-' + cfg.measurementId] = true;
      command('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      clearCookies();
    }
    return true;
  }
  function readConsent() {
    try {
      const saved = JSON.parse(w.localStorage.getItem(key) || 'null');
      if (saved && saved.version === cfg.consentVersion && saved.expires > Date.now() && ['granted','denied'].includes(saved.choice)) return saved.choice;
    } catch (_) {}
    return null;
  }
  function boot() {
    if (!valid) return;
    banner = d.createElement('section');
    banner.className = 'ks-consent';
    banner.setAttribute('aria-label','アクセス解析の設定');
    const p = d.createElement('p');
    p.textContent = 'サイト改善のため、同意いただいた場合にGoogle Analyticsで閲覧ページや相談ボタンの利用状況を計測します。フォームに入力した氏名・メール・相談内容は送信しません。拒否してもサイトを利用できます。';
    banner.appendChild(p);
    const privacy = d.createElement('a'); privacy.href = '/privacy.html'; privacy.textContent = 'プライバシーポリシー'; banner.appendChild(privacy);
    [['許可しない','denied'],['解析を許可する','granted']].forEach(([text, value]) => {
      const button = d.createElement('button'); button.type='button'; button.textContent=text;
      button.addEventListener('click', () => { setConsent(value); settingsButton.focus(); }); banner.appendChild(button);
    });
    d.body.appendChild(banner);
    settingsButton = d.createElement('button'); settingsButton.type='button'; settingsButton.className='ks-consent-settings'; settingsButton.textContent='アクセス解析設定';
    settingsButton.addEventListener('click', () => { banner.hidden = false; banner.querySelector('button').focus(); }); d.body.appendChild(settingsButton);
    w.addEventListener('storage', e => {
      if (e.key !== key && e.key !== null) return;
      const state = readConsent();
      accepted = state === 'granted';
      banner.hidden = state !== null;
      if (accepted && !started) start();
      else if (started) {
        w['ga-disable-' + cfg.measurementId] = !accepted;
        command('consent', 'update', {analytics_storage: accepted ? 'granted' : 'denied'});
        if (!accepted) clearCookies();
      }
    });
    const saved = readConsent(); banner.hidden = saved !== null;
    if (saved === 'granted') { accepted = true; start(); }
    d.addEventListener('click', e => {
      const target = e.target && e.target.closest ? e.target.closest('[data-analytics-cta]') : null;
      if (target) track('cta_click', {cta_id:target.getAttribute('data-analytics-cta')});
    });
    const form = d.getElementById('contactForm');
    if (form) form.addEventListener('input', () => {
      if (!firstInputTracked && track('contact_form_start',{form_id:'contact'})) firstInputTracked=true;
    });
  }
  w.KStateAnalytics = Object.freeze({track, setConsent, status: () => ({configured:valid, consent:accepted?'granted':'denied', started, loaded})});
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})(window, document);
