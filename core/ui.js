/* PartyHUB — core/ui.js
   Wspólne helpery UI dla wszystkich gier.

   [PH] CORE_UI_JS_BEGIN
*/

(function(){
  const PH = (window.PH = window.PH || {});

  // =============================
  // DOM helpers
  // =============================
  PH.$ = (id, root=document) => {
    if(typeof id !== 'string') return null;
    if(root && typeof root.getElementById === 'function') return root.getElementById(id);
    return document.getElementById(id);
  };

  PH.qs = (sel, root=document) => (root || document).querySelector(sel);
  PH.qsa = (sel, root=document) => Array.from((root || document).querySelectorAll(sel));

  const toEl = (idOrEl) => {
    if(!idOrEl) return null;
    if(typeof idOrEl === 'string') return document.getElementById(idOrEl);
    return idOrEl;
  };

  // =============================
  // Overlay helpers (klasa .is-visible)
  // =============================
  PH.showO = (idOrEl) => {
    const el = toEl(idOrEl);
    if(el) el.classList.add('is-visible');
  };

  PH.hideO = (idOrEl) => {
    const el = toEl(idOrEl);
    if(el) el.classList.remove('is-visible');
  };

  PH.toggleO = (idOrEl, force) => {
    const el = toEl(idOrEl);
    if(!el) return false;
    if(typeof force === 'boolean') el.classList.toggle('is-visible', force);
    else el.classList.toggle('is-visible');
    return el.classList.contains('is-visible');
  };

  PH.isVisible = (idOrEl) => {
    const el = toEl(idOrEl);
    return !!(el && el.classList.contains('is-visible'));
  };

  // Back-compat: global funkcje (dla gier 1:1 bez importów)
  if(typeof window.showO !== 'function') window.showO = (x)=>PH.showO(x);
  if(typeof window.hideO !== 'function') window.hideO = (x)=>PH.hideO(x);
  if(typeof window.toggleO !== 'function') window.toggleO = (x, f)=>PH.toggleO(x, f);
  if(typeof window.isVisible !== 'function') window.isVisible = (x)=>PH.isVisible(x);

  // =============================
  // Utils
  // =============================
  PH.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  PH.randInt = (a, b) => {
    const min = Math.ceil(Math.min(a, b));
    const max = Math.floor(Math.max(a, b));
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  PH.uid = () => (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));

  // Kopiowanie do schowka (z fallback)
  PH.copyText = async (txt) => {
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(String(txt || ''));
        return true;
      }
    }catch(_e){}

    try{
      const ta = document.createElement('textarea');
      ta.value = String(txt || '');
      ta.setAttribute('readonly','');
      ta.className = 'ph-offscreen-ta';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand && document.execCommand('copy');
      ta.remove();
      return !!ok;
    }catch(_e){}
    return false;
  };

  // =============================
  // Storage helpers
  // =============================
  PH.storage = PH.storage || {};
  PH.storage.get = (key, fallback=null) => {
    try{
      const v = localStorage.getItem(String(key));
      return (v === null || v === undefined) ? fallback : v;
    }catch(_e){}
    return fallback;
  };

  PH.storage.set = (key, value) => {
    try{ localStorage.setItem(String(key), String(value)); return true; }catch(_e){}
    return false;
  };

  PH.storage.getJSON = (key, fallback=null) => {
    try{
      const raw = localStorage.getItem(String(key));
      if(!raw) return fallback;
      return JSON.parse(raw);
    }catch(_e){}
    return fallback;
  };

  PH.storage.setJSON = (key, obj) => {
    try{ localStorage.setItem(String(key), JSON.stringify(obj)); return true; }catch(_e){}
    return false;
  };

  PH.storage.remove = (key) => { try{ localStorage.removeItem(String(key)); return true; }catch(_e){} return false; };

  PH.storage.removeByPrefix = (prefix) => {
    let removed = 0;
    try{
      const p = String(prefix || '');
      const keys = [];
      for(let i=0;i<localStorage.length;i++){
        const k = localStorage.key(i);
        if(k && k.startsWith(p)) keys.push(k);
      }
      keys.forEach(k=>{ try{ localStorage.removeItem(k); removed++; }catch(_e){} });
    }catch(_e){}
    return removed;
  };

  // =============================
  // Confirm modal (overlay #confirmOverlay)
  // =============================
  let __confirmCb = null;

  PH.closeConfirm = () => {
    __confirmCb = null;
    PH.hideO('confirmOverlay');
  };

  PH.openConfirm = ({ title, message, okText='OK', cancelText='Anuluj', okClass='btn-reset', onConfirm } = {}) => {
    // fallback, jeśli danej gry nie ma wspólnego confirmOverlay
    const ov = document.getElementById('confirmOverlay');
    if(!ov){
      const ok = window.confirm([title||'Potwierdź', message||''].filter(Boolean).join('\n\n'));
      if(ok && typeof onConfirm==='function') onConfirm();
      return;
    }

    const t = document.getElementById('confirmTitle');
    const m = document.getElementById('confirmMessage');
    const bOk = document.getElementById('confirmOk');
    const bCancel = document.getElementById('confirmCancel');

    if(t) t.textContent = title || 'Potwierdź';
    if(m) m.textContent = message || '';
    if(bOk) bOk.textContent = okText;
    if(bCancel) bCancel.textContent = cancelText;

    // klasa OK
    if(bOk){
      bOk.classList.remove('btn-reset','btn-ghost','btn-new','btn-primary','btn-back');
      String(okClass||'').split(/\s+/).filter(Boolean).forEach(c=>bOk.classList.add(c));
    }

    __confirmCb = (typeof onConfirm === 'function') ? onConfirm : null;
    PH.showO('confirmOverlay');
  };

  // Back-compat
  if(typeof window.openConfirm !== 'function') window.openConfirm = (o)=>PH.openConfirm(o);
  if(typeof window.closeConfirm !== 'function') window.closeConfirm = ()=>PH.closeConfirm();

  // bind (odpornie na duplikaty)
  (function bindConfirmOnce(){
    const bOk = document.getElementById('confirmOk');
    const bCancel = document.getElementById('confirmCancel');
    if(bCancel && bCancel.dataset.phBound !== '1'){
      bCancel.addEventListener('click', () => PH.closeConfirm());
      bCancel.dataset.phBound = '1';
    }
    if(bOk && bOk.dataset.phBound !== '1'){
      bOk.addEventListener('click', () => {
        const cb = __confirmCb;
        PH.closeConfirm();
        try{ if(cb) cb(); }catch(_e){}
      });
      bOk.dataset.phBound = '1';
    }
  })();

  // =============================
  // Toast (opcjonalne)
  // =============================
  PH.toast = (msg, { ttl=1800 } = {}) => {
    const text = String(msg || '').trim();
    if(!text) return;

    let el = document.getElementById('phToast');
    if(!el){
      el = document.createElement('div');
      el.id = 'phToast';
      el.className = 'ph-toast';
      el.setAttribute('role','status');
      el.setAttribute('aria-live','polite');
      document.body.appendChild(el);
    }

    el.textContent = text;
    el.classList.add('is-on');
    try{ clearTimeout(el.__phT); }catch(_e){}
    el.__phT = setTimeout(() => { el.classList.remove('is-on'); }, Math.max(400, ttl|0));
  };

})();

/* [PH] CORE_UI_JS_END */
