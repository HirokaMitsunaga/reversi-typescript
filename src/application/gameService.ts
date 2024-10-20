import { GameGateway } from "../dataaccess/gameGateway.js";
import { TurnGateway } from "../dataaccess/turnGateway.js";
import { SquareGateway } from "../dataaccess/squareGateway.js";
import { connectMySQL } from "../dataaccess/connection.js";
import { DARK, INITIAL_BOARD } from "../application/constants.js";

const gameGateway = new GameGateway();
const turnGateway = new TurnGateway();
const squareGateway = new SquareGateway();

export class GameServive {
  async startGame() {
    const now = new Date();

    const conn = await connectMySQL();
    try {
      await conn.beginTransaction();

      const gameRecord = await gameGateway.insert(conn, now);
      const turnRecord = await turnGateway.insert(
        conn,
        gameRecord.id,
        0,
        DARK,
        now
      );
      await squareGateway.insertAll(conn, turnRecord.id, INITIAL_BOARD);

      await conn.commit();
    } finally {
      await conn.end();
    }
  }
}
