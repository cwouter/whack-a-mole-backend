import type { Mole } from "../types/game.js";

export interface GameState {
    moles: Record<number, Mole>;
    running: boolean;
    startedAt?: number;
    endsAt?: number;
}

export default class GameStore {
    private state: GameState = { moles: {}, running: false };

    public getState(): GameState {
        return this.state;
    }

    private createMoles(amount: number): Record<number, Mole> {
        return Object.fromEntries(
            Array.from({ length: amount }, (_, i) => [i, { id: i, state: "hole" }])
        );
    }

    public start(amount: number, now: number, endsAt: number) {
        this.state = {
            moles: this.createMoles(amount),
            running: true,
            startedAt: now,
            endsAt
        };
    }

    public nominateMole(id: number) {
        if (!this.state.moles[id]) {
            throw new Error("Mole not found");
        };

        this.state.moles[id].state = "mole";
    }

    public expireMole(id: number) {
        if (!this.state.moles[id]) {
            throw new Error("Mole not found");
        };

        this.state.moles[id].state = "hole";
    }

    public end() {
        this.state.running = false;
    };
}
