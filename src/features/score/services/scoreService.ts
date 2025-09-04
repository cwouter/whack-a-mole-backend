import type ScoreStore from "../stores/scoreStore.js";

export default class ScoreService {

  constructor(private store: ScoreStore) {
  }

  public startGame(player: string) {
    this.store.startGame(player);
  }

  public endGame() {
    this.store.endGame();
    return this.store.getHighscores();
  }

  public addScore(expireAt: number) {
    const score = Math.round((expireAt - Date.now()) / 100)

    return (score <= 0)
      ? this.store.getCurrentScore()
      : this.store.addScore(score);
  }
}