/* PartyHUB — Who's Most Likely — Multiplayer Module
   PeerJS wrapper for real-time P2P multiplayer.
   [PH] MULTIPLAYER_BEGIN
*/

(function () {
    'use strict';

    // =============================
    // Config
    // =============================
    const PEER_CONFIG = {
        // Use PeerJS Cloud (free signaling)
        // You can also self-host: https://github.com/peers/peerjs-server
        debug: 1 // 0=none, 1=errors, 2=warnings, 3=all
    };

    const ROOM_ID_LENGTH = 6;
    const ROOM_PREFIX = 'WHOSLKLY-';

    // =============================
    // Utilities
    // =============================
    function generateRoomId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I,O,0,1 to avoid confusion
        let id = '';
        for (let i = 0; i < ROOM_ID_LENGTH; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    function log(...args) {
        console.log('[MP]', ...args);
    }

    function err(...args) {
        console.error('[MP]', ...args);
    }

    // =============================
    // Message Types
    // =============================
    const MSG = {
        // Host → Guest
        PLAYER_LIST: 'playerList',       // List of all players
        GAME_START: 'gameStart',         // Game started
        QUESTION: 'question',            // New question
        VOTE_PROGRESS: 'voteProgress',   // X/Y voted
        REVEAL: 'reveal',                // Show results
        SUMMARY: 'summary',              // End game summary
        KICK: 'kick',                    // Player kicked

        // Guest → Host
        JOIN: 'join',                    // Player info on join
        VOTE: 'vote',                    // Vote cast
        LEAVE: 'leave'                   // Player leaving
    };

    // =============================
    // HostRoom Class
    // =============================
    class HostRoom {
        constructor() {
            this.roomId = generateRoomId();
            this.peerId = ROOM_PREFIX + this.roomId;
            this.peer = null;
            this.connections = new Map(); // peerId → { conn, player }
            this.players = [];
            this.callbacks = {};
            this.isOpen = false;

            this._init();
        }

        _init() {
            this.peer = new Peer(this.peerId, PEER_CONFIG);

            this.peer.on('open', (id) => {
                log('Host room opened:', id);
                this.isOpen = true;
                this._emit('open', { roomId: this.roomId, peerId: id });
            });

            this.peer.on('connection', (conn) => {
                this._handleConnection(conn);
            });

            this.peer.on('error', (error) => {
                err('Host error:', error);
                this._emit('error', error);
            });

            this.peer.on('disconnected', () => {
                log('Host disconnected from signaling');
                this._emit('disconnected');
            });
        }

        _handleConnection(conn) {
            const guestPeerId = conn.peer;
            log('New connection from:', guestPeerId);

            conn.on('open', () => {
                log('Connection open:', guestPeerId);
                // Wait for JOIN message with player info
            });

            conn.on('data', (data) => {
                this._handleMessage(conn, guestPeerId, data);
            });

            conn.on('close', () => {
                log('Connection closed:', guestPeerId);
                this._removePlayer(guestPeerId);
            });

            conn.on('error', (error) => {
                err('Connection error:', guestPeerId, error);
            });
        }

        _handleMessage(conn, peerId, data) {
            log('Received from', peerId, ':', data);

            switch (data.type) {
                case MSG.JOIN:
                    this._addPlayer(conn, peerId, data.player);
                    break;

                case MSG.VOTE:
                    this._emit('vote', {
                        peerId,
                        playerId: data.playerId,
                        votedFor: data.votedFor
                    });
                    break;

                case MSG.LEAVE:
                    this._removePlayer(peerId);
                    break;

                default:
                    log('Unknown message type:', data.type);
            }
        }

        _addPlayer(conn, peerId, playerInfo) {
            const player = {
                id: peerId,
                peerId: peerId,
                name: playerInfo.name,
                emoji: playerInfo.emoji,
                score: 0,
                isHost: false
            };

            this.connections.set(peerId, { conn, player });
            this.players.push(player);

            log('Player joined:', player.name);
            this._emit('playerJoin', player);

            // Send current player list to all
            this.broadcastPlayerList();
        }

        _removePlayer(peerId) {
            const entry = this.connections.get(peerId);
            if (!entry) return;

            const player = entry.player;
            this.connections.delete(peerId);
            this.players = this.players.filter(p => p.peerId !== peerId);

            log('Player left:', player?.name);
            this._emit('playerLeave', player);

            // Update all clients
            this.broadcastPlayerList();
        }

        // =============================
        // Public API
        // =============================
        on(event, callback) {
            if (!this.callbacks[event]) this.callbacks[event] = [];
            this.callbacks[event].push(callback);
        }

        _emit(event, data) {
            (this.callbacks[event] || []).forEach(cb => cb(data));
        }

        broadcast(data) {
            this.connections.forEach(({ conn }) => {
                if (conn.open) {
                    conn.send(data);
                }
            });
        }

        broadcastPlayerList() {
            this.broadcast({
                type: MSG.PLAYER_LIST,
                players: this.players
            });
        }

        sendQuestion(question) {
            this.broadcast({
                type: MSG.QUESTION,
                question: question
            });
        }

        sendVoteProgress(voted, total) {
            this.broadcast({
                type: MSG.VOTE_PROGRESS,
                voted: voted,
                total: total
            });
        }

        sendReveal(results) {
            this.broadcast({
                type: MSG.REVEAL,
                results: results
            });
        }

        sendSummary(summary) {
            this.broadcast({
                type: MSG.SUMMARY,
                summary: summary
            });
        }

        sendGameStart(gameInfo) {
            this.broadcast({
                type: MSG.GAME_START,
                ...gameInfo
            });
        }

        kickPlayer(peerId) {
            const entry = this.connections.get(peerId);
            if (entry) {
                entry.conn.send({ type: MSG.KICK });
                entry.conn.close();
                this._removePlayer(peerId);
            }
        }

        getPlayers() {
            return [...this.players];
        }

        getPlayerCount() {
            return this.players.length;
        }

        close() {
            this.connections.forEach(({ conn }) => conn.close());
            this.peer.destroy();
            this.isOpen = false;
            log('Host room closed');
        }
    }

    // =============================
    // GuestClient Class
    // =============================
    class GuestClient {
        constructor() {
            this.peer = null;
            this.conn = null;
            this.roomId = null;
            this.playerInfo = null;
            this.callbacks = {};
            this.isConnected = false;
        }

        connect(roomId, playerInfo) {
            return new Promise((resolve, reject) => {
                this.roomId = roomId.toUpperCase();
                this.playerInfo = playerInfo;
                const hostPeerId = ROOM_PREFIX + this.roomId;

                this.peer = new Peer(undefined, PEER_CONFIG);

                this.peer.on('open', (myId) => {
                    log('Guest peer open:', myId);

                    this.conn = this.peer.connect(hostPeerId, {
                        reliable: true
                    });

                    this.conn.on('open', () => {
                        log('Connected to host!');
                        this.isConnected = true;

                        // Send join message
                        this.conn.send({
                            type: MSG.JOIN,
                            player: playerInfo
                        });

                        this._emit('connected');
                        resolve();
                    });

                    this.conn.on('data', (data) => {
                        this._handleMessage(data);
                    });

                    this.conn.on('close', () => {
                        log('Disconnected from host');
                        this.isConnected = false;
                        this._emit('disconnected');
                    });

                    this.conn.on('error', (error) => {
                        err('Connection error:', error);
                        reject(error);
                    });
                });

                this.peer.on('error', (error) => {
                    err('Peer error:', error);
                    if (error.type === 'peer-unavailable') {
                        reject(new Error('Pokój nie istnieje'));
                    } else {
                        reject(error);
                    }
                });

                // Timeout
                setTimeout(() => {
                    if (!this.isConnected) {
                        reject(new Error('Timeout — nie udało się połączyć'));
                    }
                }, 10000);
            });
        }

        _handleMessage(data) {
            log('From host:', data);

            switch (data.type) {
                case MSG.PLAYER_LIST:
                    this._emit('playerList', data.players);
                    break;

                case MSG.GAME_START:
                    this._emit('gameStart', data);
                    break;

                case MSG.QUESTION:
                    this._emit('question', data.question);
                    break;

                case MSG.VOTE_PROGRESS:
                    this._emit('voteProgress', { voted: data.voted, total: data.total });
                    break;

                case MSG.REVEAL:
                    this._emit('reveal', data.results);
                    break;

                case MSG.SUMMARY:
                    this._emit('summary', data.summary);
                    break;

                case MSG.KICK:
                    this._emit('kicked');
                    this.disconnect();
                    break;

                default:
                    log('Unknown message:', data.type);
            }
        }

        // =============================
        // Public API
        // =============================
        on(event, callback) {
            if (!this.callbacks[event]) this.callbacks[event] = [];
            this.callbacks[event].push(callback);
        }

        _emit(event, data) {
            (this.callbacks[event] || []).forEach(cb => cb(data));
        }

        sendVote(votedForPlayerId) {
            if (this.conn && this.conn.open) {
                this.conn.send({
                    type: MSG.VOTE,
                    playerId: this.playerInfo.id || this.peer.id,
                    votedFor: votedForPlayerId
                });
            }
        }

        disconnect() {
            if (this.conn) {
                this.conn.send({ type: MSG.LEAVE });
                this.conn.close();
            }
            if (this.peer) {
                this.peer.destroy();
            }
            this.isConnected = false;
        }
    }

    // =============================
    // QR Code URL generator
    // =============================
    function getJoinUrl(roomId) {
        const base = window.location.href.split('?')[0];
        return `${base}?join=${roomId}`;
    }

    function getQRCodeUrl(roomId, size = 200) {
        const joinUrl = encodeURIComponent(getJoinUrl(roomId));
        // Using QRServer API (free, no signup)
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${joinUrl}`;
    }

    // =============================
    // Export to global
    // =============================
    window.WhosLikelyMP = {
        HostRoom,
        GuestClient,
        MSG,
        getJoinUrl,
        getQRCodeUrl,
        generateRoomId
    };

    log('Multiplayer module loaded');

})();

/* [PH] MULTIPLAYER_END */
