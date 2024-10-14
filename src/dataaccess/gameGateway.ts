import mysql from "mysql2/promise";
import { GameRecord } from "./gameRecord.js";

export class GameGateway {
  async findLatest(conn: mysql.Connection): Promise<GameRecord | undefined> {
    const gameSelectResult = await conn.execute<mysql.RowDataPacket[]>(
      "select id, started_at from games order by id desc limit 1"
    );
    const record = gameSelectResult[0][0];

    if (!record) {
      return undefined;
    }

    return new GameRecord(record["id"], record["started_at"]);
  }

  async insert(conn: mysql.Connection, startedAt: Date): Promise<GameRecord> {
    const gameInsertRusult = await conn.execute<mysql.OkPacket>(
      "insert into games (started_at) values (?)",
      [startedAt]
    );
    const gameId = gameInsertRusult[0].insertId;

    return new GameRecord(gameId, startedAt);
  }
}
