/* PartyHUB — Kalambury (logika gry) */

// ANCHOR: VERSION
    const GAME_VERSION = 'beta 1.0';

    // ANCHOR: CFG_CONSTANTS
    const TURN_STEPS = [15,30,45,60,75,90,120,0]; // 0 => no limit
    const SCORE_STEPS = [8,10,12,14,16,18,20,0]; // 0 => no limit
    const ROUNDS_STEPS = [1,2,3,4,5,6,7,0]; // 0 => no limit
    const REFRESH_STEPS = [1,2,3,4,5,6,7,0]; // 0 => no limit

    // ANCHOR: WIN_CONDITION (czy gramy na punkty czy na rundy)
    const normWinBy = (v) => (String(v||'') === 'score') ? 'score' : 'rounds';

    // ANCHOR: PRESENT_ORDER (kolejność prezentowania)
    const normPresentOrder = (v) => (String(v||'') === 'guesser') ? 'guesser' : 'sequential';

    // ANCHOR: STATE_MACHINE
    const state = {
      selectedMode: null,
      cfg: { classic: {winBy:'rounds', presentOrder:'sequential', turnSeconds: 90, targetScore: 12, roundsTotal: 3, categories: [], hintsOn:true, hintWords:true, hintCategory:true, refreshOn:false, refreshCount: 2} },
      settings: { soundOn: true, motionOn: true }, // ANCHOR: SETTINGS_STATE

      // ANCHOR: GAME_STAGE_STATE (etap planszy — głównie do dev-skipowania etapów)
      game: { stage:'idle', rolling:false, orderIds:[], orderPos:{}, focusId:null, layoutIds:[], forceDeck:false, presenterIdx:0, baseLastIdx:0, baseNextIdx:1, roundNo:1, turnsDone:0, stage2GridOpen:false, turn:{ phase:null, endAt:0, word:'', catId:'', catLabel:'', presenterId:'' } }
    };

    // ANCHOR: PLAYERS_STATE (musi być przed jakimkolwiek użyciem — TDZ fix)
    let players = [];              // [{id,name,emoji,score}]
    let draftPlayer = null;        // roboczy obiekt w pickerze
    let emojiPickerForId = null;   // id gracza edytowanego (null = nowy)
    let tempSelectedEmoji = null;  // emoji zaznaczone w pickerze

    // ANCHOR: UNIQUE_PLAYER_NAMES
    const normName = (s) => String(s||'').trim().replace(/\s+/g,' ').toLowerCase();

    // ANCHOR: DOM_REFS
    const $ = (id) => document.getElementById(id);


    // ANCHOR: GAME_OVERLAY_REFS
    // Na razie: tylko pusty overlay #overlayGame (bez elementów wewnętrznych).


    // ANCHOR: TWEMOJI (TEST)
    function applyTwemoji(root){
      if(!root || !window.twemoji) return;
      window.twemoji.parse(root, { folder:'svg', ext:'.svg' });
    }

    // ANCHOR: FIT_TEXT (skalowanie nazw graczy do pola — długie nazwy nie wychodzą poza kafel)
    let __fitT = 0;

    function fitTextToBox(el, minPx=12){
      if(!el) return;
      // reset do CSS (responsywne clamp)
      el.style.fontSize = '';
      const cw = el.clientWidth;
      if(cw <= 0) return;
      const sw = el.scrollWidth;
      if(sw <= cw) return;

      const base = parseFloat(getComputedStyle(el).fontSize) || 16;
      const ratio = cw / sw;
      const target = Math.max(minPx, Math.floor(base * ratio * 0.98));
      if(target < base) el.style.fontSize = target + 'px';
    }

    function fitAllPlayerNames(){
      // Po wycięciu planszy gry zostawiamy tylko dopasowanie nazw w menu/ustawieniach.
      document.querySelectorAll('.player-name-display').forEach(el=>fitTextToBox(el, 12));
    }

    function scheduleFitNames(){
      clearTimeout(__fitT);
      __fitT = setTimeout(fitAllPlayerNames, 60);
    }

    window.addEventListener('resize', scheduleFitNames);

    // ANCHOR: TWEMOJI_READY (bez przerabiania całego UI — tylko avatary)
    function whenTwemojiReady(cb){
      if(window.twemoji) return cb();
      let tries = 0;
      const t = setInterval(()=>{
        tries++;
        if(window.twemoji){ clearInterval(t); cb(); }
        else if(tries >= 80) clearInterval(t); // ~4s
      }, 50);
    }

    // ANCHOR: DOM_CACHE
    const overlayHome = $('overlayHome');
    const overlayModeSettings = $('overlayModeSettings');
    const overlayGame = $('overlayGame');

    // ANCHOR: INLINE_FREE_REFS
    const btnRulesOk = $('btnRulesOk');
    const btnGlobalSettingsClose = $('btnGlobalSettingsClose');
    const btnEmojiCancel = $('btnEmojiCancel');
    const emojiTabs = $('emojiTabs');
    const emojiPickerNameInput = $('emojiPickerNameInput');

    const btnBackToHome = $('btnBackToHome');
    const btnStartGame = $('btnStartGame');

    const btnBackToHub = $('btnBackToHub');
    const btnGlobalSettings = $('btnGlobalSettings');
    const btnGameSettings = $('btnGameSettings');
    const topTitle = $('topTitle');
    const gameHud = $('gameHud');
    const bottomBar = $('bottomBar');

    // ANCHOR: GAME_SETTINGS_REFS (ustawienia na planszy)
    const soundToggleGame = $('soundToggleGame');
    const btnGameSettingsClose = $('btnGameSettingsClose');
    const btnGameExitToMenu = $('btnGameExitToMenu');

    // ANCHOR: GAME_SETTINGS_REFS_REMOVED (plansza gry wycięta)



    // ANCHOR: GLOBAL_SETTINGS_REFS
    const txtVersion = $('txtVersion');
    const homeVersion = $('homeVersion');
    const soundToggle = $('soundToggle');
    const motionToggle = $('motionToggle');
    const btnClearData = $('btnClearData');
    // ANCHOR: CONFIRM_UI_REFS (moved to core/ui.js)
    // ANCHOR: POPUPS_API (moved to core/ui.js)
    const showO = (idOrEl) => (window.showO ? window.showO(idOrEl) : null);
    const hideO = (idOrEl) => (window.hideO ? window.hideO(idOrEl) : null);
    const toggleO = (idOrEl, force) => (window.toggleO ? window.toggleO(idOrEl, force) : false);
    const isVisible = (idOrEl) => (window.isVisible ? window.isVisible(idOrEl) : false);

    // [PH] RULES_OVERLAY_OPEN_BEGIN
    function openRulesOverlay(){
      const el = $('rulesOverlay');
      if(!el) return;
      el.classList.add('is-visible');
    }
    // [PH] RULES_OVERLAY_OPEN_END


    // ANCHOR: CONFIRM_API (moved to core/ui.js)
    const openConfirm = (opts) => (window.openConfirm ? window.openConfirm(opts) : null);
    const closeConfirm = () => (window.closeConfirm ? window.closeConfirm() : null);
    // ANCHOR: MODE_SETTINGS_REFS
    const cfgTurnSeconds = $('cfgTurnSeconds');
    const turnSecondsBadge = $('turnSecondsBadge');
    const cfgTargetScore = $('cfgTargetScore');
    const targetScoreBadge = $('targetScoreBadge');
    const cfgRoundsTotal = $('cfgRoundsTotal');
    const roundsTotalBadge = $('roundsTotalBadge');
    const cfgRefreshCount = $('cfgRefreshCount');
    const refreshCountBadge = $('refreshCountBadge');
    const addPlayerBtn = $('addPlayerBtn');
    const playersSummary = $('playersSummary');
    const playersLimit = $('playersLimit');
    const roundSummary = $('roundSummary');
    const cardModeSettings = $('cardModeSettings');
    const modeSettingsSummary = $('modeSettingsSummary');
    const rowTargetScore = $('rowTargetScore');
    const rowRoundsTotal = $('rowRoundsTotal');
    const rowHintsMaster = $('rowHintsMaster');
    const rowHintsTypes = $('rowHintsTypes');
    const rowPresentOrder = $('rowPresentOrder');
    const rowRefreshMaster = $('rowRefreshMaster');
    const rowRefreshCount = $('rowRefreshCount');
// ANCHOR: CATEGORIES_REFS
    const catsGrid = $('catsGrid');
    const catsSummary = $('catsSummary');
    const catsCount = $('catsCount');
    const btnCatsAll = $('btnCatsAll');
    const btnCatsRandom = $('btnCatsRandom');
    const btnCatsNone = $('btnCatsNone');

    // ANCHOR: SETTINGS_CARDS_REFS
    const modeSettingsCards = $('modeSettingsCards');

    // ANCHOR: OVERLAY_NAV

    // ANCHOR: OVERLAY_NAV
    function showOverlay(el){
      // trzymamy porządek: zamknij popupy zanim przełączysz ekran
      closeConfirm();
      hideGameSettings();
      hideGlobalSettings();
      hideO('rulesOverlay');

      // Jeśli picker jest otwarty, zamykamy go "bezpiecznie" (czyści draft i stan)
      const ep = $('emojiPickerOverlay');
      if(ep && ep.classList.contains('is-visible')) cancelEmojiPicker();

      // Ukryj WSZYSTKIE overlaye (menu / ustawienia trybu / popupy)
      document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('is-visible'));

      // Pokaż docelowy ekran
      if(el) el.classList.add('is-visible');
    }




    // ANCHOR: BACK_TO_MENU_CONFIRM (Powrót do menu kończy grę i resetuje punkty)
    function resetPlayersScores(){
      if(!Array.isArray(players)) return;
      players.forEach(p=>{ if(p) p.score = 0; });
      try{ saveMode(); }catch(_e){}
    }

    function resetMatchProgress(){
      try{ clearStage1Timers(); }catch(_e){}
      try{ clearStage3Timers(); }catch(_e){}
      try{ resetStage1OrderState(); }catch(_e){}
      try{ reshuffleStage1Layout(); }catch(_e){}

      if(state && state.game){
        state.game.rolling = false;
        state.game.focusId = null;
        state.game.forceDeck = false;
        state.game.presenterIdx = 0;
        state.game.roundNo = 1;
        state.game.stage2GridOpen = false;
        state.game.gameOver = null;

      // [PH] Refresh hasła per gracz / mecz
      try{ initRefreshById(); }catch(_e){ state.game.refreshById = {}; }
        state.game.turn = { phase:null, endAt:0, word:'', catId:'', catLabel:'', presenterId:'', verdict:'', verdictAt:0, guesserId:'', presenterPoint:false, lastStop:null };
      }
    }

    function exitToMenuConfirmed(){
      resetMatchProgress();
      resetPlayersScores();
      try{ setStage('idle', { persist:false }); }catch(_e){}
      showOverlay(overlayHome);
    }

    function requestExitToMenu(){
      openConfirm({
        title:'Wrócić do menu?',
        message:'Powrót do menu zakończy rozgrywkę i zresetuje punkty. Kontynuować?',
        okText:'Wróć do menu',
        cancelText:'Zostań',
        okClass:'btn-reset',
        onConfirm: exitToMenuConfirmed
      });
    }
    // ANCHOR: OVERLAY_CLOSE (Esc + klik poza okno)
    // isVisible() z core/ui.js

    function closeTopOverlay(){
      if(isVisible('confirmOverlay')) return closeConfirm();
      if(isVisible('emojiPickerOverlay')) return cancelEmojiPicker();
      if(isVisible('gameSettingsOverlay')) return hideGameSettings();
      if(isVisible('globalSettingsOverlay')) return hideGlobalSettings();
      if(isVisible('rulesOverlay')) return hideO('rulesOverlay');
      if(overlayModeSettings && overlayModeSettings.classList.contains('is-visible')) return backToHome();
    }


    // ANCHOR: ACTION_DELEGATION (1 listener + data-action)
    const ACTIONS = {
      // STAGE 1: tylko 1 losowanie (bez rerolla) + auto przejście do Stage 2
      'stage1:roll': () => {
        if(state?.game?.rolling) return;
        if(state?.game?.stage1Locked) return;
        rollStage1Order();
      },
      'stage2:back': () => setStage('stage1'),
      'stage2:startTurn': () => stage3Start(),
      'stage3:start': () => stage3Start(),
      // [PH][S3] Rozdzielamy „pomiń odliczanie” od „odśwież hasło” (refresh per gracz)
      'stage3:skipCountdown': () => stage3SkipCountdown(),
      'stage3:refresh': () => stage3RefreshWord(),
      // legacy alias (gdyby gdzieś został)
      'stage3:skip': () => stage3SkipCountdown(),
      'stage3:stop': () => stage3Stop('manual'),
      'stage3:yes': () => stage3Verdict(true),
      'stage3:no':  () => stage3Verdict(false),
      'stage4:back': () => stage4Back(),
      'stage4:pickGuesser': (el) => stage4SetGuesser(el?.getAttribute('data-player-id')),
      'stage4:togglePresenterPoint': () => stage4TogglePresenterPoint(),
      'stage4:save': () => stage4Save(),
      'stage5:nextRound': () => stage5NextRound(),
      'stage5:menu': () => stage5BackToMenu(),
      'stage2:toggleGrid': (btn) => {
        const drawer = gameHud ? gameHud.querySelector('.stage2-sheet, .stage2-drawer') : null;
        if(!drawer) return;
        const isOpen = drawer.classList.toggle('is-open');
        const card = drawer.closest('.stage-card');
        if(card) card.classList.toggle('stage2-sheet-open', isOpen);
        if(state && state.game) state.game.stage2GridOpen = isOpen;
        if(btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
    };

    function handleAction(action, el){
      const fn = ACTIONS[action];
      if(typeof fn === 'function') fn(el);
    }

    document.addEventListener('click', (e)=>{
      const el = e.target.closest('[data-action]');
      if(!el || el.disabled) return;
      handleAction(el.dataset.action, el);
    });


    window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeTopOverlay(); });

    
    ['rulesOverlay','gameSettingsOverlay','globalSettingsOverlay','confirmOverlay','emojiPickerOverlay'].forEach(id=>{
      const el = $(id);
      if(!el) return;
      el.addEventListener('click', (e)=>{
        if(e.target !== el) return;
        if(id === 'emojiPickerOverlay') return cancelEmojiPicker();
        if(id === 'confirmOverlay') return closeConfirm();
        if(id === 'gameSettingsOverlay') return hideGameSettings();
        if(id === 'globalSettingsOverlay') return hideGlobalSettings();
        hideO(id);
      });
    });

    // ANCHOR: TOP_BAR_META_SYNC (Stage 2 info w TOP_BAR)
    function syncTopBarMeta(){
      const host = $('topStageMeta');
      if(!host) return;
      const isS2 = !!(state && state.game && state.game.stage === 'stage2');
      host.classList.toggle('is-hidden', !isS2);
      if(!isS2){ host.innerHTML = ''; return; }
      host.innerHTML = (state && state.game && state.game.topBarMetaHtml) ? state.game.topBarMetaHtml : '';
    }

        // ANCHOR: STAGES (state machine)
    const STAGES = {
      idle: {
        title:'',
        render: ()=>{ if(!gameHud) return; gameHud.innerHTML = ''; renderBottomBar(); }
      },
      stage1: {
        // TOP BAR — etykieta fazy (czytelna na TV)
        title:'FAZA LOSOWANIA',
        exit: ()=>{ try{ clearStage1Timers(); }catch(_e){}; if(state && state.game){ state.game.rolling=false; state.game.focusId=null; } },
        render: ()=>{
          if(!gameHud) return;
          gameHud.innerHTML = tplStage1();
          applyTwemoji(gameHud);

          // deck na wejściu (dopóki nie zacznie się losowanie)
          const grid = getStage1Grid();
          const anyPicked = !!(state && state.game && Array.isArray(state.game.orderIds) && state.game.orderIds.length);
          const forceDeck = !!(state && state.game && state.game.forceDeck);
          if(grid){
            if(forceDeck) grid.classList.add('is-deck');
            else grid.classList.toggle('is-deck', !anyPicked && !(state && state.game && state.game.rolling));
          }
          renderBottomBar();
        }
      },
      stage2: {
        // TOP BAR — etykieta fazy (czytelna na TV)
        title:'FAZA PRZYGOTOWANIA',
        render: ()=>{ if(!gameHud) return; gameHud.innerHTML = tplStage2(); applyTwemoji(gameHud); renderBottomBar(); }
      },
      stage3: {
        // TOP BAR — etykieta fazy (czytelna na TV)
        title:'FAZA PREZENTOWANIA',
        exit: ()=>{ try{ clearStage3Timers(); }catch(_e){} },
        render: ()=>{ if(!gameHud) return; gameHud.innerHTML = tplStage3(); applyTwemoji(gameHud); renderBottomBar(); },
        enter: ()=>{ try{ stage3EnsureTick(); }catch(_e){} }
      },
      stage4: {
        // TOP BAR — etykieta fazy (roboczo; Stage 4 dopracujemy)
        title:'FAZA OCENY',
        render: ()=>{ if(!gameHud) return; gameHud.innerHTML = tplStage4(); applyTwemoji(gameHud); renderBottomBar(); }
      },
      stage5: {
        title:'PODSUMOWANIE',
        render: ()=>{ if(!gameHud) return; gameHud.innerHTML = tplStage5(); applyTwemoji(gameHud); renderBottomBar(); }
      }
    };

    // [PH] STAGE_META (labels dla DEV HUD)
const STAGE_META = [
  { id:'idle', label:'IDLE' },
  { id:'stage1', label:'STAGE 1 — Losowanie' },
  { id:'stage2', label:'STAGE 2 — Przygotowanie' },
  { id:'stage3', label:'STAGE 3 — Prezentowanie' },
  { id:'stage4', label:'STAGE 4 — Ocena' },
  { id:'stage5', label:'STAGE 5 — Podsumowanie' }
];

