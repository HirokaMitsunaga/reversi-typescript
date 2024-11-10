import { GameGateway } from "../dataaccess/gameGateway.js";
import { connectMySQL } from "../dataaccess/connection.js";
import { TurnRepository } from "../domain/turn/turnRepository.js";
import { firstTurn } from "../domain/turn/turn.js";

const gameGateway = new GameGateway();

const turnRepository = new TurnRepository();

export class GameServive {
  async startGame() {
    const now = new Date();

    const conn = await connectMySQL();
    try {
      await conn.beginTransaction();

      const gameRecord = await gameGateway.insert(conn, now);

      const turn = firstTurn(gameRecord.id, now);

      await turnRepository.save(conn, turn);
      await conn.commit();
    } finally {
      await conn.end();
    }
  }
}
