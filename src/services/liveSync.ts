import { AppDatabase, Match, BroadcastAnimationEvent, Team, Player, SponsorConfig, BroadcastOverlaySettings } from '../types/cricket.js';

type Listener = (database: AppDatabase) => void;
type EventListener = (event: BroadcastAnimationEvent) => void;

class LiveSyncService {
  private ws: WebSocket | null = null;
  private database: AppDatabase | null = null;
  private listeners: Set<Listener> = new Set();
  private eventListeners: Set<EventListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private reconnectTimer: any = null;
  private operatorToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.operatorToken = localStorage.getItem('itc_operator_token');
      try {
        this.broadcastChannel = new BroadcastChannel('itc_sports_live_channel');
        this.broadcastChannel.onmessage = (e) => {
          if (e.data.type === 'STATE_UPDATE' && e.data.payload) {
            this.database = e.data.payload;
            this.notify();
          } else if (e.data.type === 'BROADCAST_EVENT' && e.data.payload) {
            this.notifyEvent(e.data.payload);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported', err);
      }
      this.connectWebSocket();
      this.startFastSyncPolling();
    }
  }

  private startFastSyncPolling() {
    if (typeof window === 'undefined') return;
    // Ultra-fast safety polling ticker (every 900ms) to ensure guaranteed sync across mobile and desktop
    setInterval(async () => {
      try {
        const res = await fetch('/api/match/active', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (res.ok) {
          const activeMatch: Match | null = await res.json();
          if (activeMatch) {
            const currentTimestamp = this.database?.activeMatch?.updatedAt || 0;
            if (!this.database?.activeMatch || activeMatch.updatedAt > currentTimestamp) {
              if (this.database) {
                this.database.activeMatch = activeMatch;
                this.notify();
              }
            }
          }
        }
      } catch {
        // Ignore background polling network glitches
      }
    }, 900);
  }

  public isAuthenticated(): boolean {
    return !!this.operatorToken;
  }

  public async login(pin: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        const data = await res.json();
        this.operatorToken = data.token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('itc_operator_token', data.token);
        }
        return true;
      }
    } catch (err) {
      console.error('Login error', err);
    }
    return false;
  }

  public logout(): void {
    this.operatorToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('itc_operator_token');
    }
  }

  public async changePin(currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to update PIN' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.operatorToken) {
      headers['x-operator-token'] = this.operatorToken;
    }
    return headers;
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[LiveSync] Connected to WebSocket server');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INIT' || data.type === 'STATE_UPDATE') {
            this.database = data.payload;
            this.notify();
          } else if (data.type === 'MATCH_UPDATE' && data.payload) {
            if (this.database) {
              this.database.activeMatch = data.payload;
              this.notify();
            }
          } else if (data.type === 'BROADCAST_EVENT') {
            this.notifyEvent(data.payload);
          }
        } catch (e) {
          console.error('[LiveSync] JSON parse error', e);
        }
      };

      this.ws.onclose = () => {
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[LiveSync] WebSocket error', err);
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connectWebSocket();
    }, 1000);
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    if (this.database) {
      listener(this.database);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeEvents(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  private notify() {
    if (!this.database) return;
    this.listeners.forEach((fn) => fn(this.database!));
  }

  private notifyEvent(event: BroadcastAnimationEvent) {
    this.eventListeners.forEach((fn) => fn(event));
  }

  public async fetchInitialState(): Promise<AppDatabase> {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        this.database = data;
        this.notify();
        return data;
      }
    } catch (err) {
      console.warn('[LiveSync] Failed fetching /api/state', err);
    }
    return this.database as AppDatabase;
  }

  public async updateMatch(match: Match): Promise<void> {
    // 1. Instant optimistic local update (0ms delay)
    if (this.database) {
      this.database.activeMatch = match;
      this.notify();
    }

    // 2. Broadcast through BroadcastChannel for immediate same-device zero-latency sync
    this.broadcastChannel?.postMessage({
      type: 'STATE_UPDATE',
      payload: this.database,
    });

    // 3. Fast WebSocket send (instantly broadcast to server and other clients)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'MATCH_UPDATE', token: this.operatorToken, payload: match }));
    }

    // 4. Background HTTP persistence (non-blocking for UI responsiveness)
    fetch('/api/match/update', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(match),
    }).catch((e) => {
      console.warn('Background sync note', e);
    });
  }

  public async triggerBroadcastEvent(event: BroadcastAnimationEvent): Promise<void> {
    this.notifyEvent(event);
    this.broadcastChannel?.postMessage({
      type: 'BROADCAST_EVENT',
      payload: event,
    });

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'BROADCAST_EVENT', token: this.operatorToken, payload: event }));
    }

    try {
      await fetch('/api/event', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(event),
      });
    } catch (e) {
      console.error('Failed to send broadcast event', e);
    }
  }

  public async saveTeam(team: Team): Promise<void> {
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(team),
    });
    if (res.ok) {
      await this.fetchInitialState();
    }
  }

  public async deleteTeam(teamId: string): Promise<void> {
    const res = await fetch(`/api/teams/${teamId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (res.ok) {
      await this.fetchInitialState();
    }
  }

  public async savePlayer(player: Player): Promise<void> {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(player),
    });
    if (res.ok) {
      await this.fetchInitialState();
    }
  }

  public async deletePlayer(playerId: string): Promise<void> {
    const res = await fetch(`/api/players/${playerId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (res.ok) {
      await this.fetchInitialState();
    }
  }

  public async saveSponsor(sponsor: SponsorConfig): Promise<void> {
    const res = await fetch('/api/sponsor', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(sponsor),
    });
    if (res.ok) {
      await this.fetchInitialState();
    }
  }

  public async saveOverlaySettings(settings: Partial<BroadcastOverlaySettings>): Promise<void> {
    if (this.database) {
      this.database.overlaySettings = {
        ...this.database.overlaySettings,
        ...settings,
      };
      this.notify();
    }

    this.broadcastChannel?.postMessage({
      type: 'STATE_UPDATE',
      payload: this.database,
    });

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'OVERLAY_SETTINGS', token: this.operatorToken, payload: settings }));
    }

    try {
      const res = await fetch('/api/overlay/settings', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        await this.fetchInitialState();
      }
    } catch (e) {
      console.warn('Background overlay save note', e);
    }
  }

  public async saveMatchToHistory(match: Match, updateStats: boolean = true): Promise<void> {
    const res = await fetch('/api/matches/save', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ match, updateStats }),
    });
    if (res.ok) {
      await this.fetchInitialState();
    }
  }

  public async deleteMatchFromHistory(matchId: string): Promise<void> {
    const res = await fetch(`/api/matches/${matchId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (res.ok) {
      await this.fetchInitialState();
    }
  }

  public async resetMatch(): Promise<void> {
    const res = await fetch('/api/match/reset', {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    if (res.ok) {
      await this.fetchInitialState();
    }
  }

  public async startNewMatch(newMatch: Match): Promise<void> {
    const res = await fetch('/api/match/new', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(newMatch),
    });
    if (res.ok) {
      await this.fetchInitialState();
    }
  }
}

export const liveSync = new LiveSyncService();
