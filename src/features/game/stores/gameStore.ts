import type { Mole } from "../types/game.js";

export interface GameState {
    moles: Record<number, Mole>;
    score: number;
    running: boolean;
    startedAt?: number;
    endsAt?: number;
}

export default class GameStore {
    private state!: GameState;

    constructor() {
        this.resetState();
    }

    public getState(): GameState {
        return this.state;
    }

    private resetState() {
        this.state = { moles: {}, score: 0, running: false };
    }

    private createMoles(amount: number): Record<number, Mole> {
        return Object.fromEntries(
            Array.from({ length: amount }, (_, i) => [i, { id: i, state: "hole" }])
        );
    }

    public start(amount: number, now: number, endsAt: number) {
        this.resetState();
        this.state = {
            moles: this.createMoles(amount),
            running: true,
            startedAt: now,
            score: 0,
            endsAt
        };
    }

    public nominateMole(id: number) {
        if (!this.state.moles[id]) {
            throw new Error("Mole not found");
        };

        this.state.moles[id].state = "mole";
    }

    public setMoleExpiration(id: number, expireAt: number) {
        if (!this.state.moles[id]) {
            throw new Error("Mole not found");
        };

        this.state.moles[id].expireAt = expireAt;
    }

    public expireMole(id: number) {
        if (!this.state.moles[id]) {
            throw new Error("Mole not found");
        };

        this.state.moles[id].state = "hole";
    }

    public end() {
        this.state.running = false;
        this.resetState();
    };

    public whackMole(id: number) {
        if (!this.state.moles[id]) {
            throw new Error("Mole not found");
        };

        // Anti-cheat detection
        if (!this.state.running) {
            throw new Error("Game has not been started");
        }

        // Anti-cheat detection
        if (this.state.moles[id].state !== "mole") {
            throw new Error("Mole is not visible");
        }

        const score = this.state.moles[id].expireAt ? Math.round((this.state.moles[id].expireAt - Date.now()) / 100) : 0;
        this.state.score += score;

        this.state.moles[id].state = "hole";
        return this.state.score;
    };
}
