/* PartyHUB — Who's Most Likely / Kto Najprawdopodobniej
   Logika gry.
   [PH] GAME_LOGIC_BEGIN
*/

(function () {
    'use strict';

    const VERSION = '1.0.0';
    const LS_PREFIX = 'ph_whoslikely_';

    // =============================
    // DOM refs
    // =============================
    const $ = (id) => document.getElementById(id);

    const overlayHome = $('overlayHome');
    const overlayModeSettings = $('overlayModeSettings');
    const overlayGame = $('overlayGame');
    const gameSettingsOverlay = $('gameSettingsOverlay');
    const rulesOverlay = $('rulesOverlay');
    const globalSettingsOverlay = $('globalSettingsOverlay');
    const emojiPickerOverlay = $('emojiPickerOverlay');

    const playersList = $('playersList');
    const playersSummary = $('playersSummary');
    const addPlayerBtn = $('addPlayerBtn');
    const btnStartGame = $('btnStartGame');
    const startHint = $('startHint');

    const gameHud = $('gameHud');
    const bottomBar = $('bottomBar');
    const topTitle = $('topTitle');
    const roundInfo = $('roundInfo');

    const catsGrid = $('catsGrid');
    const catsSummary = $('catsSummary');
    const catsCount = $('catsCount');

    const cfgRoundsTotal = $('cfgRoundsTotal');
    const roundsTotalBadge = $('roundsTotalBadge');
    const roundSummary = $('roundSummary');
    const adultToggle = $('adultToggle');
    const guestPinInput = $('guestPinInput');

    // Multiplayer DOM
    const lobbyQrCode = $('lobbyQrCode');
    const lobbyPinCode = $('lobbyPinCode');
    const lobbyPlayersGrid = $('lobbyPlayersGrid');
    const lobbyPlayerCount = $('lobbyPlayerCount');
    const overlayHostLobby = $('overlayHostLobby');
    const overlayGuestJoin = $('overlayGuestJoin');
    const overlayGuestWaiting = $('overlayGuestWaiting');
    const overlayGuestGame = $('overlayGuestGame');
    const guestVoteGrid = $('guestVoteGrid');
    const guestQuestion = $('guestQuestion');
    const guestStatusBar = $('guestStatusBar');

    // =============================
    // State
    // =============================
    const ROUNDS_MAP = [5, 8, 10, 12, 15, 18, 20, Infinity];
    const MAX_PLAYERS = 12;
    const MIN_PLAYERS = 3;

    let players = [];
    let selectedCategories = new Set();
    let cfg = {
        rounds: 12,
        adult: false,
        sound: true,
        motion: true
    };

    // Game state
    let gameState = {
        mode: 'local', // 'local', 'host', 'guest'
        stage: 'home',
        questions: [],
        usedQuestions: [],
        currentQuestion: null,
        currentRound: 0,
        totalRounds: 12,
        votes: {}, // voterId -> votedForId
        votingPlayerIndex: 0 // Only for local mode
    };

    // Multiplayer state
    let mpHost = null;
    let mpGuest = null;
    let myGuestId = null; // For guest mode

    // Emoji picker state
    let emojiPickerMode = 'add'; // 'add' | 'edit'
    let emojiPickerEditIndex = -1;
    let emojiPickerSelected = null;

    const EMOJI_CATS = {
        people: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😛', '🤪', '😎', '🤓', '🧐', '🤠', '🥳', '😏', '😌', '🤗', '🤭', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫠', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥴', '😵', '🤯', '🥱', '😤', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'],
        animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐈', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'],
        other: ['⭐', '🌟', '✨', '💫', '🔥', '💥', '💯', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🎮', '🕹️', '🎲', '🧩', '♟️', '🎯', '🎳', '🎸', '🎺', '🎷', '🪘', '🎹', '🎻', '🎤', '🎧', '📻', '🎬', '🎭', '🎨', '🖼️', '🎪', '🎢', '🎡', '🎠', '🏖️', '🏕️', '⛺', '🏔️', '🗻', '🌋', '🏝️', '🏜️', '🌅', '🌄', '🌠', '🌌', '🌈', '🌊', '💎', '💰', '💵', '💴', '💶', '💷', '💳', '🛒', '🛍️', '🎒', '👑', '👒', '🎩', '🧢', '👓', '🕶️', '🥽', '💍', '💄', '💋', '👠', '👟', '👢', '🧳', '☂️', '🌂']
    };

    // =============================
    // Helpers
    // =============================
    function showO(el) {
        if (typeof el === 'string') el = $(el);
        if (el) el.classList.add('is-visible');
    }

    function hideO(el) {
        if (typeof el === 'string') el = $(el);
        if (el) el.classList.remove('is-visible');
    }

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function escHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // =============================
    // Storage
    // =============================
    function loadPlayers() {
        try {
            const raw = localStorage.getItem(LS_PREFIX + 'players');
            if (raw) players = JSON.parse(raw);
        } catch (_e) { }
        if (!Array.isArray(players)) players = [];
    }

    function savePlayers() {
        try {
            localStorage.setItem(LS_PREFIX + 'players', JSON.stringify(players));
        } catch (_e) { }
    }

    function loadCfg() {
        try {
            const raw = localStorage.getItem(LS_PREFIX + 'cfg');
            if (raw) Object.assign(cfg, JSON.parse(raw));
        } catch (_e) { }
    }

    function saveCfg() {
        try {
            localStorage.setItem(LS_PREFIX + 'cfg', JSON.stringify(cfg));
        } catch (_e) { }
    }

    function loadCategories() {
        try {
            const raw = localStorage.getItem(LS_PREFIX + 'cats');
            if (raw) selectedCategories = new Set(JSON.parse(raw));
        } catch (_e) { }
        if (selectedCategories.size === 0) {
            // Default: all non-adult categories
            WHOSLIKELY_QUESTIONS.categories.forEach(cat => {
                if (!cat.adult) selectedCategories.add(cat.id);
            });
        }
    }

    function saveCategories() {
        try {
            localStorage.setItem(LS_PREFIX + 'cats', JSON.stringify([...selectedCategories]));
        } catch (_e) { }
    }

    // =============================
    // Mode cards (accordion)
    // =============================
    function initModeCards() {
        document.querySelectorAll('.mode-card').forEach(card => {
            const header = card.querySelector('.mode-header');
            if (!header) return;

            header.addEventListener('click', () => {
                const isOpen = card.classList.contains('open');
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('open'));
                if (!isOpen) card.classList.add('open');
            });

            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    header.click();
                }
            });
        });

        // Play button
        document.querySelectorAll('[data-mode-play]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // If it's local play button inside the card
                if (btn.dataset.modePlay === 'local') {
                    gameState.mode = 'local';
                    hideO(overlayHome);
                    showO(overlayModeSettings);
                    renderSettings();
                }
            });
        });

        // Info button
        document.querySelectorAll('[data-mode-info]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showO(rulesOverlay);
            });
        });
    }

    // =============================
    // Settings cards (accordion)
    // =============================
    function initSettingsCards() {
        document.querySelectorAll('.setting-card').forEach(card => {
            const head = card.querySelector('.setting-head');
            if (!head) return;

            head.addEventListener('click', () => {
                const isOpen = card.classList.contains('open');
                document.querySelectorAll('.setting-card').forEach(c => c.classList.remove('open'));
                if (!isOpen) card.classList.add('open');
            });

            head.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    head.click();
                }
            });
        });
    }

    // =============================
    // Render settings
    // =============================
    function renderSettings() {
        renderPlayers();
        renderCategories();
        updateRoundsUI();
        updateStartButton();
    }

    function renderPlayers() {
        if (!playersList) return;
        playersList.innerHTML = '';

        players.forEach((p, i) => {
            const row = document.createElement('div');
            row.className = 'player-row';
            row.innerHTML = `
        <div class="player-emoji-display">${escHtml(p.emoji)}</div>
        <div class="player-name-display">${escHtml(p.name)}</div>
        <button class="player-edit" data-idx="${i}" title="Edytuj">✏️</button>
        <button class="player-del" data-idx="${i}" title="Usuń">✕</button>
      `;
            playersList.appendChild(row);
        });

        // Bind edit/delete
        playersList.querySelectorAll('.player-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx, 10);
                openEmojiPicker('edit', idx);
            });
        });

        playersList.querySelectorAll('.player-del').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx, 10);
                players.splice(idx, 1);
                savePlayers();
                renderPlayers();
                updateStartButton();
            });
        });

        if (playersSummary) {
            playersSummary.textContent = `${players.length}/${MAX_PLAYERS}`;
        }

        // Disable add button if max
        if (addPlayerBtn) {
            addPlayerBtn.disabled = players.length >= MAX_PLAYERS;
        }
    }

    function renderCategories() {
        if (!catsGrid) return;
        catsGrid.innerHTML = '';

        const cats = WHOSLIKELY_QUESTIONS.categories.filter(c => cfg.adult || !c.adult);

        cats.forEach(cat => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'cat-chip' + (selectedCategories.has(cat.id) ? ' selected' : '');
            chip.textContent = cat.name;
            chip.dataset.catId = cat.id;
            chip.addEventListener('click', () => {
                if (selectedCategories.has(cat.id)) {
                    selectedCategories.delete(cat.id);
                } else {
                    selectedCategories.add(cat.id);
                }
                saveCategories();
                renderCategories();
                updateStartButton();
            });
            catsGrid.appendChild(chip);
        });

        // Update count
        const total = cats.length;
        const sel = [...selectedCategories].filter(id => cats.find(c => c.id === id)).length;
        if (catsCount) catsCount.textContent = `${sel}/${total}`;
        if (catsSummary) catsSummary.textContent = sel === total ? 'Wszystkie' : `${sel} z ${total}`;
    }

    function updateRoundsUI() {
        if (!cfgRoundsTotal) return;
        const idx = parseInt(cfgRoundsTotal.value, 10) - 1;
        const val = ROUNDS_MAP[idx] || 10;
        cfg.rounds = val;

        if (roundsTotalBadge) {
            roundsTotalBadge.textContent = val === Infinity ? '∞' : val;
        }
        if (roundSummary) {
            roundSummary.textContent = val === Infinity ? 'Bez limitu' : `${val} pytań`;
        }
        saveCfg();
    }

    function updateStartButton() {
        const canStart = players.length >= MIN_PLAYERS && selectedCategories.size > 0;
        if (btnStartGame) btnStartGame.disabled = !canStart;

        if (startHint) {
            if (players.length < MIN_PLAYERS) {
                startHint.textContent = `Dodaj min. ${MIN_PLAYERS} graczy`;
            } else if (selectedCategories.size === 0) {
                startHint.textContent = 'Wybierz przynajmniej 1 kategorię';
            } else {
                startHint.textContent = '';
            }
        }
    }

    // =============================
    // Emoji picker
    // =============================
    function openEmojiPicker(mode = 'add', editIdx = -1) {
        emojiPickerMode = mode;
        emojiPickerEditIndex = editIdx;

        const title = $('emojiPickerTitle');
        const nameInput = $('emojiPickerNameInput');
        const confirmBtn = $('btnConfirmEmoji');

        if (mode === 'edit' && players[editIdx]) {
            if (title) title.textContent = 'Edytuj gracza';
            if (nameInput) nameInput.value = players[editIdx].name;
            emojiPickerSelected = players[editIdx].emoji;
        } else {
            if (title) title.textContent = 'Nowy gracz';
            if (nameInput) nameInput.value = '';
            emojiPickerSelected = null;
        }

        if (confirmBtn) confirmBtn.disabled = true;
        renderEmojiGrid('people');
        showO(emojiPickerOverlay);

        if (nameInput) setTimeout(() => nameInput.focus(), 100);
    }

    function renderEmojiGrid(cat = 'people') {
        const grid = $('emojiGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const emojis = EMOJI_CATS[cat] || [];
        const usedEmojis = new Set(players.map(p => p.emoji));
        if (emojiPickerMode === 'edit' && players[emojiPickerEditIndex]) {
            usedEmojis.delete(players[emojiPickerEditIndex].emoji);
        }

        emojis.forEach(em => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'emoji-btn';
            if (usedEmojis.has(em)) btn.classList.add('disabled');
            if (em === emojiPickerSelected) btn.classList.add('selected');
            btn.textContent = em;
            btn.disabled = usedEmojis.has(em);

            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                grid.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                emojiPickerSelected = em;
                validateEmojiPicker();
            });

            grid.appendChild(btn);
        });

        // Update tabs
        $('emojiTabs')?.querySelectorAll('.emoji-tab').forEach(tab => {
            tab.classList.toggle('selected', tab.dataset.emojiCat === cat);
        });
    }

    function validateEmojiPicker() {
        const nameInput = $('emojiPickerNameInput');
        const confirmBtn = $('btnConfirmEmoji');
        const name = (nameInput?.value || '').trim();
        const valid = name.length >= 3 && emojiPickerSelected;
        if (confirmBtn) confirmBtn.disabled = !valid;
    }

    function confirmEmojiPicker() {
        const nameInput = $('emojiPickerNameInput');
        const name = (nameInput?.value || '').trim();
        if (name.length < 3 || !emojiPickerSelected) return;

        if (emojiPickerMode === 'edit' && players[emojiPickerEditIndex]) {
            players[emojiPickerEditIndex].name = name;
            players[emojiPickerEditIndex].emoji = emojiPickerSelected;
        } else {
            players.push({
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                name,
                emoji: emojiPickerSelected,
                score: 0
            });
        }

        savePlayers();
        hideO(emojiPickerOverlay);
        renderPlayers();
        updateStartButton();
    }

    // =============================
    // Multiplayer Logic
    // =============================
    function startHostMode() {
        gameState.mode = 'host';
        players = []; // Reset players for new lobby
        mpHost = new WhosLikelyMP.HostRoom();

        mpHost.on('open', (data) => {
            if (lobbyPinCode) lobbyPinCode.textContent = data.roomId;
            if (lobbyQrCode) lobbyQrCode.src = WhosLikelyMP.getQRCodeUrl(data.roomId);
            showO(overlayHostLobby);
        });

        mpHost.on('playerJoin', () => {
            updateHostLobbyUI();
        });

        mpHost.on('playerLeave', () => {
            updateHostLobbyUI();
        });

        mpHost.on('vote', ({ peerId, votedFor }) => {
            // peerId is the voter
            handleVote(peerId, votedFor);
        });

        hideO(overlayHome);
    }

    function updateHostLobbyUI() {
        if (!mpHost) return;
        const currentPlayers = mpHost.getPlayers();
        players = currentPlayers; // Sync local players with host list

        if (lobbyPlayerCount) lobbyPlayerCount.textContent = players.length;
        if (lobbyPlayersGrid) {
            lobbyPlayersGrid.innerHTML = players.map(p => `
                <div class="lobby-player">
                    <div class="lobby-player-emoji">${p.emoji}</div>
                    <div class="lobby-player-name">${escHtml(p.name)}</div>
                </div>
            `).join('');
        }

        const startBtn = $('btnLobbyStart');
        if (startBtn) {
            startBtn.disabled = players.length < MIN_PLAYERS;
        }
    }

    function startGuestMode() {
        gameState.mode = 'guest';
        // Auto-fill PIN from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const joinPin = urlParams.get('join');
        if (joinPin && guestPinInput) {
            guestPinInput.value = joinPin;
        }

        hideO(overlayHome);
        showO(overlayGuestJoin);
        renderGuestEmojiPicker();
    }

    function joinGameAsGuest() {
        const pin = $('guestPinInput').value.trim();
        const name = $('guestNameInput').value.trim();
        const emoji = emojiPickerSelected;

        if (pin.length < 4 || name.length < 3 || !emoji) {
            $('guestJoinError').textContent = 'Uzupełnij wszystkie pola!';
            showO('guestJoinError');
            return;
        }

        const btn = $('btnGuestConnect');
        if (btn) btn.disabled = true;

        mpGuest = new WhosLikelyMP.GuestClient();

        mpGuest.connect(pin, { name, emoji })
            .then(() => {
                myGuestId = mpGuest.peer.id;
                hideO(overlayGuestJoin);
                showO(overlayGuestWaiting);

                if ($('guestWaitingName')) $('guestWaitingName').textContent = name;
                if ($('guestWaitingAvatar')) $('guestWaitingAvatar').textContent = emoji;

                // Bind guest events
                mpGuest.on('gameStart', (data) => {
                    hideO(overlayGuestWaiting);
                    showO(overlayGuestGame);
                    gameState.totalRounds = data.totalRounds;
                });

                mpGuest.on('playerList', (list) => {
                    players = list;
                });

                mpGuest.on('question', (q) => {
                    renderGuestQuestion(q);
                });

                mpGuest.on('voteProgress', ({ voted, total }) => {
                    if (guestStatusBar) guestStatusBar.textContent = `Głosowanie: ${voted}/${total}`;
                });

                mpGuest.on('reveal', (results) => {
                    if (guestQuestion) guestQuestion.innerHTML = `<div style="text-align:center">Wyniki na ekranie głównym!</div>`;
                    if (guestVoteGrid) guestVoteGrid.innerHTML = '';
                    if (guestStatusBar) guestStatusBar.textContent = 'Czekaj na następną rundę...';
                });

                mpGuest.on('summary', () => {
                    if (guestQuestion) guestQuestion.textContent = 'Koniec gry!';
                    if (guestVoteGrid) guestVoteGrid.innerHTML = '';
                });

            })
            .catch(err => {
                $('guestJoinError').textContent = err.message || 'Błąd połączenia';
                showO('guestJoinError');
                if (btn) btn.disabled = false;
            });
    }

    function renderGuestEmojiPicker() {
        const grid = $('guestEmojiGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const emojis = EMOJI_CATS['people']; // Default set

        emojis.forEach(em => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'emoji-btn';
            btn.textContent = em;
            btn.addEventListener('click', () => {
                grid.querySelectorAll('.selected').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                emojiPickerSelected = em;

                // Enable connect if valid
                const pin = $('guestPinInput').value.trim();
                const name = $('guestNameInput').value.trim();
                if (pin.length >= 4 && name.length >= 3) {
                    $('btnGuestConnect').disabled = false;
                }
            });
            grid.appendChild(btn);
        });

        // Simple input validation binding
        const validate = () => {
            const pin = $('guestPinInput').value.trim();
            const name = $('guestNameInput').value.trim();
            const btn = $('btnGuestConnect');
            if (btn) btn.disabled = !(pin.length >= 4 && name.length >= 3 && emojiPickerSelected);
        };
        $('guestPinInput').addEventListener('input', validate);
        $('guestNameInput').addEventListener('input', validate);
    }

    function renderGuestQuestion(q) {
        if (guestQuestion) guestQuestion.textContent = q.text;
        if (guestVoteGrid) {
            guestVoteGrid.innerHTML = '';

            players.forEach(p => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'vote-btn';
                btn.innerHTML = `
                    <span class="vote-emoji" style="font-size:2rem">${escHtml(p.emoji)}</span>
                    <span class="vote-name" style="font-size:0.8rem">${escHtml(p.name)}</span>
                `;

                btn.addEventListener('click', () => {
                    mpGuest.sendVote(p.id);
                    guestVoteGrid.querySelectorAll('.vote-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    if (guestStatusBar) guestStatusBar.textContent = 'Twój głos został wysłany!';
                });

                guestVoteGrid.appendChild(btn);
            });
        }
    }

    // =============================
    // Game flow
    // =============================
    function startGame() {
        // Reset scores
        players.forEach(p => p.score = 0);

        // Build question pool
        const catIds = [...selectedCategories];
        // In Host mode, ensure we have categories. If empty, default to all.
        if (selectedCategories.size === 0) {
            WHOSLIKELY_QUESTIONS.categories.forEach(c => selectedCategories.add(c.id));
        }

        const pool = WHOSLIKELY_QUESTIONS.getByCategories([...selectedCategories], cfg.adult);
        gameState.questions = shuffle(pool);
        gameState.usedQuestions = [];
        gameState.currentRound = 0;
        gameState.totalRounds = cfg.rounds === Infinity ? gameState.questions.length : Math.min(cfg.rounds, gameState.questions.length);

        hideO(overlayModeSettings);
        hideO(overlayHostLobby);
        showO(overlayGame);

        if (gameState.mode === 'host') {
            mpHost.sendGameStart({ totalRounds: gameState.totalRounds });
        }

        nextQuestion();
    }

    function nextQuestion() {
        if (gameState.currentRound >= gameState.totalRounds || gameState.questions.length === 0) {
            showSummary();
            return;
        }

        gameState.currentRound++;
        gameState.currentQuestion = gameState.questions.shift();
        gameState.usedQuestions.push(gameState.currentQuestion);
        gameState.votes = {};
        gameState.votingPlayerIndex = 0; // Only relevant for local
        gameState.stage = 'question';

        renderQuestion();

        if (gameState.mode === 'host') {
            mpHost.sendQuestion(gameState.currentQuestion);
            mpHost.sendVoteProgress(0, players.length);
        }
    }

    function renderQuestion() {
        if (!gameHud || !bottomBar) return;

        const q = gameState.currentQuestion;
        if (!q) return;

        // Update top bar
        if (roundInfo) {
            roundInfo.textContent = `Pytanie ${gameState.currentRound}/${gameState.totalRounds === Infinity ? '∞' : gameState.totalRounds}`;
        }
        if (topTitle) topTitle.textContent = gameState.mode === 'local' ? 'Głosowanie' : 'Głosujcie na telefonach!';

        // Render question card + voting grid
        gameHud.innerHTML = `
      <div class="stage">
        <div class="question-card">
          <div class="question-category">${escHtml(q.categoryName)}</div>
          <div class="question-text">${escHtml(q.text)}</div>
          <div class="question-hint">
             ${gameState.mode === 'local'
                ? 'Kliknij na gracza, aby oddać głos'
                : 'Czekam na głosy graczy...'}
          </div>
        </div>
      </div>
    `;

        // Voting grid in bottom bar
        bottomBar.innerHTML = `
      <div class="voting-grid" id="votingGrid"></div>
    `;

        const votingGrid = $('votingGrid');
        if (!votingGrid) return;

        players.forEach(p => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'vote-btn';
            btn.dataset.playerId = p.id;

            // In host mode, buttons are not clickable
            if (gameState.mode === 'host') btn.style.cursor = 'default';

            btn.innerHTML = `
                <span class="vote-emoji">${escHtml(p.emoji)}</span>
                <span class="vote-name">${escHtml(p.name)}</span>
                <span class="vote-count">0 głosów</span>
            `;

            if (gameState.mode === 'local') {
                btn.addEventListener('click', () => handleVote(players[gameState.votingPlayerIndex].id, p.id));
            }

            votingGrid.appendChild(btn);
        });
    }

    function handleVote(voterId, votedForId) {
        // Record vote
        gameState.votes[voterId] = votedForId;

        // LOCAL MODE LOGIC
        if (gameState.mode === 'local') {
            // Highlight selection temporarily
            const votingGrid = $('votingGrid');
            if (votingGrid) {
                votingGrid.querySelectorAll('.vote-btn').forEach(btn => {
                    btn.classList.toggle('selected', btn.dataset.playerId === votedForId);
                });
            }

            gameState.votingPlayerIndex++;
            if (gameState.votingPlayerIndex >= players.length) {
                setTimeout(() => revealResults(), 400);
            } else {
                const nextPlayer = players[gameState.votingPlayerIndex];
                if (topTitle) topTitle.textContent = `Głosuje: ${nextPlayer.emoji} ${nextPlayer.name}`;
                setTimeout(() => {
                    if (votingGrid) votingGrid.querySelectorAll('.vote-btn').forEach(btn => btn.classList.remove('selected'));
                }, 300);
            }
        }
        // HOST MODE LOGIC
        else if (gameState.mode === 'host') {
            // Update progress
            const votesCount = Object.keys(gameState.votes).length;
            const totalPlayers = players.length;

            if (topTitle) topTitle.textContent = `Głosowanie: ${votesCount}/${totalPlayers}`;

            mpHost.sendVoteProgress(votesCount, totalPlayers);

            if (votesCount >= totalPlayers) {
                setTimeout(() => revealResults(), 600);
            }
        }
    }

    function revealResults() {
        gameState.stage = 'reveal';
        if (topTitle) topTitle.textContent = 'Wyniki';

        // Count votes
        const voteCounts = {};
        players.forEach(p => voteCounts[p.id] = 0);
        Object.values(gameState.votes).forEach(votedId => {
            if (voteCounts[votedId] !== undefined) voteCounts[votedId]++;
        });

        // Find winner(s)
        const maxVotes = Math.max(...Object.values(voteCounts));
        const winners = players.filter(p => voteCounts[p.id] === maxVotes);

        // Award points
        winners.forEach(w => w.score++);
        if (gameState.mode === 'local' || gameState.mode === 'host') savePlayers();

        // Broadcast results if host
        if (gameState.mode === 'host') {
            mpHost.sendReveal({ winners: winners.map(w => w.id), voteCounts });
        }

        // Update voting grid with results
        const votingGrid = $('votingGrid');
        if (votingGrid) {
            votingGrid.querySelectorAll('.vote-btn').forEach(btn => {
                const pid = btn.dataset.playerId;
                const count = voteCounts[pid] || 0;
                const countEl = btn.querySelector('.vote-count');
                if (countEl) countEl.textContent = `${count} ${count === 1 ? 'głos' : 'głosów'}`;
                btn.classList.add('revealed');

                if (voteCounts[pid] === maxVotes && maxVotes > 0) {
                    btn.classList.add('winner');
                }
            });
        }

        // Show winner message in HUD
        if (gameHud) {
            const q = gameState.currentQuestion;
            const winnerNames = winners.map(w => `${w.emoji} ${w.name}`).join(', ');
            gameHud.innerHTML = `
        <div class="stage">
          <div class="question-card">
            <div class="question-category">${escHtml(q?.categoryName || '')}</div>
            <div class="question-text">${escHtml(q?.text || '')}</div>
            <div class="question-hint" style="color: var(--accent); font-weight: 900;">
              🏆 ${winnerNames} (+1 pkt)
            </div>
          </div>
        </div>
      `;
        }

        // Add "Next" button
        if (bottomBar) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn-new btn-lg';
            nextBtn.textContent = gameState.currentRound >= gameState.totalRounds ? 'Podsumowanie' : 'Następne pytanie →';
            nextBtn.style.margin = '16px auto';
            nextBtn.addEventListener('click', () => {
                if (gameState.currentRound >= gameState.totalRounds) {
                    showSummary();
                } else {
                    nextQuestion();
                }
            });

            bottomBar.innerHTML = '';
            bottomBar.appendChild(nextBtn);
        }
    }

    function showSummary() {
        gameState.stage = 'summary';
        if (topTitle) topTitle.textContent = 'Podsumowanie';
        if (roundInfo) roundInfo.textContent = 'Koniec gry';

        if (gameState.mode === 'host') {
            mpHost.sendSummary({});
        }

        // Sort players by score
        const sorted = [...players].sort((a, b) => b.score - a.score);
        const topScore = sorted[0]?.score || 0;

        if (gameHud) {
            let rows = '';
            sorted.forEach((p, i) => {
                const isWinner = p.score === topScore && topScore > 0;
                rows += `
          <div class="result-row${isWinner ? ' is-winner' : ''}">
            <div class="result-rank">${i + 1}</div>
            <div class="result-emoji">${escHtml(p.emoji)}</div>
            <div class="result-name">${escHtml(p.name)}</div>
            <div class="result-score">${p.score} pkt</div>
          </div>
        `;
            });

            gameHud.innerHTML = `
        <div class="stage">
          <div class="results-card">
            <div class="results-title">🏆 Ranking końcowy</div>
            <div class="results-list">${rows}</div>
          </div>
        </div>
      `;
        }

        if (bottomBar) {
            bottomBar.innerHTML = `
        <div class="bottom-actions">
          <button class="btn-back" id="btnSummaryMenu">← Menu</button>
          <button class="btn-new btn-lg" id="btnPlayAgain">Zagraj ponownie</button>
        </div>
      `;

            $('btnSummaryMenu')?.addEventListener('click', () => {
                hideO(overlayGame);
                showO(overlayHome);
                if (mpHost) mpHost.close();
            });

            $('btnPlayAgain')?.addEventListener('click', () => {
                hideO(overlayGame);
                showO(overlayModeSettings);
                renderSettings();
            });
        }
    }

    // =============================
    // Navigation bindings
    // =============================
    function bindNavigation() {
        // Back to hub
        $('btnBackToHub')?.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });

        // Global settings
        $('btnGlobalSettings')?.addEventListener('click', () => showO(globalSettingsOverlay));
        $('btnGlobalSettingsClose')?.addEventListener('click', () => hideO(globalSettingsOverlay));

        // Back to home from settings
        $('btnBackToHome')?.addEventListener('click', () => {
            hideO(overlayModeSettings);
            showO(overlayHome);
        });

        // Multiplayer Host
        document.querySelectorAll('[data-mp-host]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                startHostMode();
            });
        });

        // Multiplayer Join
        document.querySelectorAll('[data-mp-join]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                startGuestMode();
            });
        });

        // Local play
        document.querySelectorAll('[data-mode-play="local"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                gameState.mode = 'local';
                hideO(overlayHome);
                showO(overlayModeSettings);
                renderSettings();
            });
        });

        // Start game
        btnStartGame?.addEventListener('click', startGame);

        // Rules
        $('btnRulesOk')?.addEventListener('click', () => hideO(rulesOverlay));

        // Game settings
        $('btnGameSettings')?.addEventListener('click', () => showO(gameSettingsOverlay));
        $('btnGameSettingsClose')?.addEventListener('click', () => hideO(gameSettingsOverlay));
        $('btnGameExitToMenu')?.addEventListener('click', () => {
            hideO(gameSettingsOverlay);
            hideO(overlayGame);
            showO(overlayHome);
        });

        // Emoji picker
        addPlayerBtn?.addEventListener('click', () => openEmojiPicker('add'));
        $('btnEmojiCancel')?.addEventListener('click', () => hideO(emojiPickerOverlay));
        $('btnConfirmEmoji')?.addEventListener('click', confirmEmojiPicker);
        $('emojiPickerNameInput')?.addEventListener('input', validateEmojiPicker);

        // Emoji tabs
        $('emojiTabs')?.addEventListener('click', (e) => {
            const tab = e.target.closest('.emoji-tab');
            if (!tab) return;
            renderEmojiGrid(tab.dataset.emojiCat || 'people');
        });

        // Rounds slider
        cfgRoundsTotal?.addEventListener('input', updateRoundsUI);

        // Adult toggle
        adultToggle?.addEventListener('change', () => {
            cfg.adult = adultToggle.checked;
            saveCfg();
            renderCategories();
            updateStartButton();
        });

        // Category buttons
        $('btnCatsAll')?.addEventListener('click', () => {
            const cats = WHOSLIKELY_QUESTIONS.categories.filter(c => cfg.adult || !c.adult);
            selectedCategories = new Set(cats.map(c => c.id));
            saveCategories();
            renderCategories();
            updateStartButton();
        });

        $('btnCatsNone')?.addEventListener('click', () => {
            selectedCategories.clear();
            saveCategories();
            renderCategories();
            updateStartButton();
        });

        // Clear data
        $('btnClearData')?.addEventListener('click', () => {
            if (window.PH?.openConfirm) {
                PH.openConfirm({
                    title: 'Wyczyścić dane?',
                    message: 'Usunięci zostaną wszyscy gracze i ustawienia.',
                    okText: 'Wyczyść',
                    onConfirm: clearAllData
                });
            } else if (confirm('Wyczyścić wszystkie dane gry?')) {
                clearAllData();
            }
        });

        // Sound toggle
        $('soundToggle')?.addEventListener('change', (e) => {
            cfg.sound = e.target.checked;
            saveCfg();
        });

        $('soundToggleGame')?.addEventListener('change', (e) => {
            cfg.sound = e.target.checked;
            saveCfg();
            const other = $('soundToggle');
            if (other) other.checked = cfg.sound;
        });

        // Motion toggle
        $('motionToggle')?.addEventListener('change', (e) => {
            cfg.motion = e.target.checked;
            saveCfg();
            document.body.classList.toggle('motion-off', !cfg.motion);
        });
        $('btnLobbyStart')?.addEventListener('click', () => {
            // Go to settings to configure round/cats, OR start directly?
            // Let's go to settings first, but simpler:
            hideO(overlayHostLobby);
            showO(overlayModeSettings);
            renderSettings();
        });

        $('btnLobbyCancel')?.addEventListener('click', () => {
            if (mpHost) mpHost.close();
            hideO(overlayHostLobby);
            showO(overlayHome);
        });

        // Guest Join
        $('btnGuestConnect')?.addEventListener('click', joinGameAsGuest);
        $('btnGuestCancel')?.addEventListener('click', () => {
            hideO(overlayGuestJoin);
            showO(overlayHome);
        });
        $('btnGuestDisconnect')?.addEventListener('click', () => {
            if (mpGuest) mpGuest.disconnect();
            window.location.reload();
        });

    }

    function clearAllData() {
        players = [];
        savePlayers();
        selectedCategories.clear();
        saveCategories();
        renderSettings();
    }

    // =============================
    // Init
    // =============================
    function init() {
        loadPlayers();
        loadCfg();
        loadCategories();

        // Apply saved settings to UI
        if (adultToggle) adultToggle.checked = cfg.adult;
        if ($('soundToggle')) $('soundToggle').checked = cfg.sound;
        if ($('soundToggleGame')) $('soundToggleGame').checked = cfg.sound;
        if ($('motionToggle')) $('motionToggle').checked = cfg.motion;

        // Find rounds index
        const roundsIdx = ROUNDS_MAP.findIndex(v => v === cfg.rounds);
        if (cfgRoundsTotal && roundsIdx >= 0) cfgRoundsTotal.value = roundsIdx + 1;

        document.body.classList.toggle('motion-off', !cfg.motion);

        // Version
        if ($('homeVersion')) $('homeVersion').textContent = `v${VERSION}`;
        if ($('txtVersion')) $('txtVersion').textContent = VERSION;

        initModeCards();
        initSettingsCards();
        bindNavigation();

        // Open first mode card
        $('classicCard')?.classList.add('open');
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

/* [PH] GAME_LOGIC_END */