// ANCHOR: STAGE_SET (dev + stage flow)
    function setStage(stageId, { persist=true }={}){
      const id = (STAGES && STAGES[stageId]) ? stageId : 'idle';
      const prev = (state && state.game && state.game.stage) ? state.game.stage : 'idle';
      STAGES[prev]?.exit?.();

      state.game.stage = id;
      if(id === 'stage2') state.game.stage2GridOpen = false;
      if(gameHud) gameHud.setAttribute('data-stage', id);

      if(topTitle){
        const t = (STAGES[id] && STAGES[id].title) ? STAGES[id].title : '';
        topTitle.textContent = t;
        topTitle.classList.toggle('is-hidden', !t);
      }

      if(persist){ try{ sessionStorage.setItem('partyhub_kalambury_dev_stage', id); }catch(_e){} }

      renderGameStage();
      STAGES[id]?.enter?.();

      // [PH] DEV_STAGE_EVENT — sync DEV HUD z realnym stage (auto update select)
      try{
        window.dispatchEvent(new CustomEvent('ph:kalambury:stage', { detail:{ stage:id, prev } }));
      }catch(_e){}
    }

    // backwards-compat (legacy)
    function setGameStage(stageId, opts){ return setStage(stageId, opts); }


// [PH] DEV_GAME_API — kontrakt dla games/kalambury/devhud.js
(function exposeKalamburyApi(){
  const PH = (window.PH = window.PH || {});
  PH.games = PH.games || {};
  const api = (PH.games.kalambury = PH.games.kalambury || {});

  api.getStageList = ()=> (Array.isArray(STAGE_META) ? STAGE_META.slice() : Object.keys(STAGES||{}).map(id=>({ id, label:id.toUpperCase() })));
  api.getStage = ()=> (state && state.game && state.game.stage) ? state.game.stage : 'idle';
  api.setStage = (id, opts)=> setStage(id, opts);

  api.getState = ()=>{
    const snap = {
      version: (typeof GAME_VERSION !== 'undefined') ? GAME_VERSION : '',
      stage: api.getStage(),
      settings: (state && state.settings) ? { ...state.settings } : {},
      cfg: (state && state.cfg) ? JSON.parse(JSON.stringify(state.cfg)) : {},
      game: (state && state.game) ? JSON.parse(JSON.stringify(state.game)) : {},
      players: (typeof players !== 'undefined' && Array.isArray(players)) ? JSON.parse(JSON.stringify(players)) : []
    };
    return snap;
  };

  api.copyState = async ()=>{
    const txt = JSON.stringify(api.getState(), null, 2);
    if(typeof PH.copyText === 'function'){
      try{ await PH.copyText(txt); return true; }catch(_e){}
    }
    try{ await navigator.clipboard.writeText(txt); return true; }catch(_e){}
    return false;
  };

  api.clearStorage = ()=>{
    try{
      if(PH.storage && typeof PH.storage.removeByPrefix === 'function'){
        PH.storage.removeByPrefix('partyhub_kalambury_');
        PH.storage.removeByPrefix('ph_kalambury_');
        return;
      }
      const kill = [];
      for(let i=0;i<localStorage.length;i++){
        const k = localStorage.key(i);
        if(!k) continue;
        if(k.startsWith('partyhub_kalambury_') || k.startsWith('ph_kalambury_')) kill.push(k);
      }
      kill.forEach(k=>{ try{ localStorage.removeItem(k); }catch(_e){} });
    }catch(_e){}
  };
})();


    

    // ANCHOR: START_STAGE1_ENSURE (hotfix: po START zawsze widać Stage 1)
    (function(){
      const btn = document.getElementById('btnStartGame');
      if(!btn || btn.dataset.boundStageFix === '1') return;
      btn.dataset.boundStageFix = '1';

      btn.addEventListener('click', ()=>{
        // po ewentualnej istniejącej logice: dopnij Stage 1 jeśli HUD pusty / stage = idle
        setTimeout(()=>{
          try{
            // ensure overlay game visible
            if(typeof showOverlay === 'function' && typeof overlayGame !== 'undefined' && overlayGame){
              if(!overlayGame.classList.contains('is-visible')) showOverlay(overlayGame);
            }

            const cur = (state && state.game && state.game.stage) ? String(state.game.stage) : 'idle';
            if(cur === 'idle' || !cur){
              try{ reshuffleStage1Layout(); }catch(_e){}
              if(state && state.game){
                state.game.rolling = false;
                state.game.orderIds = [];
                state.game.orderPos = {};
                state.game.focusId = null;
                state.game.presenterIdx = 0;
              }
              if(typeof setGameStage === 'function') setGameStage('stage1', { persist:false });
            }else{
              if(typeof renderGameStage === 'function') renderGameStage();
            }
          }catch(e){ console.error('Start Stage1 ensure failed', e); }
        }, 0);
      }, true);
    })();

    // ANCHOR: GAME_SETTINGS_UI (na planszy — osobne od globalnych)
    function showGameSettings(){
      if(soundToggleGame) soundToggleGame.checked = !!state.settings.soundOn;
      showO('gameSettingsOverlay');
    }

    function hideGameSettings(){
      hideO('gameSettingsOverlay');
    }

    // ANCHOR: GLOBAL_SETTINGS_UI
    function showGlobalSettings(){
      applySettingsToUI();
      const el = $('globalSettingsOverlay');
      if(!el){ console.error('Brak #globalSettingsOverlay w DOM'); return; }
      if(el.parentElement !== document.body) document.body.appendChild(el);
      el.classList.add('is-visible');
    }

    function hideGlobalSettings(){
      const el = $('globalSettingsOverlay');
      if(!el) return;
      el.classList.remove('is-visible');
    }

    // ANCHOR: SETTINGS_PERSIST
    let motionWasSaved = false;

    function saveSettings(){
      try{
        if(PH && PH.storage && typeof PH.storage.setJSON === 'function') PH.storage.setJSON('partyhub_kalambury_settings', state.settings);
        else localStorage.setItem('partyhub_kalambury_settings', JSON.stringify(state.settings));
      }catch(_e){}
    }

    function loadSettings(){
      try{
        const raw = (PH && PH.storage && typeof PH.storage.get === 'function') ? PH.storage.get('partyhub_kalambury_settings') : localStorage.getItem('partyhub_kalambury_settings');
        if(!raw) return;
        const s = JSON.parse(raw);
        if(!s || typeof s !== 'object') return;
        if(typeof s.soundOn === 'boolean') state.settings.soundOn = s.soundOn;
        if(typeof s.motionOn === 'boolean'){ state.settings.motionOn = s.motionOn; motionWasSaved = true; }
      }catch(_e){}
    }

    function applyMotionSetting(){
      const b = document.body;
      if(!b) return;
      if(state.settings.motionOn){ b.classList.add('motion-on'); b.classList.remove('motion-off'); }
      else { b.classList.add('motion-off'); b.classList.remove('motion-on'); }
    }

    function applySettingsToUI(){
      if(soundToggle) soundToggle.checked = !!state.settings.soundOn;
      if(soundToggleGame) soundToggleGame.checked = !!state.settings.soundOn;
      if(motionToggle) motionToggle.checked = !!state.settings.motionOn;
      applyMotionSetting();
}

    // ANCHOR: SETTINGS_SETTERS (żeby spinać wiele toggle'i do jednego stanu)
    function setSoundOn(v){
      state.settings.soundOn = !!v;
      if(soundToggle) soundToggle.checked = state.settings.soundOn;
      if(soundToggleGame) soundToggleGame.checked = state.settings.soundOn;
      saveSettings();
}

    function setMotionOn(v){
      state.settings.motionOn = !!v;
      if(motionToggle) motionToggle.checked = state.settings.motionOn;
      applyMotionSetting();
      saveSettings();
}
    // ANCHOR: CONFIRM_UI (moved to core/ui.js)

    // ANCHOR: CLEAR_DATA_IMPL
    function wipeKalamburyStorage(){
      // core storage helper (fallback do ręcznego kasowania)
      if(PH && PH.storage && typeof PH.storage.removeByPrefix === 'function'){
        return PH.storage.removeByPrefix('partyhub_kalambury_');
      }
      let removed = 0;
      try{
        const keys = [];
        for(let i=0;i<localStorage.length;i++){
          const k = localStorage.key(i);
          if(k && k.startsWith('partyhub_kalambury_')) keys.push(k);
        }
        keys.forEach(k=>{ try{ localStorage.removeItem(k); removed++; }catch(_e){} });
      }catch(_e){}
      return removed;
    }
    function resetKalamburyState(){
      state.selectedMode = null;
      state.cfg.classic = { winBy:'rounds', presentOrder:'sequential', turnSeconds: 90, targetScore: 12, roundsTotal: 3, categories: [], hintsOn:true, hintWords:true, hintCategory:true };

      const sysReduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      state.settings = { soundOn: true, motionOn: !sysReduce };
      motionWasSaved = false;

      players = [];
      draftPlayer = null;
      emojiPickerForId = null;
      tempSelectedEmoji = null;

      applySettingsToUI();
      applyCfgToUI();
      renderCategories();
      renderPlayers();
      validateStart();
      showOverlay(overlayHome);
    }

    function clearGameData(){
      const removed = wipeKalamburyStorage();
      resetKalamburyState();
      console.log('Kalambury: cleared', { removed });
    }

    // ANCHOR: MODE_SELECTION_LOGIC
    function toggleModeCard(card){
      const wasOpen = card.classList.contains('open');
      document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('open'));
      if(!wasOpen) card.classList.add('open');
    }
    function selectMode(modeId){ if(modeId !== 'wip') state.selectedMode = modeId; }

    // ANCHOR: MODE_SETTINGS_LOGIC

    // ANCHOR: WORDS_BANK_REMOVED (silnik haseł zrobimy od zera)



    const CATEGORY_LIST = [
      { id:'classic', label:'Klasyczne' },
      { id:'movies', label:'Filmy i seriale' },
      { id:'music', label:'Muzyka' },
      { id:'sports', label:'Sport' },
      { id:'jobs', label:'Zawody' },
      { id:'food', label:'Jedzenie' },
      { id:'places', label:'Miejsca' },
      { id:'animals', label:'Zwierzęta' },
      { id:'random', label:'Przysłowia' },
      { id:'dev', label:'DEV' } // ANCHOR: CATEGORY_DEV
    ];

    function validateCfg(){
      const cfg = state.cfg.classic;
      const tOk = (cfg.turnSeconds === 0) || TURN_STEPS.includes(cfg.turnSeconds);
      const sOk = SCORE_STEPS.includes(cfg.targetScore);
      const rOk = ROUNDS_STEPS.includes(cfg.roundsTotal);
      const cOk = Array.isArray(cfg.categories) && cfg.categories.length >= 1;
      return tOk && sOk && rOk && cOk;
    }

    function syncTurnSecondsBadge(){
      if(!turnSecondsBadge) return;
      const v = state.cfg.classic.turnSeconds;
      turnSecondsBadge.textContent = (v === 0) ? '∞' : `${v}s`;
    }

    function syncTargetScoreBadge(){
      if(!targetScoreBadge) return;
      const v = state.cfg.classic.targetScore;
      targetScoreBadge.textContent = (v === 0) ? '∞' : String(v);
    }

    function syncRoundsTotalBadge(){
      if(!roundsTotalBadge) return;
      const v = state.cfg.classic.roundsTotal;
      roundsTotalBadge.textContent = (v === 0) ? '∞' : String(v);
    }

    
    // [PH] REFRESH_BADGE (Odświeżenia hasła - badge pod sliderem)
    function syncRefreshCountBadge(){
      if(!refreshCountBadge) return;
      const v = state.cfg.classic.refreshCount;
      refreshCountBadge.textContent = (v === 0) ? '∞' : String(v);
    }

