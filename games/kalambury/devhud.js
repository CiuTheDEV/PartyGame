/* PartyHUB — games/kalambury/devhud.js
   DEV-only: HUD dla Kalamburów (stage + quick actions).
*/
(function(){
  const PH = (window.PH = window.PH || {});
  const DEV = PH.DEV;
  if(!DEV || !DEV.on) return;

  const game = PH.games && PH.games.kalambury ? PH.games.kalambury : null;

  
  // Kalambury: kolory linii dla data-dbg2 (DEV-only)
  try{
    if(!document.getElementById('phDevKalDbgColors')){
      const st = document.createElement('style');
      st.id = 'phDevKalDbgColors';
      st.textContent = `
        body.design-debug [data-dbg2="TOP_BAR_INNER"]{ --dbg-line: rgba(241, 196, 15, .38); }
        body.design-debug [data-dbg2="PRESENTER_UI"]{ --dbg-line: rgba(155, 89, 182, .38); }
        body.design-debug [data-dbg2="PRESENTER_CARD"]{ --dbg-line: rgba(233, 30, 99, .38); }
        body.design-debug [data-dbg2="COUNTDOWN"]{ --dbg-line: rgba(52, 152, 219, .38); }
        body.design-debug [data-dbg2="REVEAL"]{ --dbg-line: rgba(46, 204, 113, .38); }
        body.design-debug [data-dbg2="PLAYERS_INNER"]{ --dbg-line: rgba(231, 76, 60, .38); }
        body.design-debug [data-dbg2="STAGE_1"]{ --dbg-line: rgba(233, 30, 99, .42); }
        body.design-debug [data-dbg2="STAGE1_GRID"]{ --dbg-line: rgba(233, 30, 99, .32); }
        body.design-debug [data-dbg2="STAGE_2"]{ --dbg-line: rgba(52, 152, 219, .42); }
        body.design-debug [data-dbg2="STAGE2_HEAD"]{ --dbg-line: rgba(52, 152, 219, .30); }
        body.design-debug [data-dbg2="STAGE2_PRESENTER"]{ --dbg-line: rgba(155, 89, 182, .30); }
        body.design-debug [data-dbg2="PRESENTER_PILL"]{ --dbg-line: rgba(155, 89, 182, .26); }
        body.design-debug [data-dbg2="STAGE2_GRID"]{ --dbg-line: rgba(52, 152, 219, .32); }
        body.design-debug [data-dbg2="STAGE2_DRAWER"]{ --dbg-line: rgba(52, 152, 219, .26); }
        body.design-debug [data-dbg2="STAGE2_TOGGLE"]{ --dbg-line: rgba(52, 152, 219, .22); }
        body.design-debug [data-dbg2="STAGE2_META"]{ --dbg-line: rgba(241, 196, 15, .30); }
        body.design-debug [data-dbg2="STAGE2_CHIP"]{ --dbg-line: rgba(241, 196, 15, .22); }
        body.design-debug [data-dbg2="STAGE_CARD"]{ --dbg-line: rgba(255, 255, 255, .16); }
        body.design-debug [data-dbg2="HOME_CONTAINER"]{ --dbg-line: rgba(155, 89, 182, .34); }
        body.design-debug [data-dbg2="MODE_SETTINGS_CONTAINER"]{ --dbg-line: rgba(52, 152, 219, .34); }
        body.design-debug [data-dbg2="GAME_SETTINGS_CONTAINER"]{ --dbg-line: rgba(241, 196, 15, .34); }
        body.design-debug [data-dbg2="CONFIRM_CONTAINER"]{ --dbg-line: rgba(231, 76, 60, .34); }
        body.design-debug [data-dbg2="EMOJI_PICKER_CONTAINER"]{ --dbg-line: rgba(46, 204, 113, .34); }
        body.design-debug [data-dbg2="RULES_CONTAINER"]{ --dbg-line: rgba(230, 126, 34, .34); }
      `;
      document.head.appendChild(st);
    }
  }catch(_e){}

// [PH] DEVHUD_DOM_BEGIN
  const hud = document.createElement('div');
  hud.id = 'phDevHud';
  hud.className = 'ph-devhud';

  hud.innerHTML = `
    <div class="phd-head" data-dev-drag="1">
      <div class="phd-title"><span class="phd-dot" aria-hidden="true"></span><span>DEV HUD</span></div>
      <div class="phd-actions">
        <button class="phd-btn phd-btn--icon" data-dev-act="collapse" title="Zwiń/rozwiń">▾</button>
        <button class="phd-btn phd-btn--icon" data-dev-act="close" title="Ukryj HUD (F9)">✕</button>
      </div>
    </div>

    <div class="phd-body">
      <div class="phd-row">
        <button class="phd-btn phd-btn--icon" data-dev-act="outlines" title="Outlines (F6)">▦</button>
        <button class="phd-btn phd-btn--icon" data-dev-act="inspect" title="Inspector on/off">⌖</button>
        <button class="phd-btn phd-btn--icon" data-dev-act="pin" title="Pin (F7) / Alt+Click">📌</button>
        <button class="phd-btn phd-btn--icon" data-dev-act="copy" title="Copy (F8)">⧉</button>
        <button class="phd-btn" data-dev-act="copyState" title="Kopiuj state JSON">Copy state</button>
      </div>

      <div class="phd-sep"></div>

      <div class="phd-grid">
        <div class="phd-full">
          <div class="phd-muted">STAGE</div>
          <select class="phd-select" data-dev-el="stage"></select>
        </div>
        <button class="phd-btn" data-dev-act="stagePrev" title="Poprzedni stage">← stage</button>
        <button class="phd-btn" data-dev-act="stageNext" title="Następny stage">stage →</button>

        <div class="phd-full">
          <div class="phd-muted">QUICK OVERLAYS</div>
          <div class="phd-row">
            <button class="phd-btn" data-dev-open="overlayHome">Home</button>
            <button class="phd-btn" data-dev-open="overlayModeSettings">Mode</button>
            <button class="phd-btn" data-dev-open="overlayGame">Game</button>
            <button class="phd-btn" data-dev-open="globalSettingsOverlay">Settings</button>
            <button class="phd-btn" data-dev-open="rulesOverlay">Rules</button>
          </div>
        </div>

        <div class="phd-full">
          <div class="phd-muted">INSPECTOR</div>
          <div class="phd-row" style="gap:10px;align-items:flex-start">
            <span class="phd-muted" style="min-width:56px">Hover:</span>
            <span style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span data-dev-el="hover" style="font-weight:900;font-size:12px;word-break:break-word">—</span>
              <span data-dev-el="hoverSize" class="phd-muted" style="font-size:11px">—</span>
            </span>
          </div>
          <div class="phd-row" style="gap:10px;align-items:flex-start">
            <span class="phd-muted" style="min-width:56px">Pinned:</span>
            <span style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span data-dev-el="pinned" style="font-weight:900;font-size:12px;word-break:break-word">—</span>
              <span data-dev-el="pinnedSize" class="phd-muted" style="font-size:11px">—</span>
            </span>
          </div>
        </div>

        <div class="phd-full">
          <div class="phd-muted">TOOLS</div>
          <div class="phd-row">
            <button class="phd-btn" data-dev-act="persistDev" title="Zapisz dev w localStorage (na kolejne wejścia)">Persist DEV</button>
            <button class="phd-btn" data-dev-act="disableDev" title="Wyłącz dev (na kolejne wejścia)">Disable DEV</button>
            <button class="phd-btn" data-dev-act="reload" title="Odśwież stronę">Reload</button>
            <button class="phd-btn" data-dev-act="clearStorage" title="Usuń partyhub_kalambury_* z localStorage">Clear storage</button>
          </div>
        </div>

        <div class="phd-full">
          <div class="phd-muted">SKRÓTY</div>
          <div class="phd-row" style="gap:8px">
            <span class="phd-kbd">F9</span><span class="phd-muted">HUD</span>
            <span class="phd-kbd">F6</span><span class="phd-muted">Outlines</span>
            <span class="phd-kbd">F7</span><span class="phd-muted">Pin</span>
            <span class="phd-kbd">F8</span><span class="phd-muted">Copy</span>
          </div>
        </div>
      </div>
    </div>
  `;
  // [PH] DEVHUD_DOM_END

  document.body.appendChild(hud);

  const qs = (sel)=> hud.querySelector(sel);
  const qsa = (sel)=> Array.from(hud.querySelectorAll(sel));
  const elStage = qs('[data-dev-el="stage"]');
  const elHover = qs('[data-dev-el="hover"]');
  const elHoverSize = qs('[data-dev-el="hoverSize"]');
  const elPinned = qs('[data-dev-el="pinned"]');
  const elPinnedSize = qs('[data-dev-el="pinnedSize"]');

  // ===== HUD visibility (F9) =====
  DEV.onEvent('hud', (on)=> hud.classList.toggle('is-hidden', !on));

  // ===== sync toggle buttons =====
  const syncToggles = ()=>{
    const btnO = qs('[data-dev-act="outlines"]');
    const btnI = qs('[data-dev-act="inspect"]');
    const btnP = qs('[data-dev-act="pin"]');
    if(btnO) btnO.classList.toggle('is-on', !!DEV.state?.outlines);
    if(btnI) btnI.classList.toggle('is-on', !!DEV.state?.inspect);
    if(btnP) btnP.classList.toggle('is-on', !!DEV.state?.pinned);
  };
  DEV.onEvent('outlines', syncToggles);
  DEV.onEvent('inspectMode', syncToggles);
  DEV.onEvent('inspect', syncToggles);
  syncToggles();

  // ===== inspector lines =====
  // lokalne meta (żeby mieć osobno hover i pinned, niezależnie od DEV.getMeta())
  const metaOf = (el)=>{
    if(!el || !el.getBoundingClientRect) return null;
    if(el === document.body || el === document.documentElement) return null;
    const tag = String(el.tagName||'').toLowerCase();
    const id = el.id ? ('#'+el.id) : '';
    const cls = (el.classList && el.classList.length) ? ('.'+Array.from(el.classList).slice(0,8).join('.')) : '';
    const dbg = el.getAttribute && el.getAttribute('data-dbg') ? ` [${el.getAttribute('data-dbg')}]` : '';
    const dbg2 = el.getAttribute && el.getAttribute('data-dbg2') ? ` [${el.getAttribute('data-dbg2')}]` : '';
    const r = el.getBoundingClientRect();
    const size = `${Math.round(r.width)}×${Math.round(r.height)}px`;
    return { tag, id, cls, dbg, dbg2, size };
  };
  const safeLine = (m)=>{
    if(!m) return '—';
    const dbg = (m.dbg || '') + (m.dbg2 || '');
    return `${m.tag}${m.id||''}${m.cls||''}${dbg}`.trim() || '—';
  };
  const safeSize = (m)=> (m && m.size) ? `w×h: ${m.size}` : '—';

  const syncInspectLines = ()=>{
    const h = metaOf(DEV.state?.hoverEl);
    const p = (DEV.state?.pinned && DEV.state?.pinnedEl) ? metaOf(DEV.state.pinnedEl) : null;

    if(elHover) elHover.textContent = safeLine(h);
    if(elHoverSize) elHoverSize.textContent = safeSize(h);

    if(elPinned) elPinned.textContent = p ? safeLine(p) : '—';
    if(elPinnedSize) elPinnedSize.textContent = p ? safeSize(p) : '—';
  };

  DEV.onEvent('inspect', syncInspectLines);
  // init
  syncInspectLines();

  DEV.onEvent('copied', ()=>{
    hud.classList.add('is-copied');
    setTimeout(()=>hud.classList.remove('is-copied'), 650);
  });

  // ===== stage dropdown =====
  const getStageList = ()=>{
    const list = (game && typeof game.getStageList === 'function') ? game.getStageList() : [
      { id:'idle', label:'IDLE' },
      { id:'stage1', label:'STAGE 1' },
      { id:'stage2', label:'STAGE 2' }
    ];
    return Array.isArray(list) ? list : [];
  };

  const getStage = ()=> (game && typeof game.getStage === 'function') ? game.getStage() : null;

  const setStage = (id)=>{
    if(game && typeof game.setStage === 'function') return game.setStage(id);
    // fallback: jeśli ktoś zostawił global setGameStage
    try{ if(typeof window.setGameStage === 'function') window.setGameStage(id); }catch(_e){}
  };

  const fillStage = ()=>{
    if(!elStage) return;
    const list = getStageList();
    elStage.innerHTML = list.map(s=>`<option value="${s.id}">${s.label}</option>`).join('');
    const cur = getStage();
    if(cur) elStage.value = cur;
  };

  fillStage();

  // auto-sync stage dropdown with real game stage
  const syncStage = (forceStage)=>{
    if(!elStage) return;
    const cur = forceStage || getStage();
    if(!cur) return;
    // jeśli stage nie istnieje w opcjach (np. zmieniono listę) — odśwież
    if(!Array.from(elStage.options).some(o=>o.value===cur)) fillStage();
    try{ elStage.value = cur; }catch(_e){}
  };

  // game -> HUD (np. klik "Dalej" na planszy)
  window.addEventListener('ph:kalambury:stage', (e)=>{
    const s = e && e.detail && e.detail.stage ? String(e.detail.stage) : '';
    if(s) syncStage(s);
    else syncStage();
  });

  // gdy HUD się pokazuje (F9) — dociągnij aktualny stage
  DEV.onEvent('hud', (on)=>{ if(on) syncStage(); });

  if(elStage){
    elStage.addEventListener('change', ()=> setStage(elStage.value));
  }

  const stepStage = (dir)=>{
    const list = getStageList();
    const cur = getStage();
    const idx = Math.max(0, list.findIndex(s=>s.id===cur));
    const next = list[(idx + dir + list.length) % list.length];
    if(next) setStage(next.id);
    if(elStage && next) elStage.value = next.id;
  };

  // ===== quick overlay buttons =====
  hud.addEventListener('click', (e)=>{
    const b = e.target.closest('button');
    if(!b) return;

    // overlay open
    const ov = b.getAttribute('data-dev-open');
    if(ov){
      try{ if(PH.showO) PH.showO(ov); else if(typeof window.showO==='function') window.showO(ov); }catch(_e){}
      return;
    }

    const act = b.getAttribute('data-dev-act');
    if(!act) return;

    if(act === 'collapse'){ hud.classList.toggle('is-collapsed'); return; }
    if(act === 'close'){ DEV.toggleHudOpen(false); return; }
    if(act === 'outlines'){ DEV.toggleOutlines(); return; }
    if(act === 'inspect'){ DEV.toggleInspect(); return; }
    if(act === 'pin'){ DEV.togglePin(); return; }
    if(act === 'copy'){ DEV.copy(); return; }

    if(act === 'stagePrev'){ stepStage(-1); return; }
    if(act === 'stageNext'){ stepStage(+1); return; }

    if(act === 'copyState'){
      if(game && typeof game.copyState === 'function') return game.copyState();
      if(game && typeof game.getState === 'function'){
        const payload = JSON.stringify(game.getState(), null, 2);
        return PH.copyText ? PH.copyText(payload) : navigator.clipboard.writeText(payload);
      }
      return;
    }

    if(act === 'clearStorage'){
      if(game && typeof game.clearStorage === 'function'){ game.clearStorage('partyhub_kalambury_'); return; }
      if(PH.storage && typeof PH.storage.removeByPrefix === 'function') PH.storage.removeByPrefix('partyhub_kalambury_');
      return;
    }

    if(act === 'reload'){ try{ location.reload(); }catch(_e){} return; }

    if(act === 'persistDev'){ try{ localStorage.setItem('partyhub_kalambury_dev','1'); localStorage.removeItem('dev'); }catch(_e){}; return; }
    if(act === 'disableDev'){ try{ localStorage.removeItem('partyhub_kalambury_dev'); localStorage.removeItem('partyhub_dev'); localStorage.removeItem('dev'); }catch(_e){}; return; }
  });

  // ===== draggable + persist pos =====
  const POS_KEY = 'partyhub_kalambury_devhud_pos_v1';
  const clamp = (v,a,b)=>Math.min(b, Math.max(a, v));

  const applyPos = (x,y,{save=true}={})=>{
    const r = hud.getBoundingClientRect();
    const pad = 10;
    const maxX = Math.max(pad, window.innerWidth - r.width - pad);
    const maxY = Math.max(pad, window.innerHeight - r.height - pad);
    const nx = clamp(x, pad, maxX);
    const ny = clamp(y, pad, maxY);
    hud.style.left = Math.round(nx) + 'px';
    hud.style.top = Math.round(ny) + 'px';
    hud.style.right = 'auto';
    hud.style.bottom = 'auto';
    if(save){
      try{ localStorage.setItem(POS_KEY, JSON.stringify({ x:nx, y:ny })); }catch(_e){}
    }
  };

  (function restorePos(){
    try{
      const raw = localStorage.getItem(POS_KEY);
      if(!raw) return;
      const p = JSON.parse(raw);
      if(p && Number.isFinite(p.x) && Number.isFinite(p.y)) applyPos(p.x, p.y, { save:false });
    }catch(_e){}
  })();

  let drag = null;
  const head = qs('.phd-head');
  if(head){
    head.addEventListener('pointerdown', (e)=>{
      if(e.button !== 0) return;
      if(e.target && e.target.closest && e.target.closest('button')) return;
      const r = hud.getBoundingClientRect();
      // inicjalizuj w px
      if(!hud.style.left || !hud.style.top) applyPos(r.left, r.top, { save:false });
      const baseL = parseFloat(hud.style.left) || r.left;
      const baseT = parseFloat(hud.style.top) || r.top;
      drag = { id:e.pointerId, sx:e.clientX, sy:e.clientY, bl:baseL, bt:baseT };
      hud.classList.add('dragging');
      try{ hud.setPointerCapture(e.pointerId); }catch(_e){}
      e.preventDefault();
    });
    head.addEventListener('pointermove', (e)=>{
      if(!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      applyPos(drag.bl + dx, drag.bt + dy, { save:false });
      e.preventDefault();
    });
    const end = (e)=>{
      if(!drag || e.pointerId !== drag.id) return;
      const r = hud.getBoundingClientRect();
      applyPos(r.left, r.top, { save:true });
      drag = null;
      hud.classList.remove('dragging');
      try{ hud.releasePointerCapture(e.pointerId); }catch(_e){}
      e.preventDefault();
    };
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
  }

  window.addEventListener('resize', ()=>{
    try{
      const r = hud.getBoundingClientRect();
      applyPos(r.left, r.top, { save:false });
    }catch(_e){}
  });

  // init HUD open state
  hud.classList.toggle('is-hidden', !DEV.state?.hudOpen);
})();
