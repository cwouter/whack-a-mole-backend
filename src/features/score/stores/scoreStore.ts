
export interface Score {
    score: number,
    player: string,
}

export interface ScoreState {
    highscores: Score[];
    currentScore: Score | null;
}

export default class ScoreStore {
    private state!: ScoreState;

    constructor() {
        this.resetState();
    }

    public getState(): ScoreState {
        return this.state;
    }

    private resetState() {
        this.state = {
            highscores: [],
            currentScore: null
        };
    }

    public startGame(player: string) {
        this.state.currentScore = { score: 0, player };
    }

    public endGame() {
        if (!this.state.currentScore) {
            throw new Error("Game has not been started");
        }

        this.state.highscores.push(this.state.currentScore);
        this.sortHighscores();
        this.state.currentScore = null;
    };

    private sortHighscores() {
        this.state.highscores.sort((a, b) => b.score - a.score);
    }

    public addScore(score: number) {
        if (!this.state.currentScore) {
            throw new Error("Game has not been started");
        }

        this.state.currentScore.score += score;
        return this.state.currentScore.score
    }

    public getCurrentScore(): Score | null {
        return this.state.currentScore;
    }

    public getHighscores(): Score[] {
        return this.state.highscores;
    }
}
