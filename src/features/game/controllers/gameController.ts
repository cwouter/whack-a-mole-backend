import type Connection from "../../../connection.js";
import type ScoreService from "../../score/services/scoreService.js";
import type GameService from "../services/gameService.js";

export default class GameController {

    constructor(
        private gameService: GameService,
        private scoreService: ScoreService,
        private connection: Connection,
    ) {
    }

    public gameStart(playerName: string) {
        const { moles, endsAt } = this.gameService.start();

        this.scoreService.startGame(playerName);
        this.connection.sendEvent("game/started", { moles, endsAt });
        this.gameService.startNominationCycle((mole) => {
            this.connection.sendEvent("game/nomination", { mole });
        });
        this.gameService.scheduleEnd(() => {
            const scores = this.scoreService.endGame();
            this.connection.sendEvent("score/update", { highscores: scores });
            this.connection.sendEvent("game/ended", { endedAt: Date.now() });
        });
    }

    public gameEnd() {
        this.gameService.end();
        const scores = this.scoreService.endGame();
        this.connection.sendEvent("score/update", { highscores: scores });
        this.connection.sendEvent("game/ended", { endedAt: Date.now() });
    }

    public whackMole(id: number) {
        const mole = this.gameService.whackMole(id);
        const score = mole.expireAt ? this.scoreService.addScore(mole.expireAt) : 0;

        this.connection.sendEvent("game/whacked", { id, totalScore: score });
    }
}