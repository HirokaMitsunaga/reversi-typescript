import mysql from "mysql2/promise";
import { Turn } from "../../../domain/model/turn/turn.js";
import { Move } from "../../../domain/model/turn/move.js";
import { toDisc } from "../../../domain/model/turn/disc.js";
import { Point } from "../../../domain/model/turn/point.js";
import { Board } from "../../../domain/model/turn/board.js";
import { DomainError } from "../../../domain/eroor/domainError.js";
import { TurnGateway } from "./turnGateway.js";
import { MoveGateway } from "./moveGateway.js";
import { SquareGateway } from "./squareGateway.js";
import { TurnRepository } from "../../../domain/model/turn/turnRepository.js";

const turnGateway = new TurnGateway();
const moveGateway = new MoveGateway();
const squareGateway = new SquareGateway();

export class TurnMySQLRepository implements TurnRepository {
  async findForGameIdAndTurnCount(
    conn: mysql.Connection,
    gameId: number,
    turnCount: number
  ): Promise<Turn> {
    const turnRecord = await turnGateway.findForGameIdAndTurnCount(
      conn,
      gameId,
      turnCount
    );
    if (!turnRecord) {
      throw new DomainError(
        "SpecifiedTurnNotFound",
        "Specified turn not found"
      );
    }

    const squareRecords = await squareGateway.findForTurnId(
      conn,
      turnRecord.id
    );
    const board = Array.from(Array(8)).map(() => Array.from(Array(8)));
    squareRecords.forEach((s) => {
      board[s.y][s.x] = s.disc;
    });

    const moveRecord = await moveGateway.findForTurnId(conn, turnRecord.id);
    let move: Move | undefined;
    if (moveRecord) {
      move = new Move(
        toDisc(moveRecord.disc),
        new Point(moveRecord.x, moveRecord.y)
      );
    }
    const nextDisc =
      turnRecord.nextDisc === null ? undefined : toDisc(turnRecord.nextDisc);

    return new Turn(
      gameId,
      turnCount,
      nextDisc,
      move,
      new Board(board),
      turnRecord.endAt
    );
  }
  async save(conn: mysql.Connection, turn: Turn) {
    const turnRecord = await turnGateway.insert(
      conn,
      turn.gameId,
      turn.turnCount,
      turn.nextDisc,
      turn.endAt
    );
    await squareGateway.insertAll(conn, turnRecord.id, turn.board.discs);
    //最初のターンはmoveが存在しないため、エラーになる。そのため、moveが存在する時だけ実行する
    if (turn.move) {
      await moveGateway.insert(
        conn,
        turnRecord.id,
        turn.move.disc,
        turn.move.point.x,
        turn.move.point.y
      );
    }
  }
}
