/* PartyHUB — core/dev.js
   DEV-only: inspector + design-debug toggles + keybinds.
   Ładowane tylko gdy ?dev=1 / ?dbg=1 / localStorage.partyhub_kalambury_dev=1 / localStorage.partyhub_dev=1.
*/
(function(){
  const PH = (window.PH = window.PH || {});
  const DEV = (PH.DEV = PH.DEV || {});

  // [PH] DEV_STATE_BEGIN
  const state = DEV.state = DEV.state || {
    on: true,
    inspect: true,
    outlines: true,
    hudOpen: true,
    pinned: false,
    pinnedEl: null,
    hoverEl: null
  };
  DEV.on = true;
  // [PH] DEV_STATE_END

  // ===== tiny event bus (devhud.js może się podpiąć) =====
  const listeners = DEV._listeners = DEV._listeners || {};
  DEV.onEvent = (name, cb) => {
    if(typeof cb !== 'function') return ()=>{};
    (listeners[name] = listeners[name] || []).push(cb);
    return ()=>{ listeners[name] = (listeners[name] || []).filter(x=>x!==cb); };
  };
  DEV.emit = (name, payload) => {
    (listeners[name] || []).forEach(fn=>{ try{ fn(payload); }catch(_e){} });
  };

  const isTypingTarget = (el)=>{
    if(!el) return false;
    const tag = String(el.tagName||'').toLowerCase();
    if(tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    return !!el.isContentEditable;
  };

  // ===== dev prefs =====
  const PREF_KEY = 'partyhub_dev_prefs_v1';
  const readPrefs = ()=>{
    try{
      const raw = localStorage.getItem(PREF_KEY);
      if(!raw) return null;
      const p = JSON.parse(raw);
      return (p && typeof p==='object') ? p : null;
    }catch(_e){}
    return null;
  };
  const writePrefs = (patch)=>{
    try{
      const base = readPrefs() || {};
      const next = Object.assign({}, base, patch || {});
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
      return true;
    }catch(_e){}
    return false;
  };

  // init from URL
  try{
    const qs = new URLSearchParams(location.search);
    if(qs.get('dbg') === '1') state.outlines = true;
    if(qs.get('inspect') === '0') state.inspect = false;
  }catch(_e){}

  // init from saved prefs
  const saved = readPrefs();
  if(saved){
    if(typeof saved.inspect === 'boolean') state.inspect = saved.inspect;
    if(typeof saved.outlines === 'boolean') state.outlines = saved.outlines;
    if(typeof saved.hudOpen === 'boolean') state.hudOpen = saved.hudOpen;
  }

  const applyBodyClasses = ()=>{
    document.body.classList.toggle('design-debug', !!state.outlines);
    document.body.classList.toggle('ph-dev-inspect', !!state.inspect);
  };

  // ===== inspector highlight box =====
  const box = document.createElement('div');
  box.id = 'phDevBox';
  box.className = 'ph-dev-box';
  document.addEventListener('DOMContentLoaded', ()=>{
    if(!document.getElementById('phDevBox')) document.body.appendChild(box);
  });
  // Jeśli DOM już gotowy:
  try{ if(document.body && !document.getElementById('phDevBox')) document.body.appendChild(box); }catch(_e){}

  const setBoxTo = (el)=>{
    if(!el || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect();
    const w = Math.max(0, Math.round(r.width));
    const h = Math.max(0, Math.round(r.height));
    box.style.width = w + 'px';
    box.style.height = h + 'px';
    box.style.transform = `translate(${Math.round(r.left)}px,${Math.round(r.top)}px)`;
  };

  // ===== debug tag offsets (data-dbg/data-dbg2) =====
  const STEP_Y = 18;
  const applyTagOffsets = ()=>{
    const on = document.body.classList.contains('design-debug');
    const els = document.querySelectorAll('[data-dbg],[data-dbg2]');
    els.forEach(el=>{
      if(!on){
        el.style.removeProperty('--dbgTagShiftY');
        return;
      }
      let depth = 0;
      let p = el.parentElement;
      while(p){
        if(p.hasAttribute('data-dbg') || p.hasAttribute('data-dbg2')) depth++;
        p = p.parentElement;
      }
      el.style.setProperty('--dbgTagShiftY', (depth * STEP_Y) + 'px');
    });
  };

  const mo = new MutationObserver(()=>applyTagOffsets());
  try{ mo.observe(document.documentElement, { attributes:true, subtree:true, attributeFilter:['class'] }); }catch(_e){}

  // ===== inspector picking =====
  const pick = (t)=>{
    if(!t) return null;
    const el = (t.nodeType === 1) ? t : t.parentElement;
    if(!el) return null;

    // nie inspektuj dev HUD / box
    if(el.closest && (el.closest('#phDevHud') || el.closest('#phDevBox'))) return null;

    const sel = [
      '[data-dbg2]','[data-dbg]',
      '.player-pill','.player-row','.mode-card','.setting-card',
      '.overlay','.modal','.panel',
      'button','input','select','textarea','label'
    ].join(',');
    const best = (el.closest && el.closest(sel)) ? el.closest(sel) : el;
    if(!best || best === document.body || best === document.documentElement) return null;
    return best;
  };

  const getElMeta = (el)=>{
    if(!el || el === document.body || el === document.documentElement) return null;
    const tag = String(el.tagName||'').toLowerCase();
    const id = el.id ? ('#' + el.id) : '';
    const cls = (el.classList && el.classList.length) ? ('.' + Array.from(el.classList).slice(0,8).join('.')) : '';
    const dbg = (el.getAttribute && el.getAttribute('data-dbg')) ? ` [${el.getAttribute('data-dbg')}]` : '';
    const dbg2 = (el.getAttribute && el.getAttribute('data-dbg2')) ? ` [${el.getAttribute('data-dbg2')}]` : '';
    const r = el.getBoundingClientRect ? el.getBoundingClientRect() : { width:0, height:0 };
    const size = `${Math.round(r.width)}×${Math.round(r.height)}px`;
    const classes = (el.classList && el.classList.length) ? Array.from(el.classList).map(c=>'.'+c).join(' ') : '(brak)';
    return { el, tag, id, cls, dbg, dbg2, size, classes };
  };

  DEV.getMeta = ()=> getElMeta(state.pinned ? state.pinnedEl : (state.hoverEl || null));

  DEV.getCopyText = ()=>{
    const m = DEV.getMeta();
    if(!m) return '';
    const extra = [m.dbg.trim()||null, m.dbg2.trim()||null].filter(Boolean).join(' ');
    return `TAG:<${m.tag}> | ID:${m.id||'(brak)'} | CLASS:${m.classes} | SIZE:${m.size}${extra ? (' | '+extra.replace(/^\s+|\s+$/g,'')) : ''}`;
  };

  DEV.copy = async ()=>{
    const txt = DEV.getCopyText();
    if(!txt) return false;
    const ok = PH.copyText ? (await PH.copyText(txt)) : (await navigator.clipboard.writeText(txt).then(()=>true, ()=>false));
    DEV.emit('copied', { ok, text: txt });
    return ok;
  };

  DEV.togglePin = ()=>{
    if(state.pinned){
      state.pinned = false;
      state.pinnedEl = null;
      DEV.emit('inspect', DEV.getMeta());
      return false;
    }
    const h = state.hoverEl;
    if(h){
      state.pinned = true;
      state.pinnedEl = h;
      DEV.emit('inspect', DEV.getMeta());
      return true;
    }
    return false;
  };

  DEV.setPinned = (el)=>{
    state.pinned = !!el;
    state.pinnedEl = el || null;
    DEV.emit('inspect', DEV.getMeta());
  };

  DEV.toggleOutlines = (force)=>{
    state.outlines = (typeof force === 'boolean') ? force : !state.outlines;
    writePrefs({ outlines: state.outlines });
    applyBodyClasses();
    applyTagOffsets();
    DEV.emit('outlines', state.outlines);
    return state.outlines;
  };

  DEV.toggleInspect = (force)=>{
    state.inspect = (typeof force === 'boolean') ? force : !state.inspect;
    writePrefs({ inspect: state.inspect });
    applyBodyClasses();
    DEV.emit('inspectMode', state.inspect);
    return state.inspect;
  };

  DEV.toggleHudOpen = (force)=>{
    state.hudOpen = (typeof force === 'boolean') ? force : !state.hudOpen;
    writePrefs({ hudOpen: state.hudOpen });
    DEV.emit('hud', state.hudOpen);
    return state.hudOpen;
  };

  // ===== events =====
  const updateHover = (t)=>{
    if(!state.inspect) return;
    if(state.pinned) return;
    const el = pick(t);
    if(!el || el === state.hoverEl) return;
    state.hoverEl = el;
    DEV.emit('inspect', DEV.getMeta());
  };

  document.addEventListener('pointermove', (e)=>updateHover(e.target), true);
  document.addEventListener('pointerover', (e)=>updateHover(e.target), true);

  // click-to-pin (Alt+Click)
  document.addEventListener('pointerdown', (e)=>{
    if(!state.inspect) return;
    if(!e.altKey) return;
    const el = pick(e.target);
    if(!el) return;
    state.pinned = true;
    state.pinnedEl = el;
    DEV.emit('inspect', DEV.getMeta());
  }, true);

  // highlight box RAF
  let raf = 0;
  const tick = ()=>{
    raf = 0;
    if(!state.inspect) return;
    const el = state.pinned ? state.pinnedEl : state.hoverEl;
    if(!el) return;
    setBoxTo(el);
  };
  DEV.onEvent('inspect', ()=>{ if(!raf) raf = requestAnimationFrame(tick); });
  window.addEventListener('resize', ()=>{ if(!raf) raf = requestAnimationFrame(tick); });

  // keybinds
  window.addEventListener('keydown', (e)=>{
    const code = e.code || '';
    if(isTypingTarget(document.activeElement) && !['F6','F7','F8','F9'].includes(code)) return;

    if(code === 'F9'){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      DEV.toggleHudOpen();
      return;
    }
    if(code === 'F6'){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      DEV.toggleOutlines();
      return;
    }
    if(code === 'F7'){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      DEV.togglePin();
      return;
    }
    if(code === 'F8'){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      DEV.copy();
      return;
    }
  }, true);

  // init
  applyBodyClasses();
  applyTagOffsets();
  DEV.emit('hud', state.hudOpen);
  DEV.emit('outlines', state.outlines);
  DEV.emit('inspectMode', state.inspect);
})();
