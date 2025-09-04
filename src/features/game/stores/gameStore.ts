import type { Mole } from "../types/game.js";

export interface GameState {
    moles: Record<number, Mole>;
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

    private resetState(): void {
        this.state = { moles: {}, running: false };
    }

    private createMoles(amount: number): Record<number, Mole> {
        return Object.fromEntries(
            Array.from({ length: amount }, (_, i) => [i, { id: i, state: "hole" }])
        );
    }

    public start(amount: number, now: number, endsAt: number): void {
        this.resetState();
        this.state = {
            moles: this.createMoles(amount),
            running: true,
            startedAt: now,
            endsAt
        };
    }

    public nominateMole(id: number): void {
        if (!this.state.moles[id]) {
            throw new Error("Mole not found");
        };

        this.state.moles[id].state = "mole";
    }

    public setMoleExpiration(id: number, expireAt: number): void {
        if (!this.state.moles[id]) {
            throw new Error("Mole not found");
        };

        this.state.moles[id].expireAt = expireAt;
    }

    public expireMole(id: number): void {
        if (!this.state.moles[id]) {
            throw new Error("Mole not found");
        };

        this.state.moles[id].state = "hole";
    }

    public end(): void {
        this.state.running = false;
        this.resetState();
    };

    public whackMole(id: number): Mole {
        if (!this.state.running) {
            throw new Error("Game has not been started");
        }

        if (!this.state.moles[id]) {
            throw new Error("Mole not found");
        };

        // Anti-cheat detection
        if (this.state.moles[id].state !== "mole") {
            throw new Error("Mole is not visible");
        }

        this.state.moles[id].state = "hole";
        return this.state.moles[id];
    };
}
