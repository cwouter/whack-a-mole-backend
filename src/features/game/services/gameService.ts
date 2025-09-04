import type GameStore from "../stores/gameStore.js";
import type { GameConfig } from "../types/game.js";
import crypto from "node:crypto";

export default class GameService {

  private endTimeout: NodeJS.Timeout | null = null;
  private nominationInterval: NodeJS.Timeout | null = null;
  private moleExpireTimeouts: NodeJS.Timeout[] = [];

  private gameConfig: GameConfig = {
    durationMs: 2 * 60 * 1000,
    moles: 12
  };

  constructor(private store: GameStore) {
  }

  /**
   * Start a new game
   * @param config Optional configuration for the game
   * @returns The initial game state
   */
  public start(config?: Partial<GameConfig>) {
    this.gameConfig = { ...this.gameConfig, ...config };

    if (this.endTimeout) {
      clearTimeout(this.endTimeout);
      this.endTimeout = null;
    }

    const now = Date.now();
    const endsAt = now + this.gameConfig.durationMs;

    this.store.start(this.gameConfig.moles, now, endsAt)
    return { moles: this.store.getState().moles, endsAt };
  }

  /**
   * Schedule the end of the game
   * @param callback Callback to be called when the game ends
   */
  public scheduleEnd(callback: () => void) {
    if (this.endTimeout) clearTimeout(this.endTimeout);
    this.endTimeout = setTimeout(() => {
      this.store.end();
      this.endTimeout = null;
      if (this.nominationInterval) clearInterval(this.nominationInterval);
      this.nominationInterval = null;
      this.moleExpireTimeouts.forEach(clearTimeout);
      this.moleExpireTimeouts = [];
      callback();
    }, this.gameConfig.durationMs);
  }

  /**
   * Start a nomination cycle
   * @param callback Callback to be called when a mole is nominated
   */
  public startNominationCycle(callback: (mole: { id: number, state: "mole" | "hole", expireAt?: number }) => void) {
    if (this.nominationInterval) clearInterval(this.nominationInterval);
    this.nominationInterval = setInterval(() => {
      const randomMole = this.nominateMole();
      const expireTimeout = this.scheduleMoleExpire(randomMole, () => {
        callback({ id: randomMole, state: "hole" });
      });

      callback({ id: randomMole, state: "mole", expireAt: Date.now() + expireTimeout });
    }, 1000);
  }

  /**
   * Nominate a random mole
   * @returns The nominated mole
   */
  public nominateMole() {
    const randomMole = crypto.randomInt(0, this.gameConfig.moles);

    this.store.nominateMole(randomMole);

    return randomMole;
  }

  /**
   * Schedule a mole to expire
   * @param id The id of the mole to expire
   * @param callback Callback to be called when the mole expires
   * @returns The timeout in ms
   */
  public scheduleMoleExpire(id: number, callback: (id: number) => void): number {
    const randomExpireTimeout = crypto.randomInt(250, 5000);
    this.moleExpireTimeouts.push(setTimeout(() => {
      this.store.expireMole(id);
      callback(id);
    }, randomExpireTimeout));

    this.store.setMoleExpiration(id, Date.now() + randomExpireTimeout);

    return randomExpireTimeout;
  }

  /**
   * End the game immediately
   */
  public end() {
    if (this.endTimeout) {
      clearTimeout(this.endTimeout);
      this.endTimeout = null;
    }

    if (this.nominationInterval) {
      clearInterval(this.nominationInterval);
      this.nominationInterval = null;
    }

    this.store.end();
    this.moleExpireTimeouts.forEach(clearTimeout);
    this.moleExpireTimeouts = [];
  }

  public whackMole(id: number) {
    const score = this.store.whackMole(id);
    return score;
  }
}