export interface GameConfig {
    durationMs: number;
    moles: number;
}

export type MoleState = 'mole' | 'hole';

export interface Mole { id: number; state: MoleState }