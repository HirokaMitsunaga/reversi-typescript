import { GameGateway } from "../../infrastructure/gameGateway.js";
import { connectMySQL } from "../../infrastructure/connection.js";
import { TurnRepository } from "../../domain/model/turn/turnRepository.js";
import { firstTurn } from "../../domain/model/turn/turn.js";
import { GameRepository } from "../../domain/model/game/gameRepository.js";
import { Game } from "../../domain/model/game/game.js";

const gameRepository = new GameRepository();
const turnRepository = new TurnRepository();

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
