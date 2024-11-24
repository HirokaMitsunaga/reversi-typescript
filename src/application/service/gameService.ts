import { connectMySQL } from "../../infrastructure/connection.js";
import { firstTurn } from "../../domain/model/turn/turn.js";
import { Game } from "../../domain/model/game/game.js";
import { GameMySQLRepository } from "../../infrastructure/repository/game/gameMySQLRepository.js";
import { TurnMySQLRepository } from "../../infrastructure/repository/turn/turnMySQLRepository.js";

const gameRepository = new GameMySQLRepository();
const turnRepository = new TurnMySQLRepository();

export class GameServive {
  async startGame() {
    const now = new Date();

    const conn = await connectMySQL();
    try {
      await conn.beginTransaction();

      const game = await gameRepository.save(conn, new Game(undefined, now));
      if (!game.id) {
        throw new Error("game.id not exits ");
      }

      const turn = firstTurn(game.id, now);

      await turnRepository.save(conn, turn);
      await conn.commit();
    } finally {
      await conn.end();
    }
  }
}
