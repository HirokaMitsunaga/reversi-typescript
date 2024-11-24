import { connectMySQL } from "../../infrastructure/connection.js";
import { firstTurn } from "../../domain/model/turn/turn.js";
import { Game } from "../../domain/model/game/game.js";
import { GameRepository } from "../../domain/model/game/gameRepository.js";
import { TurnRepository } from "../../domain/model/turn/turnRepository.js";

export class GameServive {
  constructor(
    private _gameRepository: GameRepository,
    private _turnRepository: TurnRepository
  ) {}
  async startGame() {
    const now = new Date();

    const conn = await connectMySQL();
    try {
      await conn.beginTransaction();

      const game = await this._gameRepository.save(
        conn,
        new Game(undefined, now)
      );
      if (!game.id) {
        throw new Error("game.id not exits ");
      }

      const turn = firstTurn(game.id, now);

      await this._turnRepository.save(conn, turn);
      await conn.commit();
    } finally {
      await conn.end();
    }
  }
}