// ANCHOR: MODE_SETTINGS_SUMMARY (win condition + hints)
    function syncModeSettingsSummary(){
      if(!modeSettingsSummary) return;
      const c = state.cfg.classic;
      const winBy = normWinBy(c && c.winBy);
      const po = normPresentOrder(c && c.presentOrder);
      const parts = [
        (winBy === 'score') ? 'Koniec: punkty' : 'Koniec: rundy',
        (po === 'guesser') ? 'Kolejność: zgadł' : 'Kolejność: po kolei',
        (c && c.hintsOn) ? 'Podpowiedzi: tak' : 'Podpowiedzi: nie',
        (c && c.refreshOn) ? 'Refresh: tak' : 'Refresh: nie'
      ];
      modeSettingsSummary.textContent = parts.join(' • ');
    }

    // ANCHOR: HINTS_UI
    function syncHintsUI(){
      const c = state.cfg.classic;
      if(!c) return;
      if(typeof c.hintsOn !== 'boolean') c.hintsOn = true;
      if(typeof c.hintWords !== 'boolean') c.hintWords = true;
      if(typeof c.hintCategory !== 'boolean') c.hintCategory = true;

      if(cardModeSettings){
        cardModeSettings.querySelectorAll('[data-hints-master]').forEach(btn=>{
          const v = String(btn.dataset.hintsMaster||'');
          const active = (v === 'on') ? !!c.hintsOn : (v === 'off') ? !c.hintsOn : false;
          btn.classList.toggle('btn-new', active);
          btn.classList.toggle('btn-ghost', !active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      }

      if(rowHintsTypes){
        const disabled = !c.hintsOn;
        // [PH] Jeśli podpowiedzi są wyłączone w karcie „Ustawienia”,
        // nie pokazujemy opcji typów w „Dostosuj ustawienia”.
        rowHintsTypes.classList.toggle('ph-hidden', disabled);
        rowHintsTypes.querySelectorAll('[data-hint]').forEach(btn=>{
          const key = String(btn.dataset.hint||'');
          const isOn = (key === 'words') ? !!c.hintWords : (key === 'category') ? !!c.hintCategory : false;
          btn.classList.toggle('btn-new', isOn);
          btn.classList.toggle('btn-ghost', !isOn);
          btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
          btn.disabled = disabled;
        });
      }

      syncModeSettingsSummary();
    }

    // ANCHOR: REFRESH_UI
    function syncRefreshUI(){
      const c = state.cfg.classic;
      if(!c) return;
      if(typeof c.refreshOn !== 'boolean') c.refreshOn = false;
      if(!Number.isFinite(Number(c.refreshCount))) c.refreshCount = 2;
      // normalizacja: 0 => ∞ lub jedna z dozwolonych wartości
      const rc = Number(c.refreshCount);
      c.refreshCount = (rc === 0) ? 0 : (REFRESH_STEPS.includes(rc) ? rc : 2);

      if(cardModeSettings){
        cardModeSettings.querySelectorAll('[data-refresh-master]').forEach(btn=>{
          const v = String(btn.dataset.refreshMaster||'');
          const active = (v === 'on') ? !!c.refreshOn : (v === 'off') ? !c.refreshOn : false;
          btn.classList.toggle('btn-new', active);
          btn.classList.toggle('btn-ghost', !active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      }

      if(rowRefreshCount){
        const hidden = !c.refreshOn;
        rowRefreshCount.classList.toggle('ph-hidden', hidden);
      }

      syncModeSettingsSummary();
    }

    // ANCHOR: WINBY_UI (ukrywanie sliderów + zaznaczenie wyboru)
    function syncWinByUI(){
      const c = state.cfg.classic;
      const winBy = normWinBy(c && c.winBy);
      c.winBy = winBy; // normalizacja

      if(rowTargetScore) rowTargetScore.classList.toggle('ph-hidden', winBy !== 'score');
      if(rowRoundsTotal) rowRoundsTotal.classList.toggle('ph-hidden', winBy !== 'rounds');

      syncModeSettingsSummary();

      if(cardModeSettings){
        cardModeSettings.querySelectorAll('[data-winby]').forEach(btn=>{
          const v = normWinBy(btn && btn.dataset ? btn.dataset.winby : '');
          const active = (v === winBy);
          btn.classList.toggle('btn-new', active);
          btn.classList.toggle('btn-ghost', !active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      }
    }

    // ANCHOR: PRESENT_ORDER_UI (zaznaczenie wyboru)
    function syncPresentOrderUI(){
      const c = state.cfg.classic;
      const po = normPresentOrder(c && c.presentOrder);
      c.presentOrder = po;

      if(cardModeSettings){
        cardModeSettings.querySelectorAll('[data-present-order]').forEach(btn=>{
          const v = normPresentOrder(btn && btn.dataset ? btn.dataset.presentOrder : '');
          const active = (v === po);
          btn.classList.toggle('btn-new', active);
          btn.classList.toggle('btn-ghost', !active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      }
      syncModeSettingsSummary();
    }


    // ANCHOR: RANGE_SCALE_ACTIVE (podświetlenie aktywnej wartości pod sliderem)
    function syncRangeScaleActive(inputEl){
      if(!inputEl) return;
      const wrap = inputEl.closest('.range-wrap');
      if(!wrap) return;
      const scale = wrap.querySelector('.range-scale');
      if(!scale) return;
      const spans = scale.querySelectorAll('span');
      if(!spans || !spans.length) return;
      const raw = Number(inputEl.value) || 1;
      const idx = Math.min(spans.length - 1, Math.max(0, raw - 1));
      spans.forEach((s, i)=>s.classList.toggle('is-active', i === idx));
    }

    function syncAllRangeScales(){
      syncRangeScaleActive(cfgTurnSeconds);
      syncRangeScaleActive(cfgTargetScore);
      syncRangeScaleActive(cfgRoundsTotal);
    }

    // ANCHOR: RANGE_SCALE_PICK (klik w wartość pod sliderem)
    function bindRangeScalePick(){
      if(document.body && document.body.dataset.phRangePickBound === '1') return;
      if(document.body) document.body.dataset.phRangePickBound = '1';

      document.addEventListener('click', (e)=>{
        const sp = e.target.closest('.range-scale span');
        if(!sp) return;
        const scale = sp.parentElement;
        const wrap = scale && scale.closest ? scale.closest('.range-wrap') : null;
        if(!wrap) return;
        const input = wrap.querySelector('input[type=range]');
        if(!input || input.disabled) return;
        const spans = Array.from(scale.querySelectorAll('span'));
        const idx = spans.indexOf(sp);
        if(idx < 0) return;
        const next = String(idx + 1);
        if(input.value !== next) input.value = next;
        input.dispatchEvent(new Event('input', { bubbles:true }));
        syncRangeScaleActive(input);
      });
    }

    function saveCfg(){ try{ localStorage.setItem('partyhub_kalambury_cfg_classic', JSON.stringify(state.cfg.classic)); }catch(_e){} }

    function loadCfg(){
      try{
        const raw = localStorage.getItem('partyhub_kalambury_cfg_classic');
        if(!raw) return;
        const parsed = JSON.parse(raw);
        if(!parsed || typeof parsed !== 'object') return;

        if(parsed.winBy === 'score' || parsed.winBy === 'rounds'){
          state.cfg.classic.winBy = parsed.winBy;
        }

        if(parsed.presentOrder === 'sequential' || parsed.presentOrder === 'guesser'){
          state.cfg.classic.presentOrder = parsed.presentOrder;
        }

        if(Number.isFinite(Number(parsed.turnSeconds))){
          const ts = Number(parsed.turnSeconds);
          state.cfg.classic.turnSeconds = (ts === 0) ? 0 : (TURN_STEPS.includes(ts) ? ts : 90);
        }

        if(Number.isFinite(Number(parsed.targetScore))){
          const t = Number(parsed.targetScore);
          state.cfg.classic.targetScore = (t === 0) ? 0 : (SCORE_STEPS.includes(t) ? t : 12);
        }

        if(Number.isFinite(Number(parsed.roundsTotal))){
          const r = Number(parsed.roundsTotal);
          state.cfg.classic.roundsTotal = (r === 0) ? 0 : (ROUNDS_STEPS.includes(r) ? r : 3);
        }


        if(typeof parsed.hintsOn === 'boolean') state.cfg.classic.hintsOn = parsed.hintsOn;
        if(typeof parsed.hintWords === 'boolean') state.cfg.classic.hintWords = parsed.hintWords;
        if(typeof parsed.hintCategory === 'boolean') state.cfg.classic.hintCategory = parsed.hintCategory;

        if(typeof parsed.refreshOn === 'boolean') state.cfg.classic.refreshOn = parsed.refreshOn;
        if(Number.isFinite(Number(parsed.refreshCount))){
          const rc = Number(parsed.refreshCount);
          state.cfg.classic.refreshCount = (rc === 0) ? 0 : (REFRESH_STEPS.includes(rc) ? rc : 2);
        }

        if(Array.isArray(parsed.categories)){
          const allowed = new Set(CATEGORY_LIST.map(c=>c.id));
          const next = parsed.categories.map(x=>String(x)).filter(id=>allowed.has(id));
          state.cfg.classic.categories = next.length ? [...new Set(next)] : [];
        }
      }catch(_e){}
    }

    function applyCfgToUI(){
      const cfg = state.cfg.classic;
      if(cfgTurnSeconds){
        const idx = TURN_STEPS.lastIndexOf(cfg.turnSeconds);
        cfgTurnSeconds.value = String(idx >= 0 ? idx + 1 : 3);
      }
      syncTurnSecondsBadge();

      if(cfgTargetScore){
        const idx = SCORE_STEPS.lastIndexOf(cfg.targetScore);
        cfgTargetScore.value = String(idx >= 0 ? idx + 1 : 3);
      }
      syncTargetScoreBadge();

      if(cfgRoundsTotal){
        const idx = ROUNDS_STEPS.lastIndexOf(cfg.roundsTotal);
        cfgRoundsTotal.value = String(idx >= 0 ? idx + 1 : 3);
      }
      syncRoundsTotalBadge();

      if(cfgRefreshCount){
        const idx = REFRESH_STEPS.lastIndexOf(cfg.refreshCount);
        cfgRefreshCount.value = String(idx >= 0 ? idx + 1 : 2);
      }
      syncRefreshCountBadge();

      syncWinByUI();
      syncHintsUI();
      syncRefreshUI();
      syncPresentOrderUI();

      syncRoundSummary();
      syncCategoriesUI();
      syncAllRangeScales();
    }

    function readCfgFromUI(){
      if(cfgTurnSeconds){
        const raw = Number(cfgTurnSeconds.value) || 2;
        const v = TURN_STEPS[Math.min(TURN_STEPS.length-1, Math.max(0, raw-1))];
        state.cfg.classic.turnSeconds = v;
        cfgTurnSeconds.value = String(Math.min(8, Math.max(1, raw)));
        syncTurnSecondsBadge();
      }

      if(cfgTargetScore){
        const raw = Number(cfgTargetScore.value) || 1;
        const idx = Math.min(SCORE_STEPS.length-1, Math.max(0, raw-1));
        state.cfg.classic.targetScore = SCORE_STEPS[idx];
        cfgTargetScore.value = String(Math.min(8, Math.max(1, raw)));
        syncTargetScoreBadge();
      }

      if(cfgRoundsTotal){
        const raw = Number(cfgRoundsTotal.value) || 1;
        const idx = Math.min(ROUNDS_STEPS.length-1, Math.max(0, raw-1));
        state.cfg.classic.roundsTotal = ROUNDS_STEPS[idx];
        cfgRoundsTotal.value = String(Math.min(8, Math.max(1, raw)));
        syncRoundsTotalBadge();
      }

      if(cfgRefreshCount){
        const raw = Number(cfgRefreshCount.value) || 1;
        const idx = Math.min(REFRESH_STEPS.length-1, Math.max(0, raw-1));
        state.cfg.classic.refreshCount = REFRESH_STEPS[idx];
        cfgRefreshCount.value = String(Math.min(8, Math.max(1, raw)));
        syncRefreshCountBadge();
      }

      saveCfg();
      syncRoundSummary();
      syncAllRangeScales();
      validateStart();
    }

    // ANCHOR: CATEGORIES_LOGIC
    const formatCatsSummary = (ids, max=4) => {
      const names = ids.map(id => (CATEGORY_LIST.find(x=>x.id===id)||{label:id}).label);
      const shown = names.slice(0, max);
      const rest = names.length - shown.length;
      return rest > 0 ? `${shown.join(', ')} +${rest}` : shown.join(', ');
    };

    function renderCategories(){
      if(!catsGrid) return;
      catsGrid.innerHTML = CATEGORY_LIST.map(c=>`<button type="button" class="cat-chip" data-cat="${c.id}">${c.label}</button>`).join('');
      syncCategoriesUI();
    }

    function syncCategoriesUI(){
      const cfg = state.cfg.classic;
      if(!Array.isArray(cfg.categories)) cfg.categories = [];
      const sel = new Set(cfg.categories);

      if(catsGrid) catsGrid.querySelectorAll('[data-cat]').forEach(b=>b.classList.toggle('selected', sel.has(b.dataset.cat)));
      if(catsSummary) catsSummary.textContent = !cfg.categories.length ? 'Wybierz min. 1' : ('Wybrane: ' + formatCatsSummary(cfg.categories, 4));
      if(catsCount) catsCount.textContent = `${cfg.categories.length}/${CATEGORY_LIST.length}`;
    }

    function toggleCategory(id){
      const cfg = state.cfg.classic;
      const next = new Set(Array.isArray(cfg.categories) ? cfg.categories : []);
      next.has(id) ? next.delete(id) : next.add(id);
      cfg.categories = [...next];
      saveCfg();
      syncCategoriesUI();
      validateStart();
    }

    function setAllCategories(){
      state.cfg.classic.categories = CATEGORY_LIST.map(c=>c.id);
      saveCfg();
      syncCategoriesUI();
      validateStart();
    }

    function clearCategories(){
      state.cfg.classic.categories = [];
      saveCfg();
      syncCategoriesUI();
      validateStart();
    }

    function randomCategories(){
      const ids = CATEGORY_LIST.map(c=>c.id);
      const maxPick = Math.min(3, ids.length);
      const count = 1 + Math.floor(Math.random()*maxPick);
      for(let i=ids.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [ids[i],ids[j]]=[ids[j],ids[i]];
      }
      state.cfg.classic.categories = ids.slice(0,count);
      saveCfg();
      syncCategoriesUI();
      validateStart();
    }

    // ANCHOR: NAV
    function openModeSettings(){
      if(!state.selectedMode) return;
      loadMode();
      showOverlay(overlayModeSettings);
      applyCfgToUI();
      initSettingCards();
      renderPlayers();
      validateStart();
    }

    function backToHome(){ showOverlay(overlayHome); }

    // ANCHOR: NAV_TO_HUB
    function goToHub(){ window.location.href = '../../index.html'; }
    // ANCHOR: GAME_ENGINE (minimalny stage system — zaczynamy od STAGE 1 - Losowanie)

    // ANCHOR: STAGE_TEMPLATES
    function escHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch] || ch));
}


    function gridDimsForPlayers(n){
      const c = Math.max(0, (n|0));
      if(c <= 1) return { cols:1, rows:1 };
      if(c <= 4) return { cols:c, rows:1 };
      if(c <= 6) return { cols:3, rows:2 };
      return { cols:4, rows:2 }; // 7–8
    }

    // ANCHOR: SHUFFLE_UTIL (losowe ułożenie kart na planszy — niezależnie od listy w ustawieniach)
    function shuffleInPlace(arr){
      for(let i=arr.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [arr[i],arr[j]] = [arr[j],arr[i]];
      }
      return arr;
    }

    function reshuffleStage1Layout(){
      // Układ kart na planszy ma być LOSOWY i NIEZALEŻNY od kolejności w menu ustawień.
      // Jeśli wypadnie identyczna kolejność jak w menu (rzadko), wymuszamy inną (dla 2+ graczy).
      const base = Array.isArray(players)
        ? players.map(p=>p && p.id).filter(Boolean).map(String)
        : [];

      if(base.length <= 1){
        state.game.layoutIds = base;
        return;
      }

      const sameOrder = (a,b)=>{
        if(!a || !b || a.length !== b.length) return false;
        for(let i=0;i<a.length;i++){ if(String(a[i]) !== String(b[i])) return false; }
        return true;
      };

      let ids = base.slice();
      for(let tries=0; tries<8; tries++){
        ids = base.slice();
        shuffleInPlace(ids);
        if(!sameOrder(ids, base)) break;
      }

      if(sameOrder(ids, base)){
        // safety (praktycznie nie powinno się zdarzyć) — rotacja gwarantuje inną kolejność
        ids = base.slice(1).concat(base[0]);
      }

      state.game.layoutIds = ids;
    }

    function getStage1LayoutPlayersOrdered(){
      const list = Array.isArray(players) ? players : [];
      if(!list.length) return [];

      // jeśli nie ma layoutu (np. dev-skip), wygeneruj
      if(!Array.isArray(state.game.layoutIds) || !state.game.layoutIds.length){
        reshuffleStage1Layout();
      }

      const map = new Map(list.map(p=>[String(p.id), p]));
      const ids = Array.isArray(state.game.layoutIds) ? state.game.layoutIds : [];
      let ordered = ids.map(id=>map.get(String(id))).filter(Boolean);

      // jeśli layout nieaktualny (zmiana graczy) — losuj od nowa
      if(ordered.length !== list.length){
        reshuffleStage1Layout();
        const ids2 = Array.isArray(state.game.layoutIds) ? state.game.layoutIds : [];
        ordered = ids2.map(id=>map.get(String(id))).filter(Boolean);
      }

      return ordered;
    }

    function tplPlayerPill(p){
      const emoji = (p && p.emoji) ? p.emoji : '🙂';
      const name = (p && p.name) ? p.name : 'Gracz';
      const score = (p && Number.isFinite(Number(p.score))) ? Number(p.score) : 0;
      const pid = (p && p.id) ? String(p.id) : '';

      // pozycja w wylosowanej kolejności (0 = jeszcze nie wylosowany)
      const pos = (state && state.game && state.game.orderPos && pid && state.game.orderPos[pid])
        ? Number(state.game.orderPos[pid])
        : 0;

      const picked = (pos > 0);
      const facedown = !picked;

      const focusId = (state && state.game && state.game.focusId) ? String(state.game.focusId) : '';
      const isFocus = !!(focusId && pid && pid === focusId);

      return `
        <div class="player-pill${facedown ? ' is-facedown' : ''}${picked ? ' stage1-picked' : ''}${isFocus ? ' roll-focus' : ''}" data-player-id="${pid}">
          <div class="pp-order${pos ? '' : ' is-hidden'}">${pos ? pos : ''}</div>
          <div class="pp-emoji">${emoji}</div>
          <div class="pp-meta">
            <div class="pp-name">${escHtml(name)}</div>
            <div class="pp-score"><span class="pp-score-num">${score}</span></div>
          </div>
        </div>
      `;
    }

    function tplStage1(){
      const list = getStage1LayoutPlayersOrdered();
      const n = list.length;
      const dims = gridDimsForPlayers(n);

      const cards = n
        ? list.map(p=>tplPlayerPill(p)).join('')
        : `<div class="stage-desc" style="grid-column:1/-1;align-self:center;justify-self:center;opacity:.78">Dodaj graczy w ustawieniach.</div>`;

      return `
        <div class="stage stage-1" data-dbg2="STAGE_1" aria-label="Stage 1 - Losowanie">
          <div class="stage-card" data-dbg2="STAGE_CARD">
            <div class="stage1-grid" data-dbg2="STAGE1_GRID" style="--cols:${dims.cols};--rows:${dims.rows}" aria-label="Karty graczy (rewers)">
              ${cards}
            </div>
          </div>
        </div>
      `;
    }

    // ANCHOR: STAGE2 (Start rundy)
    function ensureOrderForStage2(){
      const list = Array.isArray(players) ? players.map(p=>p && p.id).filter(Boolean).map(String) : [];
      const haveFull = Array.isArray(state.game.orderIds) && state.game.orderIds.length === list.length && list.length >= 2;
      if(!haveFull){
        // fallback: ustal kolejność na bazie aktualnego layoutu (albo listy graczy)
        const base = (Array.isArray(state.game.layoutIds) && state.game.layoutIds.length === list.length)
          ? state.game.layoutIds.slice().map(String)
          : list.slice();
        state.game.orderIds = base.slice();
        state.game.orderPos = {};
        state.game.orderIds.forEach((id,i)=>{ state.game.orderPos[String(id)] = i+1; });
      }
      if(!Number.isFinite(Number(state.game.presenterIdx))) state.game.presenterIdx = 0;
      if(state.game.presenterIdx < 0) state.game.presenterIdx = 0;
      if(state.game.presenterIdx >= ((state.game.orderIds && state.game.orderIds.length) ? state.game.orderIds.length : 0)) state.game.presenterIdx = 0;


// [PH][PRESENT_ORDER] bazowa kolejka losowania (do powrotu po trybie "kto zgadł odpowiada")
const n = Array.isArray(state.game.orderIds) ? state.game.orderIds.length : 0;
if(n > 0){
  if(!Number.isFinite(Number(state.game.baseLastIdx))) state.game.baseLastIdx = state.game.presenterIdx;
  if(state.game.baseLastIdx < 0 || state.game.baseLastIdx >= n) state.game.baseLastIdx = state.game.presenterIdx;

  if(!Number.isFinite(Number(state.game.baseNextIdx))) state.game.baseNextIdx = (Number(state.game.baseLastIdx) + 1) % n;
  if(state.game.baseNextIdx < 0 || state.game.baseNextIdx >= n) state.game.baseNextIdx = (Number(state.game.baseLastIdx) + 1) % n;
}
    }

    function getPlayersInOrder(){
      const list = Array.isArray(players) ? players : [];
      if(!list.length) return [];
      if(Array.isArray(state.game.orderIds) && state.game.orderIds.length === list.length){
        const map = new Map(list.map(p=>[String(p.id), p]));
        const ordered = state.game.orderIds.map(id=>map.get(String(id))).filter(Boolean);
        if(ordered.length === list.length) return ordered;
      }
      return list.slice();
    }

    function getCurrentPresenterId(){
      ensureOrderForStage2();
      const ids = Array.isArray(state.game.orderIds) ? state.game.orderIds : [];
      return ids.length ? String(ids[state.game.presenterIdx] || ids[0]) : null;
    }

    function tplPresenterPill(p){
      const emoji = (p && p.emoji) ? p.emoji : '🙂';
      const name = (p && p.name) ? p.name : 'Gracz';
      const pid = (p && p.id) ? String(p.id) : '';
      return `
        <div class="player-pill presenter-pill" data-dbg2="PRESENTER_PILL" data-player-id="${pid}">
          <div class="pp-emoji">${emoji}</div>
          <div class="pp-name">${escHtml(name)}</div>
        </div>
      `;
    }

    function tplPlayerPillStage2(p, currentPresenterId){
      const emoji = (p && p.emoji) ? p.emoji : '🙂';
      const name = (p && p.name) ? p.name : 'Gracz';
      const score = (p && Number.isFinite(Number(p.score))) ? Number(p.score) : 0;
      const pid = (p && p.id) ? String(p.id) : '';

      const isCur = !!(currentPresenterId && pid && String(pid) === String(currentPresenterId));

      return `
        <div class="player-pill${isCur ? ' stage2-current' : ''}" data-player-id="${pid}">
          <div class="pp-emoji">${emoji}</div>
          <div class="pp-meta">
            <div class="pp-name">${escHtml(name)}</div>
            <div class="pp-score"><span class="pp-score-num">${score}</span></div>
          </div>
        </div>
      `;
    }

    function tplStage2(){
      ensureOrderForStage2();
      const ordered = getPlayersInOrder();
      const n = ordered.length;
      const dims = gridDimsForPlayers(n);

      const presenterId = getCurrentPresenterId();
      const presenter = ordered.find(p=>String(p.id)===String(presenterId)) || ordered[0] || null;

      const pills = n
        ? ordered.map(p=>tplPlayerPillStage2(p, presenterId)).join('')
        : `<div class="stage-desc" style="grid-column:1/-1;align-self:center;justify-self:center;opacity:.78">Dodaj graczy w ustawieniach.</div>`;

      const posTxtSeq = presenterId && state && state.game && state.game.orderPos
        ? (state.game.orderPos[String(presenterId)] || (state.game.presenterIdx + 1))
        : (state.game.presenterIdx + 1);

      const drawerOpen = !!(state && state.game && state.game.stage2GridOpen);

      // dodatkowe info do TOP BAR (więcej niż tylko kolejka)
      const cfg = (state && state.cfg && state.cfg.classic) ? state.cfg.classic : { winBy:'rounds', presentOrder:'sequential', turnSeconds: 90, targetScore: 12, roundsTotal: 3, categories: [] };
      const po = normPresentOrder(cfg.presentOrder);
      const turnsDone = Number(state?.game?.turnsDone||0) || 0;
      const posTxt = (po === 'guesser') ? Math.min(Math.max(1,n), turnsDone + 1) : posTxtSeq;
      const winBy = normWinBy(cfg.winBy);
      const turnTxt = (cfg.turnSeconds === 0) ? '∞' : `${cfg.turnSeconds}s`;
      const goalTxt = (winBy === 'score')
        ? ((cfg.targetScore === 0) ? '∞ pkt' : `${cfg.targetScore} pkt`)
        : ((cfg.roundsTotal === 0) ? '∞ rund' : `${cfg.roundsTotal} rund`);
      const catsIds = Array.isArray(cfg.categories) ? cfg.categories : [];
      const catsTxt = catsIds.length ? formatCatsSummary(catsIds, 2) : '—';
      const roundNo = Number(state?.game?.roundNo)||1;
      const rTotal = Number(cfg.roundsTotal)||0;
      const roundTxt = (winBy === 'rounds' && rTotal > 0) ? `${roundNo}/${rTotal}` : `${roundNo}/∞`;

      const nextP = (po === 'sequential' && n >= 2) ? ordered[(state.game.presenterIdx + 1) % n] : null;
      const nextName = (po === 'guesser') ? 'Kto zgadnie' : (nextP ? (nextP.name || '—') : '—');

      let bestScore = -1;
      let leaderNames = [];
      ordered.forEach(pp=>{
        const sc = Number(pp && pp.score);
        const val = Number.isFinite(sc) ? sc : 0;
        if(val > bestScore){
          bestScore = val;
          leaderNames = [pp && pp.name ? pp.name : '—'];
        }else if(val === bestScore){
          leaderNames.push(pp && pp.name ? pp.name : '—');
        }
      });
      const leaderExtra = (leaderNames.length > 1) ? (' +' + (leaderNames.length - 1)) : '';
      const leaderTxt = (bestScore > 0)
        ? `${leaderNames[0]}${leaderExtra} (${bestScore})`
        : '—';

      const topMetaHtml = `
        <div class="stage2-chip" data-dbg2="STAGE2_CHIP"><span class="k">GRACZE</span><span class="v">${Math.max(0,n)}</span></div>
        <div class="stage2-chip" data-dbg2="STAGE2_CHIP"><span class="k">CZAS</span><span class="v">${escHtml(turnTxt)}</span></div>
        <div class="stage2-chip" data-dbg2="STAGE2_CHIP"><span class="k">CEL</span><span class="v">${escHtml(goalTxt)}</span></div>
        <div class="stage2-chip" data-dbg2="STAGE2_CHIP"><span class="k">KATEGORIE</span><span class="v">${escHtml(catsTxt)}</span></div>
        <div class="stage2-chip" data-dbg2="STAGE2_CHIP"><span class="k">RUNDA</span><span class="v">${escHtml(roundTxt)}</span></div>
        <div class="stage2-chip" data-dbg2="STAGE2_CHIP"><span class="k">NASTĘPNY</span><span class="v">${escHtml(nextName)}</span></div>
        <div class="stage2-chip" data-dbg2="STAGE2_CHIP"><span class="k">LIDER</span><span class="v">${escHtml(leaderTxt)}</span></div>
      `;
      if(state && state.game) state.game.topBarMetaHtml = topMetaHtml;

      return `
        <div class="stage stage-2" data-dbg2="STAGE_2" aria-label="Stage 2 - Start rundy">
          <div class="stage-card${drawerOpen ? ' stage2-sheet-open' : ''}" data-dbg2="STAGE_CARD">

            <div class="stage2-head" data-dbg2="STAGE2_HEAD">
              <div class="stage2-sub">Tura ${posTxt}/${Math.max(1,n)}</div>

              <div class="stage2-presenter" data-dbg2="STAGE2_PRESENTER" aria-label="Prezentuje">
                <div class="stage2-presenter-label" aria-hidden="true">PREZENTUJE</div>
                ${presenter ? tplPresenterPill(presenter) : ''}
              </div>
            </div>

            <div class="stage2-sheet${drawerOpen ? ' is-open' : ''}" data-dbg2="STAGE2_DRAWER" aria-label="Lista graczy (z dołu)">
              <button class="stage2-sheet-handle" data-dbg2="STAGE2_TOGGLE" id="btnStage2ToggleGrid" data-action="stage2:toggleGrid" type="button" aria-expanded="${drawerOpen ? 'true' : 'false'}" aria-label="Pokaż/ukryj graczy">
                <span class="stage2-sheet-caret" aria-hidden="true">▴</span>
              </button>
              <div class="stage2-sheet-body">
                <div class="stage2-grid" data-dbg2="STAGE2_GRID" style="--cols:${dims.cols};--rows:${dims.rows}" aria-label="Gracze (kolejność gry)">
                  ${pills}
                </div>
              </div>
            </div>

          </div>
        </div>
      `;
    }


    

    // ANCHOR: STAGE3_ENGINE (TV-safe: 10s eyes -> 10s word -> timer act; w 3C hasło ukryte)
    const STAGE3_EYES_SEC = 10;
    const STAGE3_WORD_SEC = 10;
    let __stage3TickT = null;

    // [PH] HASLA: pule w osobnym pliku (games/kalambury/words.js)
    const WORD_POOLS = (window.KALAMBURY_WORD_POOLS && typeof window.KALAMBURY_WORD_POOLS === "object")
      ? window.KALAMBURY_WORD_POOLS
      : { classic:["Hasło"], dev:["TEST A","TEST B","TEST C"] };


    function clearStage3Timers(){
      if(__stage3TickT){ clearInterval(__stage3TickT); __stage3TickT = null; }
      stage3StopProgressBorder();
    }

    function stage3Turn(){
      if(!state || !state.game) return {};
      if(!state.game.turn || typeof state.game.turn !== 'object') state.game.turn = { phase:null, endAt:0, word:'', catId:'', catLabel:'', presenterId:'' };
      return state.game.turn;
    }

    function stage3Left(){
      const t = stage3Turn();
      const endAt = Number(t.endAt)||0;
      if(!endAt) return 0;
      return Math.max(0, Math.ceil((endAt - Date.now())/1000));
    }

    function stage3PickWord(){
      const t = stage3Turn();
      const cfg = (state && state.cfg && state.cfg.classic) ? state.cfg.classic : { categories:['classic'] };
      const cats = Array.isArray(cfg.categories) && cfg.categories.length ? cfg.categories : ['classic'];
      const catId = String(cats[Math.floor(Math.random()*cats.length)] || 'classic');
      const pool = WORD_POOLS[catId] || WORD_POOLS.classic || ['Hasło'];
      let word = String(pool[Math.floor(Math.random()*pool.length)] || 'Hasło');
      if(word === t.word && pool.length >= 2){
        for(let tries=0; tries<6 && word === t.word; tries++){
          word = String(pool[Math.floor(Math.random()*pool.length)] || word);
        }
      }
      const catLabel = (CATEGORY_LIST.find(x=>x.id===catId)||{label:catId}).label;
      t.catId = catId;
      t.catLabel = catLabel;
      t.word = word;
    }

    function stage3SetPhase(phase, { refreshWord=false }={}){
      const t = stage3Turn();
      t.phase = phase;
      t.lastShown = -1;

      if(phase === 'eyes'){
        t.word=''; t.catId=''; t.catLabel='';
        t.endAt = Date.now() + STAGE3_EYES_SEC*1000;

        renderGameStage();
        stage3SyncProgressBorder();
        stage3EnsureTick();
        return;
      }

      if(phase === 'word'){
        if(refreshWord || !t.word) stage3PickWord();
        t.endAt = Date.now() + STAGE3_WORD_SEC*1000;

        renderGameStage();
        // [PH] dopasuj wielkość długich haseł (nie pozwól, by rozwalały układ / timer)
        requestAnimationFrame(fitStage3Word);
        stage3SyncProgressBorder();
        stage3EnsureTick();
        return;
      }

      // 3C: gotowość — czekamy na START (bez automatycznego timera)
      if(phase === 'ready'){
        t.endAt = 0;
        clearStage3Timers();
        stage3StopProgressBorder();
        renderGameStage();
        return;
      }

      
      // 3E: werdykt — czekamy na wybór ZGADLI/NIE ZGADLI (bez timera)
      if(phase === 'verdict'){
        t.endAt = 0;
        clearStage3Timers();
        stage3StopProgressBorder();
        renderGameStage();
        return;
      }

// 3D: prezentacja
      if(phase === 'act'){
        const cfg = (state && state.cfg && state.cfg.classic) ? state.cfg.classic : { turnSeconds:90 };
        const sec = Number(cfg.turnSeconds)||0;
        t.endAt = (sec === 0) ? 0 : (Date.now() + sec*1000);

        renderGameStage();
        stage3SyncProgressBorder();
        stage3EnsureTick();
        return;
      }

      renderGameStage();
    }

    function stage3EnsureTick(){
      if(__stage3TickT) return;
      __stage3TickT = setInterval(stage3Tick, 180);
      stage3SyncProgressBorder();
      stage3Tick();
    }

    function stage3UpdateUi(){
      const t = stage3Turn();
      const ph = t.phase || 'eyes';

      if(ph === 'act'){
        const cfg = (state && state.cfg && state.cfg.classic) ? state.cfg.classic : { turnSeconds:90 };
        const sec = Number(cfg.turnSeconds)||0;
        const el = document.getElementById('stage3Timer');
        if(!el) return;
        el.textContent = (sec === 0) ? '∞' : String(stage3Left());
        return;
      }

      const el = document.getElementById('stage3Count');
      if(!el) return;
      el.textContent = String(stage3Left());
    }


// [PH][S3B] Dopasowanie fontu hasła: długie hasła nie mogą rozpychać layoutu.
function fitStage3Word(){
  try{
    if(!state || !state.game || state.game.stage !== 'stage3') return;
    const t = stage3Turn();
    if((t.phase||'') !== 'word') return;

    const wordEl = document.querySelector('#overlayGame .stage3-word');
    const areaEl = document.querySelector('#overlayGame .stage3-wordArea') || document.querySelector('#overlayGame .stage3-wordbox');
    if(!wordEl || !areaEl) return;

    // Dostępna przestrzeń (pomiar po kontenerze, bez paddingu)
    const csA = getComputedStyle(areaEl);
    const padL = parseFloat(csA.paddingLeft)||0;
    const padR = parseFloat(csA.paddingRight)||0;
    const padT = parseFloat(csA.paddingTop)||0;
    const padB = parseFloat(csA.paddingBottom)||0;
    const maxW = Math.max(0, areaEl.clientWidth - padL - padR);
    const maxH = Math.max(0, areaEl.clientHeight - padT - padB);
    if(maxW < 10 || maxH < 10) return;

    // Ustawienia bazowe (żeby pomiar był deterministyczny)
    wordEl.style.maxWidth = maxW + 'px';
    wordEl.style.margin = '0 auto';
    wordEl.style.textAlign = 'center';
    wordEl.style.lineHeight = '1.02';
    wordEl.style.overflow = 'visible';

    const cssFs = parseFloat(getComputedStyle(wordEl).fontSize) || 44;
    const minFs = 18;
    const hi0 = Math.min(260, Math.max(cssFs, Math.round(maxH * 1.35)));

    const fitsNowrap = (fs)=>{
      wordEl.style.whiteSpace = 'nowrap';
      wordEl.style.wordBreak = 'normal';
      wordEl.style.fontSize = fs + 'px';
      // klucz: porównujemy scrollWidth/scrollHeight, bo tekst może być "ucięty" przez overflow rodzica
      const cw = wordEl.clientWidth || maxW;
      const ch = wordEl.clientHeight || maxH;
      const okW = (wordEl.scrollWidth <= cw + 1);
      const okH = (wordEl.scrollHeight <= maxH + 1) && (ch <= maxH + 1);
      return okW && okH;
    };

    const fitsWrap2 = (fs)=>{
      wordEl.style.whiteSpace = 'normal';
      wordEl.style.wordBreak = 'break-word';
      wordEl.style.fontSize = fs + 'px';
      const cw = wordEl.clientWidth || maxW;
      const okW = (wordEl.scrollWidth <= cw + 1);
      const okH = (wordEl.scrollHeight <= maxH + 1);
      const lh = parseFloat(getComputedStyle(wordEl).lineHeight) || (fs * 1.02);
      const lines = Math.ceil((wordEl.scrollHeight + 0.5) / Math.max(1, lh));
      return okW && okH && (lines <= 2);
    };

    const bestFit = (fitsFn)=>{
      let lo = minFs, hi = hi0, best = minFs;
      for(let i=0;i<16;i++){
        const mid = (lo + hi) >> 1;
        if(fitsFn(mid)) { best = mid; lo = mid + 1; }
        else { hi = mid - 1; }
      }
      // Gwarancja: jeśli nadal wystaje, schodzimy pixel po pixelu
      let fs = best;
      while(fs > minFs){
        if(fitsFn(fs)) break;
        fs -= 1;
      }
      return fs;
    };

    // Preferuj 1 linię, ale jeśli 2 linie pozwalają na większy font, wybierz 2 linie.
    const can1 = fitsNowrap(minFs);
    const can2 = fitsWrap2(minFs);

    const best1 = can1 ? bestFit(fitsNowrap) : minFs;
    const best2 = can2 ? bestFit(fitsWrap2) : minFs;

    if(!can1 && can2){
      // tylko 2-liniowe działa
      wordEl.style.whiteSpace = 'normal';
      wordEl.style.wordBreak = 'break-word';
      wordEl.style.fontSize = best2 + 'px';
      return;
    }

    if(best2 > best1){
      wordEl.style.whiteSpace = 'normal';
      wordEl.style.wordBreak = 'break-word';
      wordEl.style.fontSize = best2 + 'px';
    }else{
      wordEl.style.whiteSpace = 'nowrap';
      wordEl.style.wordBreak = 'normal';
      wordEl.style.fontSize = best1 + 'px';
    }
  }catch(_e){ /* no-op */ }
}


// [PH][S3] Progress border — identyczna logika jak Stage 1 (conic-gradient + mask + rAF)
let __stage3PbKey = '';
let __stage3PbRAF = null;
let __stage3PbStart = 0;
let __stage3PbMs = 0;

function getStage3Main(){
  return document.querySelector('#overlayGame .stage3-main');
}

function stage3SetAdvanceProgress(p){
  const el = getStage3Main();
  if(!el) return;
  el.classList.add('is-advancing');
  el.style.setProperty('--p', String(p));
}

function stage3ClearAdvanceProgress(){
  const el = getStage3Main();
  if(!el) return;
  el.classList.remove('is-advancing');
  el.style.removeProperty('--p');
}

function stage3StopProgressBorder(){
  __stage3PbKey = '';
  if(__stage3PbRAF){ cancelAnimationFrame(__stage3PbRAF); __stage3PbRAF = null; }
  __stage3PbStart = 0; __stage3PbMs = 0;
  stage3ClearAdvanceProgress();
}

function stage3StartProgressBorder(totalMs, endAt, phase){
  const ms = Math.max(0, Number(totalMs)||0);
  const end = Number(endAt)||0;
  if(!ms || !end){ stage3StopProgressBorder(); return; }

  const key = String(phase||'') + ':' + end + ':' + ms;

  // jeśli już działa dla tej samej fazy/czasu — nie restartuj (restart = skoki)
  if(__stage3PbKey === key) return;
  __stage3PbKey = key;

  if(__stage3PbRAF){ cancelAnimationFrame(__stage3PbRAF); __stage3PbRAF = null; }
  __stage3PbStart = performance.now();
  __stage3PbMs = ms;

  stage3SetAdvanceProgress('0.0000');

  const tick = (now)=>{
    // jeśli wyszliśmy ze Stage 3 albo zmieniła się faza/czas — stop
    if(!state || !state.game || state.game.stage !== 'stage3') { stage3StopProgressBorder(); return; }
    if(__stage3PbKey !== key){ return; }

    const t = (now - __stage3PbStart) / __stage3PbMs;
    const p = Math.max(0, Math.min(1, t));
    stage3SetAdvanceProgress(p.toFixed(4));

    if(p < 1){ __stage3PbRAF = requestAnimationFrame(tick); return; }
    __stage3PbRAF = null;
    // nie czyścimy na końcu — faza i tak przełączy się na ready/verdict, które to czyści
  };

  __stage3PbRAF = requestAnimationFrame(tick);
}

// [PH][S3] Progress border na STAGE3_MAIN — czas = czas timera na ekranie
function stage3SyncProgressBorder(){
  const t = stage3Turn();
  const ph = t.phase || 'eyes';

  // tylko fazy z timerem
  let totalMs = 0;
  if(ph === 'eyes') totalMs = STAGE3_EYES_SEC * 1000;
  else if(ph === 'word') totalMs = STAGE3_WORD_SEC * 1000;
  else if(ph === 'act'){
    const cfg = (state && state.cfg && state.cfg.classic) ? state.cfg.classic : { turnSeconds:90 };
    const sec = Number(cfg.turnSeconds)||0;
    if(sec === 0){ stage3StopProgressBorder(); return; }
    totalMs = sec * 1000;
  }else{
    stage3StopProgressBorder();
    return;
  }

  const endAt = Number(t.endAt)||0;
  if(!endAt || !totalMs){ stage3StopProgressBorder(); return; }
  stage3StartProgressBorder(totalMs, endAt, ph);
}

    function stage3Tick(){
      if(!state || !state.game || state.game.stage !== 'stage3') return clearStage3Timers();
      const t = stage3Turn();
      const ph = t.phase || 'eyes';

      // ready/verdict nie liczą i nie przełączają automatycznie
      if(ph === 'ready' || ph === 'verdict') return;

      // act + ∞ => brak auto-przejścia
      if(ph === 'act'){
        const cfg = (state && state.cfg && state.cfg.classic) ? state.cfg.classic : { turnSeconds:90 };
        const sec = Number(cfg.turnSeconds)||0;
        if(sec === 0){
          if(t.lastShown !== -2){ t.lastShown = -2; stage3UpdateUi(); }
          return;
        }
      }

      const left = stage3Left();
      if(left !== t.lastShown){
        t.lastShown = left;
        stage3UpdateUi();
      }

      if(left > 0) return;

      if(ph === 'eyes') return stage3SetPhase('word', { refreshWord:true });
      if(ph === 'word') return stage3SetPhase('ready');   // zamiast act — czekamy na START
      if(ph === 'act') return stage3Stop('timeout');
    }

    function stage3Start(){
      ensureOrderForStage2();
      const t = stage3Turn();

      // jeśli jesteśmy już w stage3 i fazie "ready" → START uruchamia prezentację (3D)
      if(state && state.game && state.game.stage === 'stage3' && t.phase === 'ready'){
        return stage3SetPhase('act');
      }

      // wejście z Stage 2: uruchamiamy sekwencję 3A
      t.presenterId = getCurrentPresenterId();
      t.word=''; t.catId=''; t.catLabel='';
      t.phase = 'eyes';
      t.endAt = Date.now() + STAGE3_EYES_SEC*1000;
      t.lastShown = -1;
      setStage('stage3');
      stage3EnsureTick();
    }

    
// ANCHOR: REFRESH_PER_PLAYER (odświeżenia hasła per gracz / mecz)
function initRefreshById(){
  if(!state || !state.game) return;
  const c = state && state.cfg && state.cfg.classic ? state.cfg.classic : null;
  const on = !!(c && c.refreshOn);
  const per = on ? ((Number(c.refreshCount) === 0) ? Infinity : Math.max(0, Number(c.refreshCount)||0)) : 0;
  const map = {};
  (players||[]).forEach(p=>{ if(p && p.id) map[String(p.id)] = per; });
  state.game.refreshById = map;
}

function refreshLeftFor(id){
  const map = state && state.game ? state.game.refreshById : null;
  if(!map || !id) return 0;
  const v = map[String(id)];
  return (v === Infinity) ? Infinity : Math.max(0, Number(v||0));
}

function consumeRefreshFor(id){
  if(!state || !state.game || !state.game.refreshById || !id) return;
  const k = String(id);
  const v = state.game.refreshById[k];
  if(v === Infinity) return;
  state.game.refreshById[k] = Math.max(0, Number(v||0) - 1);
}

function canStage3Refresh(){
      const c = state && state.cfg && state.cfg.classic ? state.cfg.classic : null;
      if(!c || !c.refreshOn) return false;
      const t = stage3Turn();
      const presenterId = String(t.presenterId || getCurrentPresenterId() || '');
      const left = refreshLeftFor(presenterId);
      return (left === Infinity) || (Number(left) > 0);
    }

    // [PH][S3] Pomiń odliczanie (3A -> 3B). Nie zależy od refreshy.
    function stage3SkipCountdown(){
      if(!state || !state.game || state.game.stage !== 'stage3') return;
      const t = stage3Turn();
      const ph = t.phase || 'eyes';
      if(ph !== 'eyes') return;
      stage3SetPhase('word');
    }

    // [PH][S3] Odśwież hasło (tylko w 3B) — zużywa refresh aktualnego prezentera.
    function stage3RefreshWord(){
      if(!state || !state.game || state.game.stage !== 'stage3') return;
      const t = stage3Turn();
      const ph = t.phase || 'eyes';
      if(ph !== 'word') return;
      if(!canStage3Refresh()) return;

      const presenterId = String(t.presenterId || getCurrentPresenterId() || '');
      consumeRefreshFor(presenterId);
      stage3SetPhase('word', { refreshWord:true });
    }

    function stage3Stop(reason){
      const t = stage3Turn();
      t.lastStop = { reason: String(reason||'manual'), at: Date.now() };
      stage3SetPhase('verdict');
    }

    function stage3Verdict(guessed){
      if(!state || !state.game || state.game.stage !== 'stage3') return;
      const t = stage3Turn();
      t.verdict = guessed ? 'yes' : 'no';
      t.verdictAt = Date.now();
      // reset Stage 4 picks (unikamy starych wyborów po cofnięciu)
      t.guesserId = '';
      t.presenterPoint = false;
      clearStage3Timers();
      setStage('stage4');
    }

    // ANCHOR: STAGE4 (rozliczenie po werdykcie)
    function stage4Turn(){ return stage3Turn(); }

    function stage4SetGuesser(id){
      const t = stage4Turn();
      const pid = String(id||'');
      // PATCH S4-02: ponowne kliknięcie odznacza (UX: łatwo poprawić wybór)
      t.guesserId = (String(t.guesserId||'') === pid) ? '' : pid;
      renderGameStage();
    }

    function stage4TogglePresenterPoint(){
      const t = stage4Turn();
      t.presenterPoint = !t.presenterPoint;
      renderGameStage();
    }

    function stage4Back(){
      // powrót do werdyktu (Stage 3E), żeby poprawić decyzję
      setStage('stage3');
      try{ stage3SetPhase('verdict'); }catch(_e){}
    }

    function stage4Save(){
      const t = stage4Turn();
      const verdict = String(t.verdict||'');
      const presenterId = String(t.presenterId||getCurrentPresenterId()||'');
      const guesserId = String(t.guesserId||'');

      if(verdict === 'yes' && !guesserId){
        // bez zgadującego nie zapisujemy (UI powinno blokować, ale tu jest safety)
        return;
      }

      if(verdict === 'yes'){
        addScore(guesserId, 1);
      }

      if(t.presenterPoint){
        addScore(presenterId, 1);
      }

      // PATCH S4-OVER: limit punktów kończy grę TYLKO gdy wybrane jest "Punkty"
      const cfg = (state && state.cfg && state.cfg.classic) ? state.cfg.classic : { winBy:'rounds', targetScore: 0 };
      const winBy = normWinBy(cfg.winBy);
      if(winBy === 'score'){
        const target = Number(cfg.targetScore)||0;
        if(target > 0){
          const reached = players.some(pp=>{
            const sc = Number(pp && pp.score);
            const v = Number.isFinite(sc) ? sc : 0;
            return v >= target;
          });
          if(reached){
            if(state && state.game){
              state.game.gameOver = { by:'score', target, at: Date.now() };
            }
            setStage('stage5');
            return;
          }
        }
      }

      // przygotuj następnego prezentera
      ensureOrderForStage2();
      const ordered = getPlayersInOrder();
      const n = ordered.length;

      if(n > 0){
        const c = (state && state.cfg && state.cfg.classic) ? state.cfg.classic : { presentOrder:'sequential' };
        const po = normPresentOrder(c.presentOrder);

        const prevIdx = Number(state?.game?.presenterIdx||0);

        // 1) licznik tur w rundzie (ważne dla trybu "kto zgadł odpowiada")
        state.game.turnsDone = (Number(state?.game?.turnsDone||0) || 0) + 1;
        const turnsDone = Number(state?.game?.turnsDone||0) || 0;

        
// 2) wylicz następnego prezentera
let nextIdx = (prevIdx + 1) % n; // fallback: po kolei

if(po === 'guesser'){
  // jeśli w bazowej kolejce był teraz kolejny gracz (baseNextIdx), to przesuwamy wskaźnik bazowy dalej
  const bNext = Number(state?.game?.baseNextIdx);
  if(Number.isFinite(bNext) && bNext === prevIdx){
    state.game.baseLastIdx = bNext;
    state.game.baseNextIdx = (bNext + 1) % n;
  }

  if(verdict === 'yes' && guesserId){
    const ids = Array.isArray(state?.game?.orderIds) ? state.game.orderIds.map(String) : [];
    const gi = ids.indexOf(String(guesserId));
    if(gi >= 0) nextIdx = gi;
  }else{
    // nikt nie zgadł -> wracamy do bazowej kolejki losowania
    const bn = Number(state?.game?.baseNextIdx);
    if(Number.isFinite(bn) && bn >= 0 && bn < n) nextIdx = bn;
  }
}else if(po === 'sequential'){
  nextIdx = (prevIdx + 1) % n;
}

state.game.presenterIdx = nextIdx;

        // 3) reset turn (żeby nie przenosić werdyktu/wyborów)
        state.game.turn = { phase:null, endAt:0, word:'', catId:'', catLabel:'', presenterId:'', verdict:'', verdictAt:0, guesserId:'', presenterPoint:false, lastStop:null };

        // 4) koniec rundy
        const lastOfRound = (po === 'guesser') ? (turnsDone >= n) : (prevIdx >= n - 1);
        if(lastOfRound){
          setStage('stage5');
          return;
        }
      }

      // następna tura w tej rundzie
      setStage('stage2');
    }


    


    // ANCHOR: STAGE5 (podsumowanie rundy / gry)
    function stage5IsFinalByRounds(){
      const cfg = (state && state.cfg && state.cfg.classic) ? state.cfg.classic : { winBy:'rounds', roundsTotal: 0 };
      if(normWinBy(cfg.winBy) !== 'rounds') return false;
      const total = Number(cfg.roundsTotal)||0;
      const rn = Number(state?.game?.roundNo)||1;
      return total > 0 && rn >= total;
    }

    // PATCH S5-OVER: finał także po osiągnięciu limitu punktów
    function stage5IsFinal(){
      if(stage5IsFinalByRounds()) return true;
      return !!(state && state.game && state.game.gameOver);
    }

    function stage5NextRound(){
      if(stage5IsFinal()) return;
      if(!state || !state.game) return;
      state.game.roundNo = (Number(state.game.roundNo)||1) + 1;
      clearStage1Timers();
      resetStage1OrderState();
      reshuffleStage1Layout();
      state.game.rolling = false;
      state.game.focusId = null;
      state.game.presenterIdx = 0;
      state.game.baseLastIdx = 0;
      state.game.baseNextIdx = 1;
      state.game.turnsDone = 0;
      setStage('stage1');
    }

    function stage5BackToMenu(){
      requestExitToMenu();
    }

    function tplStage5(){
      ensureOrderForStage2();
      const ordered = getPlayersInOrder();
      const cfg = (state && state.cfg && state.cfg.classic) ? state.cfg.classic : { winBy:'rounds', roundsTotal: 0 };
      const winBy = normWinBy(cfg.winBy);
      const total = (winBy === 'rounds') ? (Number(cfg.roundsTotal)||0) : 0;
      const roundNo = Number(state?.game?.roundNo)||1;
      const isFinal = stage5IsFinal();
      const totalTxt = (total === 0) ? '∞' : String(total);
      const title = isFinal ? 'PODSUMOWANIE GRY' : `PODSUMOWANIE RUNDY ${roundNo}/${totalTxt}`;

      // sort: punkty malejąco, potem alfabetycznie (stabilniej przy remisach)
      const sorted = ordered.slice().sort((a,b)=>{
        const as = Number(a && a.score);
        const bs = Number(b && b.score);
        const av = Number.isFinite(as) ? as : 0;
        const bv = Number.isFinite(bs) ? bs : 0;
        if(bv !== av) return bv - av;
        const an = String((a && a.name) || '').toLowerCase();
        const bn = String((b && b.name) || '').toLowerCase();
        return an.localeCompare(bn, 'pl');
      });

      // Remisy: wspólne miejsce dotyczy TYLKO podium (1/2/3).
      // Dla pozostałych miejsc numerujemy normalnie (4,5,6...) niezależnie od remisów.
      const scores = sorted.map(p=>{
        const s = Number(p && p.score);
        return Number.isFinite(s) ? s : 0;
      });
      const topScores = Array.from(new Set(scores)).slice(0,3); // max 3 różne wyniki
      let nonPodiumRank = topScores.length + 1;

      const rows = sorted.length ? sorted.map((p)=>{
        const scn = Number(p && p.score);
        const sc = Number.isFinite(scn) ? scn : 0;
        const podiumRank = topScores.indexOf(sc);
        const rank = podiumRank >= 0 ? (podiumRank + 1) : (nonPodiumRank++);
        const podium = rank===1?' stage5-p1':rank===2?' stage5-p2':rank===3?' stage5-p3':'';
        const nm = (p && p.name) ? String(p.name) : 'Gracz';
        const em = (p && p.emoji) ? String(p.emoji) : '🙂';
        // [PH][S5] Miejsce (#) jest POZA kartą gracza (z lewej), karta zostaje wycentrowana w STAGE5_LIST.
        // Układ: grid 3 kolumny (miejsce | karta | spacer) -> spacer symetryczny, żeby karta była idealnie na środku.
        return `
          <div class="stage5-item" data-dbg2="STAGE5_ITEM">
            <div class="stage5-place${podium}" aria-label="Miejsce w rankingu">#${rank}</div>
            <div class="stage5-row player-pill${podium}" data-dbg2="STAGE5_ROW">
              <div class="pp-emoji">${escHtml(em)}</div>
              <div class="pp-meta">
                <div class="pp-name"><span class="pp-name-txt">${escHtml(nm)}</span></div>
              </div>
              <div class="stage5-score">${escHtml(String(sc))}</div>
            </div>
            <div class="stage5-place stage5-place--spacer" aria-hidden="true">#</div>
          </div>
        `;
      }).join('') : `<div class="stage5-empty">Brak graczy.</div>`;

      // Lider / zwycięzcy (uwzględniamy remis na 1 miejscu)
      const lead = sorted[0] || null;
      const leadScore = lead ? (Number.isFinite(Number(lead.score)) ? Number(lead.score) : 0) : 0;
      const leaders = lead ? sorted.filter(pp=>{
        const s = Number(pp && pp.score);
        const v = Number.isFinite(s) ? s : 0;
        return v === leadScore;
      }) : [];
      const leadNames = leaders.length ? leaders.map(pp=>String(pp.name||'—')).join(', ') : '—';
      const leadTxt = leaders.length ? `${leadNames} (${leadScore})` : '—';
      const subLabel = isFinal
        ? (leaders.length>1 ? 'Zwycięzcy:' : 'Zwycięzca:')
        : (leaders.length>1 ? 'Aktualni liderzy:' : 'Aktualny lider:');
      const sub = `${subLabel} <span class="stage5-leader">${escHtml(leadTxt)}</span>`;

      const btnNext = !isFinal ? `<button type="button" class="btn-new btn-lg" data-action="stage5:nextRound">Następna runda</button>` : '';

      return `
        <div class="stage stage-5" data-dbg2="STAGE_5" aria-label="Stage 5 - Podsumowanie">
          <div class="stage-card" data-dbg2="STAGE_CARD">
            <div class="stage5-wrap" data-dbg2="STAGE5_WRAP">
              <div class="stage5-head">
                <div class="stage5-title">${escHtml(title)}</div>
                <div class="stage5-sub">${sub}</div>
              </div>

              <div class="stage5-list scroll-surface" data-dbg2="STAGE5_LIST">
                ${rows}
              </div>

              <div class="stage5-actions" data-dbg2="STAGE5_ACTIONS">
                ${btnNext}
                <button type="button" class="btn-ghost btn-lg" data-action="stage5:menu">Powrót do menu</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    // ANCHOR: SCORE_HELPERS (punkty w trakcie gry)
    function addScore(playerId, delta=1){
      const id = String(playerId||'');
      if(!id) return;
      const p = players.find(pp=>String(pp.id)===id);
      if(!p) return;
      const cur = Number(p.score);
      const base = Number.isFinite(cur) ? cur : 0;
      const d = Number(delta);
      p.score = base + (Number.isFinite(d) ? d : 0);
      // persist (players są w partyhub_kalambury_mode)
      try{ saveMode(); }catch(_e){}
    }

    // [PH][S3_HINTS] Podpowiedzi pod timerem (Stage 3D): ilość słów / kategoria (wg ustawień trybu)
    function tplStage3Hints(turn){
      const c = (state && state.cfg && state.cfg.classic) ? state.cfg.classic : null;
      if(!c || !c.hintsOn) return '';

      const out = [];

      if(!!c.hintWords){
        const w = String((turn && turn.word) || '').trim();
        const wc = w ? w.split(/\s+/).filter(Boolean).length : 0;
        out.push(
          `<div class="stage3-hint"><span class="stage3-hint-label">Ilość słów:</span><span class="stage3-hint-val">${escHtml(wc ? String(wc) : '—')}</span></div>`
        );
      }

      if(!!c.hintCategory){
        out.push(
          `<div class="stage3-hint"><span class="stage3-hint-label">Kategoria:</span><span class="stage3-hint-val is-accent">${escHtml((turn && turn.catLabel) || '—')}</span></div>`
        );
      }

      if(!out.length) return '';
      return `<div class="stage3-hints" data-dbg2="STAGE3_HINTS">${out.join('')}</div>`;
    }

function tplStage3(){
      // Stage 3: TV-safe sekwencja (bez ujawniania hasła publicznie)
      // 3A: uwaga -> 3B: hasło -> 3C: gotowość (START) -> 3D: prezentacja (timer) -> 3E: werdykt
      // UI: wykorzystujemy ten sam układ karty prezentera co w Stage 2 (PREZENTUJE + kwadratowy pill).
      ensureOrderForStage2();
      const ordered = getPlayersInOrder();
      const t = stage3Turn();
      const ph = t.phase || 'eyes';

      const presenterId = t.presenterId || getCurrentPresenterId();
      const presenter = ordered.find(p=>String(p.id)===String(presenterId)) || ordered[0] || null;
      const presenterName = (presenter && presenter.name) ? String(presenter.name) : 'Gracz';

      const left = stage3Left();
      const cfg = (state && state.cfg && state.cfg.classic) ? state.cfg.classic : { turnSeconds:90 };
      const turnSec = Number(cfg.turnSeconds)||0;
      const timerTxt = (turnSec === 0) ? '∞' : String(left);

      let top = '', mid = '', bot = '';

      if(ph === 'eyes'){
        // [PH][S3A] większy komunikat + progress border na STAGE3_MAIN
        top = `<div class="stage3-msg stage3-msg-lg">UWAGA! Hasło prezentera pojawi się za:</div>`;
        mid = `<div class="stage3-count" id="stage3Count">${escHtml(String(left))}</div>`;
        bot = `<div class="stage3-sub">Wszyscy poza prezenterem proszeni są o zamknięcie na chwilę oczu.</div>`;
      }else if(ph === 'word'){
        // [PH][S3B] większy komunikat + progress border na STAGE3_MAIN
        top = `<div class="stage3-msg stage3-msg-lg">Twoje hasło <span class="stage3-pname">${escHtml(presenterName)}</span> to:</div>`;
        // Refresh (per gracz / mecz): jeśli feature włączony, trzymamy stałe miejsce obok wordboxa
        // (nawet gdy refreshy się skończą) — żeby STAGE3_WORD nie zmieniał szerokości.
        const hasRefresh = !!(cfg && cfg.refreshOn);
        const pid = String(t.presenterId || presenterId || getCurrentPresenterId() || '');
        const rLeft = hasRefresh ? refreshLeftFor(pid) : 0;
        const rTxt = (rLeft === Infinity) ? '∞' : String(rLeft);
        const canR = hasRefresh && ((rLeft === Infinity) || (Number(rLeft) > 0));

        const refreshBtn = hasRefresh
          ? `<button type="button" class="stage3-refresh${canR ? '' : ' is-hidden'}" data-action="stage3:refresh" aria-label="Zmień hasło" title="Zmień hasło">
              <span class="s3r-top">Masz</span>
              <span class="s3r-ico" aria-hidden="true">🔃</span>
              <span class="s3r-bot"><span class="s3r-num">${escHtml(rTxt)}</span> odświeżeń</span>
            </button>`
          : ``;
        const refreshSlot = hasRefresh ? `<div class="stage3-refresh-slot" aria-hidden="true"></div>` : ``;
        mid = `
          <div class="stage3-wordrow${hasRefresh ? ' has-refresh' : ''}" data-dbg2="STAGE3_WORDROW">
            ${refreshSlot}
            <div class="stage3-wordbox" data-dbg2="STAGE3_WORD">
              <div class="stage3-wordArea" data-dbg2="STAGE3_WORD_AREA">
                <div class="stage3-word">${escHtml(t.word || '—')}</div>
              </div>
              <div class="stage3-catArea" data-dbg2="STAGE3_CAT_AREA">
                <div class="stage3-cat">
                  <span class="stage3-cat-label">Kategoria:</span>
                  <span class="stage3-cat-val">${escHtml(t.catLabel || '—')}</span>
                </div>
              </div>
            </div>
            ${refreshBtn}
          </div>
        `;
        bot = `<div class="stage3-sub">Hasło zniknie za:</div><div class="stage3-count" id="stage3Count">${escHtml(String(left))}</div>`;
      }else if(ph === 'ready'){
        top = `<div class="stage3-msg">Prezenterze jeśli jesteś gotowy kliknij:</div>`;
        mid = `<button type="button" class="btn-new btn-lg stage3-start-btn" data-action="stage3:start">START</button>`;
      }else if(ph === 'verdict'){
        // [PH][S3E] copy + TAK/NIE
        top = `<div class="stage3-msg">Czy hasło zostało odgadnięte?</div>`;
        mid = `
          <div class="stage3-verdict-row" data-dbg2="STAGE3_VERDICT">
            <button type="button" class="btn-new stage3-verdict-btn" data-action="stage3:yes">TAK</button>
            <button type="button" class="btn-reset stage3-verdict-btn" data-action="stage3:no">NIE</button>
          </div>
        `;
      }else{
        // act = 3D (prezentacja)
        top = `<div class="stage3-actlabel">Czas do końca prezentowania</div>`;
        mid = `<div class="stage3-timer" id="stage3Timer">${escHtml(timerTxt)}</div>`;
        bot = tplStage3Hints(t);
      }

      return `
        <div class="stage stage-3" data-dbg2="STAGE_3" aria-label="Stage 3 - Tura prezentera">
          <div class="stage-card" data-dbg2="STAGE_CARD">
            <div class="stage3-wrap" data-phase="${escHtml(ph)}">

              <div class="stage3-head" data-dbg2="STAGE3_HEAD">
                <div class="stage2-presenter stage3-presenter" data-dbg2="STAGE3_PRESENTER" aria-label="Prezentuje">
                  <div class="stage2-presenter-label" aria-hidden="true">PREZENTUJE</div>
                  ${presenter ? tplPresenterPill(presenter) : ''}
                </div>
              </div>

              <div class="stage3-main" data-dbg2="STAGE3_MAIN">
<div class="stage3-top">${top}</div>
                <div class="stage3-mid">${mid}</div>
                <div class="stage3-bot">${bot}</div>
              </div>

            </div>
          </div>
        </div>
      `;
    }

    
    function tplStage4(){
      ensureOrderForStage2();
      const ordered = getPlayersInOrder();
      const t = stage4Turn();

      const verdict = String(t.verdict||'');
      const vLabel = (verdict === 'yes') ? 'ZGADLI' : (verdict === 'no') ? 'NIE ZGADLI' : '—';

      const presenterId = String(t.presenterId||getCurrentPresenterId()||'');
      const presenter = ordered.find(p=>String(p.id)===presenterId) || ordered[0] || null;

      const canPick = (verdict === 'yes');
      const guesserId = String(t.guesserId||'');
      const presenterPoint = !!t.presenterPoint;

      const pickList = ordered
        .filter(p=>String(p.id)!==presenterId) // prezenter nie zgaduje
        .map(p=>{
          const pid = String(p.id||'');
          const isSel = canPick && pid && pid === guesserId;
          return `
            <button type="button"
              class="stage4-pick player-pill${isSel ? ' is-selected' : ''}"
              data-action="stage4:pickGuesser"
              data-player-id="${pid}"
              aria-pressed="${isSel ? 'true' : 'false'}"
            >
              <div class="pp-emoji">${p.emoji || '🙂'}</div>
              <div class="pp-meta">
                <div class="pp-name">${escHtml(p.name || 'Gracz')}</div>
                <div class="pp-score"><span class="pp-score-num">${Number.isFinite(Number(p.score))?Number(p.score):0}</span></div>
              </div>
            </button>
          `;
        }).join('');

      // [PH][S4] UI: gdy NIE ZGADLI — pokazujemy tylko centralny napis + opcjonalny punkt dla prezentera
      const isNoGuess = (verdict === 'no');

      // [PH][S4] Head (tylko dla "ZGADLI")
      const headTitle = 'KTO ZGADŁ?';
      const head = isNoGuess ? '' : `
        <div class="stage4-head" data-dbg2="STAGE4_HEAD">
          <div class="stage3-msg">${escHtml(headTitle)}</div>
        </div>
      `;

      const presenterName = presenter ? String(presenter.name||'Prezentujący') : 'Prezentujący';

      const toggleRow = `
        <div class="stage4-toggle" data-dbg2="STAGE4_TOGGLE">
          <div class="stage4-toggle-label"><span class="stage4-toggle-plus">+1</span> punkt dla prezentera: <span class="stage4-toggle-name">${escHtml(presenterName)}</span>, jeśli uważacie, że zasłużył/a</div>
          <label class="switch">
            <input type="checkbox" data-action="stage4:togglePresenterPoint" ${presenterPoint ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      `;

      const hint = isNoGuess ? '' : 'Wybierz wynik i zapisz.';
      const saveDisabled = (verdict === 'yes' && !guesserId) ? 'disabled' : '';

      return `
        <div class="stage stage-4" data-dbg2="STAGE_4" aria-label="Stage 4 - Rozliczenie">
          <div class="stage-card" data-dbg2="STAGE_CARD">
            <div class="stage4-wrap" data-dbg2="STAGE4_WRAP">
              ${head}

              <div class="stage4-gridwrap scroll-surface${isNoGuess ? ' is-none' : ''}" data-dbg2="STAGE4_GRIDWRAP">
                ${isNoGuess
                  ? `<div class="s4-none-guessed" data-dbg2="STAGE4_NONE">
                      <div class="s4-none-title">NIKT NIE ZGADŁ</div>
                      ${t.word ? `<div class="s4-none-word">Hasło prezentera to: <span class="s4-none-wordval">${escHtml(String(t.word))}</span>.</div>` : ``}
                    </div>`
                  : `<div class="stage4-grid" data-dbg2="STAGE4_GRID">${pickList || `<div class="stage4-empty">Brak graczy.</div>`}</div>`
                }
              </div>

              <div class="stage4-bottom" data-dbg2="STAGE4_BOTTOM">
                ${toggleRow}
                ${hint ? `<div class="stage4-hint">${escHtml(hint)}</div>` : ''}

                <div class="stage4-actions" data-dbg2="STAGE4_ACTIONS">
                  <button type="button" class="btn-ghost btn-sm stage4-back" data-action="stage4:back">← Wróć</button>
                  <button type="button" class="btn-new btn-lg stage4-save" data-action="stage4:save" ${saveDisabled}>Zapisz i dalej</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      `;
    }
    // ANCHOR: STAGE1_TIMERS (losowanie + auto przejście)
    const STAGE1_ADV_MS = 5000;
    let __rollT = null;
    let __afterPickT = null;
    let __stage1AdvRAF = null;

    function clearStage1Timers(){
      if(__rollT){ clearTimeout(__rollT); __rollT = null; }
      if(__afterPickT){ clearTimeout(__afterPickT); __afterPickT = null; }
      if(__stage1AdvRAF){ cancelAnimationFrame(__stage1AdvRAF); __stage1AdvRAF = null; }
      try{ stage1ClearAdvanceProgress(); }catch(_e){}
    }

    function stage1SetAdvanceProgress(p){
      const grid = getStage1Grid();
      if(!grid) return;
      grid.classList.add('is-advancing');
      grid.style.setProperty('--p', String(p));
    }

    function stage1ClearAdvanceProgress(){
      const grid = getStage1Grid();
      if(!grid) return;
      grid.classList.remove('is-advancing');
      grid.style.removeProperty('--p');
    }

    function stage1StartAutoAdvance(){
      if(!stage1IsActive()) return;
      if(!state || !state.game) return;
      if(state.game.stage1AutoDone) return;
      state.game.stage1AutoDone = true;
      state.game.stage1Locked = true;

      // progress po obramówce przez 5s, potem Stage 2
      const start = performance.now();
      stage1SetAdvanceProgress(0);

      const tick = (now)=>{
        if(!stage1IsActive()) { stage1ClearAdvanceProgress(); return; }
        const t = (now - start) / STAGE1_ADV_MS;
        const p = Math.max(0, Math.min(1, t));
        stage1SetAdvanceProgress(p.toFixed(4));
        if(p < 1){ __stage1AdvRAF = requestAnimationFrame(tick); return; }
        __stage1AdvRAF = null;
        stage1ClearAdvanceProgress();
        if(stage1IsActive()) setGameStage('stage2');
      };

      if(__stage1AdvRAF){ cancelAnimationFrame(__stage1AdvRAF); __stage1AdvRAF = null; }
      __stage1AdvRAF = requestAnimationFrame(tick);
    }

    function resetStage1OrderState(){
      state.game.orderIds = [];
      state.game.orderPos = {};
      state.game.focusId = null;
      state.game.forceDeck = false;
      state.game.stage1Locked = false;
      state.game.stage1AutoDone = false;
    }

    function stage1IsActive(){
      return !!(state && state.game && state.game.stage === 'stage1');
    }

    function getStage1Grid(){
      return gameHud ? gameHud.querySelector('.stage1-grid') : null;
    }

    function getStage1Cards(){
      const grid = getStage1Grid();
      if(!grid) return [];
      return Array.from(grid.querySelectorAll('.player-pill[data-player-id]'));
    }

    // ANCHOR: STAGE1_DECK_ANIM (deck -> grid "rozłożenie" po kliknięciu losowania)
    function stage1MotionEnabled(){
      if(document.body.classList.contains('motion-off')) return false;
      // jeśli user wyłączył animacje w ustawieniach
      if(state && state.settings && state.settings.motionOn === false) return false;
      return true;
    }

    // ANCHOR: STAGE1_DECK_ANIM_TOKENS (płynniejsze składanie/rozkładanie)
    const STAGE1_DECK_ANIM = {
      spreadDur: 740,
      spreadStagger: 52,
      stackDur: 520,
      stackStagger: 34,
      easing: 'cubic-bezier(.16,1,.3,1)',
      blurPx: 0.6,
      fade: 0.03
    };

    function setStage1DeckMode(on){
      const grid = getStage1Grid();
      if(!grid) return;
      grid.classList.toggle('is-deck', !!on);
    }

    function spreadStage1DeckThen(cb){
      const grid = getStage1Grid();
      if(!grid) return cb && cb();
      if(!grid.classList.contains('is-deck')) return cb && cb();

      // bez animacji (motion-off) => tylko przełącz layout
      if(!stage1MotionEnabled()){
        grid.classList.remove('is-deck');
        return cb && cb();
      }

      const cards = getStage1Cards();
      if(!cards.length){
        grid.classList.remove('is-deck');
        return cb && cb();
      }

      // FLIP: First
      const first = new Map();
      cards.forEach(el=>first.set(el, el.getBoundingClientRect()));

      // przełącz na grid
      grid.classList.remove('is-deck');

      requestAnimationFrame(()=>{
        // FLIP: Last
        const last = new Map();
        cards.forEach(el=>last.set(el, el.getBoundingClientRect()));

        // FLIP: Invert
        cards.forEach((el, i)=>{
          const a = first.get(el);
          const b = last.get(el);
          if(!a || !b) return;

          const dx = a.left - b.left;
          const dy = a.top - b.top;
          const sx = b.width ? (a.width / b.width) : 1;
          const sy = b.height ? (a.height / b.height) : 1;

          el.style.willChange = 'transform, filter, opacity';
          el.style.transition = 'transform 0s, filter 0s, opacity 0s';
          el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`;
          el.style.opacity = String(1 - (STAGE1_DECK_ANIM.fade || 0));
          el.style.filter = `blur(${STAGE1_DECK_ANIM.blurPx || 0}px)`;
          el.style.removeProperty('transition-delay');
        });

        requestAnimationFrame(()=>{
          let pending = cards.length;
          const maxStagger = Math.min(7, cards.length - 1);

          const cleanup = () => {
            cards.forEach(el=>{
              el.style.willChange = '';
              el.style.transition = '';
              el.style.filter = '';
              el.style.opacity = '';
              el.style.transform = '';
              el.style.removeProperty('transition-delay');
            });
          };

          const doneOne = () => {
            pending--;
            if(pending <= 0){
              cleanup();
              if(cb) cb();
            }
          };

          cards.forEach((el, i)=>{
            const delay = Math.min(i, maxStagger) * (STAGE1_DECK_ANIM.spreadStagger || 0);
            const dur = (STAGE1_DECK_ANIM.spreadDur || 680);
            const ease = (STAGE1_DECK_ANIM.easing || 'cubic-bezier(.2,.9,.2,1)');
            el.style.transition = `transform ${dur}ms ${ease}, filter ${dur}ms ${ease}, opacity ${dur}ms ${ease}`;
            el.style.transitionDelay = delay + 'ms';

            const onEnd = (ev) => {
              if(ev.propertyName !== 'transform') return;
              el.removeEventListener('transitionend', onEnd);
              doneOne();
            };
            el.addEventListener('transitionend', onEnd);

            // FLIP: Play
            el.style.opacity = '1';
            el.style.filter = 'blur(0px)';
            el.style.transform = '';
          });

          // safety timeout
          setTimeout(()=>{
            if(pending > 0){
              pending = 0;
              cleanup();
              if(cb) cb();
            }
          }, (STAGE1_DECK_ANIM.spreadDur || 680) + 600 + (maxStagger * (STAGE1_DECK_ANIM.spreadStagger || 45)) );
        });
      });
    }

    // ANCHOR: STAGE1_DECK_STACK (grid -> deck "złożenie" po zakończeniu losowania)
    function stackStage1GridToDeckThen(cb){
      const grid = getStage1Grid();
      if(!grid) return cb && cb();
      if(grid.classList.contains('is-deck')) return cb && cb();

      if(!stage1MotionEnabled()){
        grid.classList.add('is-deck');
        return cb && cb();
      }

      const cards = getStage1Cards();
      if(!cards.length){
        grid.classList.add('is-deck');
        return cb && cb();
      }

      // FLIP: First (grid)
      const first = new Map();
      cards.forEach(el=>first.set(el, el.getBoundingClientRect()));

      // przełącz na deck
      grid.classList.add('is-deck');

      requestAnimationFrame(()=>{
        // FLIP: Last (deck)
        const last = new Map();
        cards.forEach(el=>last.set(el, el.getBoundingClientRect()));

        // FLIP: Invert
        cards.forEach((el)=>{
          const a = first.get(el);
          const b = last.get(el);
          if(!a || !b) return;

          const dx = a.left - b.left;
          const dy = a.top - b.top;
          const sx = b.width ? (a.width / b.width) : 1;
          const sy = b.height ? (a.height / b.height) : 1;

          el.style.willChange = 'transform, filter, opacity';
          el.style.transition = 'transform 0s, filter 0s, opacity 0s';
          el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`;
          el.style.opacity = String(1 - (STAGE1_DECK_ANIM.fade || 0));
          el.style.filter = `blur(${STAGE1_DECK_ANIM.blurPx || 0}px)`;
          el.style.removeProperty('transition-delay');
        });

        requestAnimationFrame(()=>{
          let pending = cards.length;
          const maxStagger = Math.min(7, cards.length - 1);

          const cleanup = () => {
            cards.forEach(el=>{
              el.style.willChange = '';
              el.style.transition = '';
              el.style.filter = '';
              el.style.opacity = '';
              el.style.transform = '';
              el.style.removeProperty('transition-delay');
            });
          };

          const doneOne = () => {
            pending--;
            if(pending <= 0){
              cleanup();
              if(cb) cb();
            }
          };

          cards.forEach((el, i)=>{
            const delay = Math.min(i, maxStagger) * (STAGE1_DECK_ANIM.stackStagger || 0);
            const dur = (STAGE1_DECK_ANIM.stackDur || 460);
            const ease = (STAGE1_DECK_ANIM.easing || 'cubic-bezier(.2,.9,.2,1)');
            el.style.transition = `transform ${dur}ms ${ease}, filter ${dur}ms ${ease}, opacity ${dur}ms ${ease}`;
            el.style.transitionDelay = delay + 'ms';

            const onEnd = (ev) => {
              if(ev.propertyName !== 'transform') return;
              el.removeEventListener('transitionend', onEnd);
              doneOne();
            };
            el.addEventListener('transitionend', onEnd);

            // FLIP: Play
            el.style.opacity = '1';
            el.style.filter = 'blur(0px)';
            el.style.transform = '';
          });

          // safety timeout
          setTimeout(()=>{
            if(pending > 0){
              pending = 0;
              cleanup();
              if(cb) cb();
            }
          }, (STAGE1_DECK_ANIM.stackDur || 460) + 360 + (maxStagger * (STAGE1_DECK_ANIM.stackStagger || 28)) );
        });
      });
    }

    // ANCHOR: STAGE1_FINALIZE_ORDER (po wylosowaniu wszystkich: złożenie do środka -> układ 1..N)
    function finalizeStage1AfterAllPicked(){
      if(!stage1IsActive()) return finishStage1Roll();

      const total = Array.isArray(players) ? players.length : 0;
      const done = total >= 2 && Array.isArray(state.game.orderIds) && state.game.orderIds.length === total;
      if(!done) return finishStage1Roll();

      clearStage1Timers();
      state.game.focusId = null;
      getStage1Cards().forEach(x=>x.classList.remove('roll-focus'));

      const grid = getStage1Grid();
      if(grid) grid.classList.add('is-rolling');
      renderBottomBar();

      // 1) złóż do decka (avatary już są odkryte)
      stackStage1GridToDeckThen(()=>{
        // 2) docelowy układ wg kolejności 1..N
        state.game.layoutIds = state.game.orderIds.slice().map(String);

        // 3) wyrenderuj w trybie deck, żeby rozłożyć do nowego układu
        state.game.forceDeck = true;
        renderGameStage();

        const grid2 = getStage1Grid();
        if(grid2) grid2.classList.add('is-rolling');

        // 4) rozłóż z decka do siatki — już w kolejności 1..N
        spreadStage1DeckThen(()=>{
          state.game.forceDeck = false;
          finishStage1Roll();
          // po zakończeniu sekwencji (układ 1..N) startujemy auto odliczanie do Stage 2
          stage1StartAutoAdvance();
        });
      });
    }

    function getRemainingStage1Cards(){
      const all = getStage1Cards();
      return all.filter(el=>{
        const id = el.dataset.playerId;
        return id && !(state.game.orderPos && state.game.orderPos[id]);
      });
    }

    function setFocusCard(el){
      const all = getStage1Cards();
      all.forEach(x=>x.classList.remove('roll-focus'));
      if(el) el.classList.add('roll-focus');
      state.game.focusId = el ? (el.dataset.playerId || null) : null;
    }

    function revealPickedCard(el, pos){
      if(!el) return;
      el.classList.remove('is-facedown');
      el.classList.add('stage1-picked');
      const badge = el.querySelector('.pp-order');
      if(badge){
        badge.textContent = String(pos);
        badge.classList.remove('is-hidden');
      }
    }

    function finishStage1Roll(){
      state.game.rolling = false;
      state.game.focusId = null;
      clearStage1Timers();

      const grid = getStage1Grid();
      if(grid) grid.classList.remove('is-rolling');

      // usuń focus
      getStage1Cards().forEach(x=>x.classList.remove('roll-focus'));

      renderBottomBar();
    }

    function rollStage1Order(){
      if(!state || !state.game) return;
      if(!stage1IsActive()) return;
      if(state.game.rolling) return;
      if(state.game.stage1Locked) return;

      const list = Array.isArray(players) ? players : [];
      if(list.length < 2) return;

      // reset + rerender => wszystkie karty z powrotem rewersem + "deck"
      clearStage1Timers();
      resetStage1OrderState();
      reshuffleStage1Layout();
      renderGameStage();

      const grid = getStage1Grid();
      const allCards = getStage1Cards();
      if(!grid || allCards.length < 2) return;

      // blokuj przycisk już podczas rozkładania
      state.game.rolling = true;
      grid.classList.add('is-rolling');
      renderBottomBar();

      const runCycle = () => {
        if(!stage1IsActive() || !state.game.rolling) return finishStage1Roll();

        const remaining = getRemainingStage1Cards();
        if(remaining.length === 0) return finishStage1Roll();

        let prevIdx = -1;
        const isLastCard = (remaining.length === 1);
        const total = isLastCard ? 6 : Math.max(10, Math.round(remaining.length * 1.25) + 5 + Math.floor(Math.random()*3));
        let step = 0;

        const tick = () => {
          if(!stage1IsActive() || !state.game.rolling) return finishStage1Roll();

          // (remaining w tym cyklu jest stałe)
          let idx = 0;
          if(remaining.length === 1) idx = 0;
          else{
            do{ idx = Math.floor(Math.random()*remaining.length); }while(idx === prevIdx);
          }

          const el = remaining[idx];
          setFocusCard(el);
          prevIdx = idx;

          step++;
          const t = step / total;
          const delay = isLastCard
            ? Math.round(55 + (t*t) * 90)  // ostatnia karta: szybciej
            : Math.round(95 + (t*t) * 160); // ease-out (wolniej, ale krócej całościowo)

          if(step < total){
            __rollT = setTimeout(tick, delay);
            return;
          }

          // WYBÓR: wylosowana karta
          const picked = remaining[idx];
          const pid = picked ? picked.dataset.playerId : null;
          if(!pid) return finishStage1Roll();

          const pos = (Array.isArray(state.game.orderIds) ? state.game.orderIds.length : 0) + 1;
          state.game.orderIds = Array.isArray(state.game.orderIds) ? state.game.orderIds : [];
          state.game.orderIds.push(pid);
          state.game.orderPos[pid] = pos;

          // flip + badge
          revealPickedCard(picked, pos);

          // jeśli to ostatnia karta: złóż do środka i rozłóż w kolejności 1..N
          const totalNow = Array.isArray(players) ? players.length : 0;
          if(pos >= totalNow){
            __afterPickT = setTimeout(() => {
              if(!stage1IsActive() || !state.game.rolling) return finishStage1Roll();
              finalizeStage1AfterAllPicked();
            }, 260);
            return;
          }

          // chwilka na animację i następny cykl (z pominięciem wylosowanych)
          __afterPickT = setTimeout(() => {
            if(!stage1IsActive() || !state.game.rolling) return finishStage1Roll();
            runCycle();
          }, 340);
        };

        tick();
      };

      // Najpierw: rozłóż karty z decka do siatki, potem start losowania.
      spreadStage1DeckThen(() => {
        runCycle();
      });
    }

// ANCHOR: STAGE_RENDER
    function renderBottomBar(){
      if(!bottomBar) return;
      const s = (state && state.game && state.game.stage) ? state.game.stage : 'idle';

      if(s === 'stage1'){
        const rolling = !!(state && state.game && state.game.rolling);
        const total = Array.isArray(players) ? players.length : 0;
        const done = !rolling && total >= 2 && Array.isArray(state.game.orderIds) && state.game.orderIds.length === total;

        if(done){
          // po losowaniu nie ma rerolla ani przycisku dalej — przejście jest automatyczne (progress na obramówce)
          bottomBar.innerHTML = '';
          return;
        }

        const locked = !!(state && state.game && state.game.stage1Locked);
        const label = rolling ? 'Losuję…' : 'Losowanie kolejności';
        bottomBar.innerHTML =
          `<button class="btn-new btn-lg btn-roll-order" id="btnRollOrder" data-action="stage1:roll" type="button" ${(rolling || locked) ? 'disabled' : ''}>${label}</button>`;
        return;
      }

      if(s === 'stage2'){
        // [PH][S2] UX: w Stage 2 nie pokazujemy powrotu do losowania (Stage 1)
        bottomBar.innerHTML =
          `<div class="bb-actions">
             <button class="btn-new btn-lg bb-main" id="btnStage2StartTurn" data-action="stage2:startTurn" type="button">Start tury</button>
           </div>`;
        return;
      }

if(s === 'stage3'){
  const ph = (state && state.game && state.game.turn && state.game.turn.phase) ? state.game.turn.phase : 'eyes';

  if(ph === 'act'){
    bottomBar.innerHTML = `<button class="btn-reset btn-lg btn-roll-order" data-action="stage3:stop" type="button">STOP</button>`;
    return;
  }

  // 3A: można pominąć odliczanie; 3B: refresh jest przy haśle; 3C: START jest w main
  if(ph === 'eyes'){
    bottomBar.innerHTML = `<button class="btn-ghost btn-lg btn-roll-order" data-action="stage3:skipCountdown" type="button">Pomiń odliczanie</button>`;
    return;
  }

  bottomBar.innerHTML = '';
  return;
}

if(s === 'stage4' || s === 'stage5'){
        // [PH][S4] UX: Stage 4 ma swoje akcje w planszy (bottom bar pusty)
        bottomBar.innerHTML = '';
        return;
      }


      bottomBar.innerHTML = '';
    }

    function renderGameStage(){
      if(!gameHud) return;
      const id = (state && state.game && state.game.stage) ? state.game.stage : 'idle';
      (STAGES[id] || STAGES.idle).render();
      syncTopBarMeta();
    }

    // ANCHOR: START_TO_STAGE1
    function openGameScreen(){
      showOverlay(overlayGame);

      // START nowej gry => reset punktów (żeby nie przenosić wyniku po powrocie do menu)
      resetPlayersScores();

      // START => zawsze zaczynamy od "deck" (karty na sobie rewersem)
      clearStage1Timers();
      resetStage1OrderState();
      reshuffleStage1Layout();
      state.game.rolling = false;
      state.game.focusId = null;
      state.game.presenterIdx = 0;
      state.game.baseLastIdx = 0;
      state.game.baseNextIdx = 1;
      state.game.roundNo = 1;
      state.game.turnsDone = 0;
      state.game.gameOver = null;

      // [PH] Refresh hasła per gracz / mecz
      try{ initRefreshById(); }catch(_e){ state.game.refreshById = {}; }

      try{
        setGameStage('stage1');
      }catch(e){
        console.error('[PH] startGame: setGameStage failed', e);
      }

      // [PH] START_STAGE_RENDER_FALLBACK_BEGIN
      requestAnimationFrame(()=>{
        const gh = document.getElementById('gameHud');
        const hasStage = gh && gh.querySelector('.stage');
        if(!hasStage && gh){
          try{
            gh.innerHTML = tplStage1();
            applyTwemoji(gh);
          }catch(_e){}
        }
      });
      // [PH] START_STAGE_RENDER_FALLBACK_END
    }

    // ANCHOR: PLAYERS_SYSTEM (1:1 z 5 Sekund)

const EMOJI_GROUPS = {
      people:["😃","😁","🤣","🙃","🫠","😊","😇","🥰","😍","🤩","😋","🤪","😝","🤑","🤫","🤐","😑","😶","🫥","😶‍🌫️","😬","🤥","😴","🤢","🤮","🥵","🥶","🥴","😵‍💫","🤯","🤠","🥳","🥸","😎","🤓","🧐","😱","🥱","😤","😡","🤬","😈","🤡"],
      animals:["🐵","🦍","🐶","🐺","🦊","🦝","🐱","🦁","🐯","🦄","🦌","🐮","🐷","🐗","🐭","🐹","🐰","🦇","🐻","🐻‍❄️","🐨","🐼","🦥","🐔","🐸","🐲","🦈","🐙","🐌","🦋","🕷️","🐞","🪰","🪱","🦠"],
      other:["💩","💀","👹","👻","👽️","👾","🤖","⛄️","🎃","😻","😼","😹","🙉","👶","🥷","🎅"]
    };
    const EMOJIS = [...EMOJI_GROUPS.people, ...EMOJI_GROUPS.animals, ...EMOJI_GROUPS.other];
players = [];
draftPlayer = null; // ANCHOR: PLAYER_DRAFT (bez mignięcia placeholdera na liście)
    let emojiPickerCategory = 'people';
emojiPickerForId = null;
tempSelectedEmoji = null;

    function cryptoId(){ return Math.random().toString(16).slice(2)+Date.now().toString(16); }

    function validateStart(){
      const hasMinPlayers = players.length >= 2;
      const allHaveEmoji = players.every(p => p.emoji && p.emoji !== '+');
      const hasCats = Array.isArray(state.cfg.classic.categories) && state.cfg.classic.categories.length >= 1;
      const canStart = !!state.selectedMode && hasMinPlayers && allHaveEmoji && validateCfg();
      if(btnStartGame) btnStartGame.disabled = !canStart;

      const hint = $('startHint');
      if(!hint) return;
      const parts = [];
      if(!hasMinPlayers) parts.push('Dodaj min. 2 graczy');
      if(!allHaveEmoji) parts.push('Uzupełnij avatary');
      if(!hasCats) parts.push('Wybierz min. 1 kategorię');
      hint.textContent = parts.length ? ('Aby rozpocząć: ' + parts.join(' • ')) : '';
    }

    function addPlayer(){
      if(players.length>=8) return;
      const newId = cryptoId();
      draftPlayer = { id:newId, name:'', emoji:'+', score:0, wins:0 };
      openEmojiPicker(newId, true);
    }

    function removePlayer(id){
      const i = players.findIndex(p=>p.id===id);
      if(i>=0) players.splice(i,1);
      renderPlayers();
      validateStart();
      saveMode();
    }

    function findEmojiCategory(emoji){
      if(EMOJI_GROUPS.people.includes(emoji)) return 'people';
      if(EMOJI_GROUPS.animals.includes(emoji)) return 'animals';
      if(EMOJI_GROUPS.other.includes(emoji)) return 'other';
      return 'people';
    }

    function openEmojiPicker(id, isNew=false){
      const title = $('emojiPickerTitle');
      if(title) title.textContent = isNew ? 'Nowy gracz' : 'Edytuj gracza';
      emojiPickerForId = id;

      const p = players.find(x=>x.id===id) || (draftPlayer && draftPlayer.id===id ? draftPlayer : null);
      tempSelectedEmoji = (!isNew && p && p.emoji && p.emoji !== '+') ? p.emoji : null;

      const nameInput = $('emojiPickerNameInput');
      if(nameInput){
        nameInput.value = (p && p.name) ? p.name : '';
        nameInput.placeholder = isNew ? 'Nazwa gracza (min. 3 znaki)' : 'Wpisz nazwę...';
      }

      emojiPickerCategory = isNew ? 'people' : findEmojiCategory(p ? p.emoji : null);
      syncEmojiTabs();
      renderEmojiGrid();

      const err = $('emojiPickerError');
      if(err){ err.textContent = ''; err.classList.add('is-hidden'); err.classList.remove('txt-error'); }

      updateEmojiPickerConfirmButton();
      showO('emojiPickerOverlay');
      setTimeout(()=>{ if(nameInput) nameInput.focus(); }, 200);
    }

    function setEmojiCategory(cat){
      emojiPickerCategory = (cat==='animals' || cat==='other') ? cat : 'people';
      syncEmojiTabs();
      renderEmojiGrid();
    }

    function syncEmojiTabs(){
      const a = $('emojiTabPeople'), b = $('emojiTabAnimals'), c = $('emojiTabOther');
      if(a) a.classList.toggle('selected', emojiPickerCategory==='people');
      if(b) b.classList.toggle('selected', emojiPickerCategory==='animals');
      if(c) c.classList.toggle('selected', emojiPickerCategory==='other');
    }

    function renderEmojiGrid(){
      const grid = $('emojiGrid');
      if(!grid) return;
      grid.innerHTML = '';

      const p = players.find(x=>x.id===emojiPickerForId) || (draftPlayer && draftPlayer.id===emojiPickerForId ? draftPlayer : null);
      const selected = tempSelectedEmoji || (p ? p.emoji : null);

      const taken = new Set(players.filter(pp=>pp.id!==emojiPickerForId).map(pp=>pp.emoji));

      const list = (emojiPickerCategory==='animals') ? EMOJI_GROUPS.animals
        : (emojiPickerCategory==='other') ? EMOJI_GROUPS.other
          : EMOJI_GROUPS.people;

      list.forEach(e=>{
        const b=document.createElement('button');
        b.type='button';
        b.dataset.emoji=e;
        const isTaken = taken.has(e);
        b.disabled = isTaken;
        b.className='emoji-btn' + (e===selected ? ' selected' : '') + (isTaken ? ' disabled' : '');
        b.textContent=e;
        if(!isTaken) b.addEventListener('click', ()=>selectEmojiTemporary(e));
        grid.appendChild(b);
      });

      applyTwemoji(grid);
    }

    function selectEmojiTemporary(emoji){
      tempSelectedEmoji = emoji;
      const grid = $('emojiGrid');
      if(grid) grid.querySelectorAll('.emoji-btn').forEach(b=>b.classList.toggle('selected', b.dataset.emoji===emoji));
      updateEmojiPickerConfirmButton();
    }

    function updateEmojiPickerConfirmButton(){
      const btn = $('btnConfirmEmoji');
      const nameInput = $('emojiPickerNameInput');
      const err = $('emojiPickerError');

      const p = players.find(x=>x.id===emojiPickerForId) || (draftPlayer && draftPlayer.id===emojiPickerForId ? draftPlayer : null);
      const baseEmoji = p ? p.emoji : null;
      const effectiveEmoji = tempSelectedEmoji || baseEmoji;

      const nameRaw = nameInput ? nameInput.value.trim() : '';
      const nameOk = nameRaw.length >= 3;
      const emojiOk = effectiveEmoji && effectiveEmoji !== '+';

      const nName = normName(nameRaw);
      const nameTaken = !!(nName && players.some(pp => pp.id !== emojiPickerForId && normName(pp.name) === nName));
      const emojiTaken = !!(emojiOk && players.some(pp => pp.id !== emojiPickerForId && pp.emoji === effectiveEmoji));

      let msg = '';
      if(nameOk && nameTaken) msg = 'Ta nazwa jest już zajęta.';
      else if(emojiOk && emojiTaken) msg = 'Ten avatar jest już zajęty.';

      const canConfirm = !!(nameOk && emojiOk && !nameTaken && !emojiTaken);
      if(btn) btn.disabled = !canConfirm;

      if(err){
        err.textContent = msg;
        err.classList.toggle('is-hidden', !msg);
        err.classList.toggle('txt-error', !!msg);
      }
    }

    function confirmEmojiPicker(){
      const p0 = players.find(x=>x.id===emojiPickerForId) || (draftPlayer && draftPlayer.id===emojiPickerForId ? draftPlayer : null);
      const selectedEmoji = tempSelectedEmoji || (p0 ? p0.emoji : null);
      if(!selectedEmoji || selectedEmoji === '+') return;

      const nameInput = $('emojiPickerNameInput');
      const name = nameInput ? nameInput.value.trim() : '';
      if(name.length < 3) return;

      const nName = normName(name);
      const nameTaken = !!(nName && players.some(pp => pp.id !== emojiPickerForId && normName(pp.name) === nName));
      const emojiTaken = !!players.some(pp => pp.id !== emojiPickerForId && pp.emoji === selectedEmoji);
      if(nameTaken || emojiTaken){ updateEmojiPickerConfirmButton(); return; }

      if(draftPlayer && draftPlayer.id === emojiPickerForId && !players.some(x=>x.id===emojiPickerForId)){
        draftPlayer.emoji = selectedEmoji;
        draftPlayer.name = name;
        players.push(draftPlayer);
        draftPlayer = null;
        saveMode();
        renderPlayers();
        validateStart();
        hideO('emojiPickerOverlay');
        tempSelectedEmoji = null;
        emojiPickerForId = null;
        return;
      }

      const p = players.find(x=>x.id===emojiPickerForId);
      if(!p) return;
      p.emoji = selectedEmoji;
      p.name = name;
      saveMode();
      renderPlayers();
      validateStart();
      hideO('emojiPickerOverlay');
      tempSelectedEmoji = null;
      emojiPickerForId = null;
    }

    function cancelEmojiPicker(){
      if(draftPlayer && draftPlayer.id === emojiPickerForId && !players.some(x=>x.id===emojiPickerForId)){
        draftPlayer = null;
        hideO('emojiPickerOverlay');
        tempSelectedEmoji = null;
        emojiPickerForId = null;
        validateStart();
        return;
      }
      hideO('emojiPickerOverlay');
      tempSelectedEmoji = null;
      emojiPickerForId = null;
    }

    function renderPlayers(){
      const list = $('playersList');
      if(!list) return;
      list.innerHTML = '';

      players.forEach(p=>{
        const row = document.createElement('div');
        row.className = 'player-row';
        row.dataset.playerId = p.id;

        const emojiDisplay = document.createElement('div');
        emojiDisplay.className = 'player-emoji-display';
        emojiDisplay.textContent = p.emoji;

        const nameDisplay = document.createElement('div');
        nameDisplay.className = 'player-name-display';
        nameDisplay.textContent = p.name;

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'player-edit';
        editBtn.textContent = '✏️';
        editBtn.addEventListener('click', ()=>openEmojiPicker(p.id,false));

        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'player-del';
        del.textContent = '✖';
        del.addEventListener('click', ()=>removePlayer(p.id));

        row.append(emojiDisplay, nameDisplay, editBtn, del);
        list.appendChild(row);
      });

      if(playersSummary) playersSummary.textContent = `${players.length}/8`;
      const isFull = players.length >= 8;
      if(addPlayerBtn) addPlayerBtn.disabled = isFull;
      if(playersLimit) playersLimit.classList.toggle('is-hidden', !isFull);
      applyTwemoji(list);
      scheduleFitNames();
    }

    function saveMode(){
      try{
        const payload = { players: players.map(p=>({ id:p.id, name:p.name, emoji:p.emoji, score:(Number.isFinite(Number(p.score))?Number(p.score):0), wins:(p.wins||0) })) };
        localStorage.setItem('partyhub_kalambury_mode', JSON.stringify(payload));
      }catch(_e){}
    }

    function loadMode(){
      try{
        const s = localStorage.getItem('partyhub_kalambury_mode');
        if(!s) return;
        const m = JSON.parse(s);
        if(!m || !Array.isArray(m.players)) return;

        let changed = false;
        const usedNames = new Set();
        const usedEmoji = new Set();
        const next = [];

        const pickEmoji = (raw) => {
          const e0 = String(raw||'').trim();
          let e = (e0 && e0 !== '+' && EMOJIS.includes(e0)) ? e0 : EMOJI_GROUPS.people[0];
          if(e !== e0) changed = true;

          if(!usedEmoji.has(e)){ usedEmoji.add(e); return e; }

          changed = true;
          for(const cand of EMOJIS){
            if(!usedEmoji.has(cand)){ usedEmoji.add(cand); return cand; }
          }
          return null;
        };

        const pickName = (raw, idx) => {
          const base0 = String(raw||'').trim().replace(/\s+/g,' ');
          const base = base0.length ? base0 : ('Gracz ' + (idx+1));
          if(base !== base0) changed = true;

          let name = base;
          let n = 2;
          while(usedNames.has(normName(name))){ name = base + ' ' + (n++); changed = true; }
          usedNames.add(normName(name));
          return name;
        };

        m.players.slice(0, 50).forEach((pp, idx)=>{
          if(!pp || next.length>=8) return;

          const idIn = pp.id;
          const id = String(pp.id || cryptoId());
          if(String(idIn||'') !== id) changed = true;

          const emoji = pickEmoji(pp.emoji);
          if(!emoji) return;

          const name = pickName(pp.name, idx);

          const winsRaw = parseInt(pp.wins, 10);
          const wins = Number.isFinite(winsRaw) ? Math.max(0, winsRaw) : 0;
          if(wins !== (pp.wins||0)) changed = true;

          next.push({ id, name, emoji, score:(Number.isFinite(Number(pp && pp.score))?Number(pp.score):0), wins });
        });

        players = next;
        if(changed) saveMode();
      }catch(_e){}
    }

    // ANCHOR: EVENTS
    document.querySelectorAll('.mode-card').forEach(card => {
      const header = card.querySelector('.mode-header');
      const btnPlay = card.querySelector('[data-mode-play]');
      const btnInfo = card.querySelector('[data-mode-info]');

      if(header){
        header.addEventListener('click', () => {
          const modeId = card.dataset.mode;
          toggleModeCard(card);
          if(modeId === 'wip') return;
          selectMode(modeId);
        });

        header.addEventListener('keydown', (e) => {
          if(e.key === 'Enter' || e.key === ' '){
            e.preventDefault();
            const modeId = card.dataset.mode;
            toggleModeCard(card);
            if(modeId === 'wip') return;
            selectMode(modeId);
          }
        });
      }

      if(btnPlay){
        btnPlay.addEventListener('click', (e) => {
          e.stopPropagation();
          const modeId = card.dataset.mode;
          if(modeId === 'wip') return;
          selectMode(modeId);
          openModeSettings();
        });
      }

      if(btnInfo){
        btnInfo.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openRulesOverlay();
        });
      }
    });

    // [PH] MODE_INFO_DELEGATION_BEGIN (fallback gdy pojedyncze listenery sie nie podpiely)
    document.addEventListener('click', (e)=>{
      const btn = e.target && e.target.closest ? e.target.closest('[data-mode-info]') : null;
      if(!btn) return;
      e.preventDefault();
      e.stopPropagation();
      openRulesOverlay();
    }, true);
    // [PH] MODE_INFO_DELEGATION_END

    if(btnBackToHome) btnBackToHome.addEventListener('click', backToHome);
    if(btnBackToHub) btnBackToHub.addEventListener('click', goToHub);

    // ANCHOR: GLOBAL_SETTINGS_OPEN
    if(btnGlobalSettings) btnGlobalSettings.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); showGlobalSettings(); });
    // ANCHOR: EXIT_TO_MENU (obsługiwane niżej przez BACK_TO_MENU_CONFIRM)

    // ANCHOR: GAME_FLOW_REMOVED (plansza gry + logika rundy wycięte — silnik będzie budowany od zera)
    // ANCHOR: CONFIRM_EVENTS (moved to core/ui.js)

    // ANCHOR: CLEAR_DATA (działa zawsze)
    if(btnClearData){
      btnClearData.onclick = () => openConfirm({
        title:'Wyczyścić dane gry?',
        message:'Usunie zapisanych graczy i ustawienia Kalambur na tym urządzeniu.',
        okText:'Wyczyść',
        cancelText:'Anuluj',
        okClass:'btn-reset',
        onConfirm: clearGameData
      });
    }

    // ANCHOR: SETTINGS_CARDS_LOGIC
    function toggleSettingCard(card){
      if(!card) return;
      const isOpen = card.classList.contains('open');
      document.querySelectorAll('#overlayModeSettings .setting-card').forEach(c=>c.classList.remove('open'));
      if(!isOpen) card.classList.add('open');
    }

    function initSettingCards(){
      if(!modeSettingsCards) return;
      modeSettingsCards.querySelectorAll('.setting-card').forEach(card=>{
        const head = card.querySelector('.setting-head');
        if(!head || head.dataset.bound==='1') return;
        head.addEventListener('click', () => toggleSettingCard(card));
        head.addEventListener('keydown', (e) => {
          if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggleSettingCard(card); }
        });
        head.dataset.bound='1';
      });
    }

    function syncRoundSummary(){
      if(!roundSummary) return;
      const c = state.cfg.classic;
      const winBy = normWinBy(c && c.winBy);
      const parts = [
        (c.turnSeconds===0) ? '∞ czas' : (Number.isFinite(c.turnSeconds) ? `${c.turnSeconds}s` : null),
        (winBy==='score')
          ? ((c.targetScore===0) ? '∞ pkt' : (Number.isFinite(c.targetScore) ? `do ${c.targetScore} pkt` : null))
          : null,
        (winBy==='rounds')
          ? ((c.roundsTotal===0) ? '∞ rund' : (Number.isFinite(c.roundsTotal) ? `${c.roundsTotal} rund` : null))
          : null,
        (c.refreshOn)
          ? ((c.refreshCount===0) ? '∞ refreshy/gracz' : (Number.isFinite(c.refreshCount) ? `${c.refreshCount} refreshy/gracz` : null))
          : null,
      ].filter(Boolean);
      roundSummary.textContent = parts.join(' • ');
    }

    // ANCHOR: SETTINGS_EVENTS
    if(addPlayerBtn) addPlayerBtn.addEventListener('click', ()=>{ addPlayer(); });
    if(btnRulesOk) btnRulesOk.addEventListener('click', () => { hideO('rulesOverlay'); });
    if(btnGlobalSettingsClose) btnGlobalSettingsClose.addEventListener('click', hideGlobalSettings);
    if(btnEmojiCancel) btnEmojiCancel.addEventListener('click', ()=>{ cancelEmojiPicker(); });

    const btnConfirmEmoji = $('btnConfirmEmoji');
    if(btnConfirmEmoji) btnConfirmEmoji.addEventListener('click', confirmEmojiPicker);
    if(emojiPickerNameInput) emojiPickerNameInput.addEventListener('input', updateEmojiPickerConfirmButton);

    // emoji tabs: delegacja
    if(emojiTabs) emojiTabs.addEventListener('click', (e)=>{
      const b = e.target.closest('[data-emoji-cat]');
      if(!b) return;
      setEmojiCategory(b.dataset.emojiCat);
    });

    // Kategorie
    if(catsGrid) catsGrid.addEventListener('click', (e)=>{ const b=e.target.closest('[data-cat]'); if(b) toggleCategory(b.dataset.cat); });
    if(btnCatsAll) btnCatsAll.addEventListener('click', setAllCategories);
    if(btnCatsRandom) btnCatsRandom.addEventListener('click', randomCategories);
    if(btnCatsNone) btnCatsNone.addEventListener('click', clearCategories);

    if(soundToggle) soundToggle.addEventListener('change', (e)=>setSoundOn(e.target.checked));
    if(soundToggleGame) soundToggleGame.addEventListener('change', (e)=>setSoundOn(e.target.checked));
    if(motionToggle) motionToggle.addEventListener('change', (e)=>setMotionOn(e.target.checked));

    // ANCHOR: WINBY_EVENTS (punkty vs rundy) + HINTS_MASTER_EVENTS
    if(cardModeSettings) cardModeSettings.addEventListener('click', (e)=>{
      const h = e.target.closest('[data-hints-master]');
      if(h){
        e.preventDefault();
        e.stopPropagation();
        state.cfg.classic.hintsOn = (String(h.dataset.hintsMaster||'') === 'on');
        saveCfg();
        syncHintsUI();
        validateStart();
        return;
      }

      const r = e.target.closest('[data-refresh-master]');
      if(r){
        e.preventDefault();
        e.stopPropagation();
        state.cfg.classic.refreshOn = (String(r.dataset.refreshMaster||'') === 'on');
        saveCfg();
        syncRefreshUI();
        validateStart();
        return;
      }

      const po = e.target.closest('[data-present-order]');
      if(po){
        e.preventDefault();
        e.stopPropagation();
        state.cfg.classic.presentOrder = normPresentOrder(po.dataset.presentOrder);
        saveCfg();
        syncPresentOrderUI();
        validateStart();
        return;
      }

      const b = e.target.closest('[data-winby]');
      if(!b) return;
      e.preventDefault();
      e.stopPropagation();
      state.cfg.classic.winBy = normWinBy(b.dataset.winby);
      saveCfg();
      syncWinByUI();
      syncRoundSummary();
      validateStart();
    });
    // ANCHOR: HINT_TYPES_EVENTS (Ilość słów / Kategoria)
    if(rowHintsTypes) rowHintsTypes.addEventListener('click', (e)=>{
      const b = e.target.closest('[data-hint]');
      if(!b) return;
      e.preventDefault();
      e.stopPropagation();
      const c = state.cfg.classic;
      if(!c || !c.hintsOn) return;
      const key = String(b.dataset.hint||'');
      if(key === 'words') c.hintWords = !c.hintWords;
      else if(key === 'category') c.hintCategory = !c.hintCategory;
      saveCfg();
      syncHintsUI();
      validateStart();
    });

    if(cfgTurnSeconds) cfgTurnSeconds.addEventListener('input', readCfgFromUI);
    if(cfgTargetScore) cfgTargetScore.addEventListener('input', readCfgFromUI);
    if(cfgRoundsTotal) cfgRoundsTotal.addEventListener('input', readCfgFromUI);
    if(cfgRefreshCount) cfgRefreshCount.addEventListener('input', readCfgFromUI);

    // klik w wartości pod sliderami (ticki)
    bindRangeScalePick();

    if(btnStartGame) btnStartGame.addEventListener('click', () => {
      // ANCHOR: START_TO_GAME_OVERLAY (na razie: tylko pusty overlay planszy)
      openGameScreen();
    });
    // ANCHOR: GAME_OVERLAY_EVENTS
    // TOP BAR: zawsze widoczna zębatka ustawień (OSOBNE ustawienia planszy)
    if(btnGameSettings) btnGameSettings.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      showGameSettings();
    });

    // ANCHOR: GAME_SETTINGS_EVENTS
    if(btnGameSettingsClose) btnGameSettingsClose.addEventListener('click', hideGameSettings);
    if(btnGameExitToMenu) btnGameExitToMenu.addEventListener('click', ()=>{
      hideGameSettings();
      requestExitToMenu();
    });



    


    // INIT
    loadSettings();

    // domyślnie: respektuj ustawienie systemu (jeśli user nie zapisał jeszcze własnego)
    if(!motionWasSaved){
      const sysReduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      state.settings.motionOn = !sysReduce;
    }

    applySettingsToUI();
    loadCfg();
    applyCfgToUI();
    renderCategories();
    loadMode();

    if(txtVersion) txtVersion.textContent = GAME_VERSION;
    if(homeVersion) homeVersion.textContent = 'Wersja: ' + GAME_VERSION;

    showOverlay(overlayHome);
    renderPlayers();
    validateStart();

    // ANCHOR: DEV_STAGE_INIT
    // ANCHOR: TWEMOJI_BOOT
    whenTwemojiReady(()=>{
      renderPlayers();
      const ep = $('emojiPickerOverlay');
      if(ep && ep.classList.contains('is-visible')) renderEmojiGrid();
    });

    
