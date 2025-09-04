import type Connection from "../../../connection.js";
import type GameService from "../services/gameService.js";

export default class GameController {

    constructor(
        private gameService: GameService,
        private connection: Connection,
    ) {
    }

    public gameStart() {
        const { moles, endsAt } = this.gameService.start();

        this.connection.sendEvent("game/started", { moles, endsAt });
        this.gameService.startNominationCycle((mole) => {
            this.connection.sendEvent("game/nomination", { mole });
        });
        this.gameService.scheduleEnd(() => {
            this.connection.sendEvent("game/ended", { endedAt: Date.now() });
        });
    }

    public gameEnd() {
        this.gameService.end();
        this.connection.sendEvent("game/ended", { endedAt: Date.now() });
    }

    public whackMole(id: number) {
        const score = this.gameService.whackMole(id);
        this.connection.sendEvent("game/whacked", { id, score });
    }
}