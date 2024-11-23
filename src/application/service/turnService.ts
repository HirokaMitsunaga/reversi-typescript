import express from "express";
import { connectMySQL } from "../../infrastructure/connection.js";
import { GameGateway } from "../../infrastructure/gameGateway.js";
import { Disc, toDisc } from "../../domain/model/turn/disc.js";
import { Point } from "../../domain/model/turn/point.js";
import { TurnRepository } from "../../domain/model/turn/turnRepository.js";
import { GameRepository } from "../../domain/model/game/gameRepository.js";
import { ApplicationError } from "../error/applicationError.js";

export const turnRouter = express.Router();

const gameGateway = new GameGateway();

const turnRepository = new TurnRepository();
const gameRepository = new GameRepository();

class FindLatestGameTurnByTurnCountOutput {
  constructor(
    private _turnCount: number,
    private _board: number[][],
    private _nextDisc: number | undefined,
    private _winnerDisc: number | undefined
  ) {}

  get turnCount() {
    return this._turnCount;
  }

  get board() {
    return this._board;
  }

  get nextDisc() {
    return this._nextDisc;
  }

  get winnerDisc() {
    return this._winnerDisc;
  }
}

export class TurnService {
  async findLatestGameTurnByTurnCount(
    turnCount: number
  ): Promise<FindLatestGameTurnByTurnCountOutput> {
    const conn = await connectMySQL();
    try {
      const game = await gameRepository.findLatest(conn);
      if (!game) {
        throw new ApplicationError(
          "LatestGameNotFound",
          "Latest game not found"
        );
      }
      if (!game.id) {
        throw new Error("game.id not exist");
      }

      const turn = await turnRepository.findForGameIdAndTurnCount(
        conn,
        game.id,
        turnCount
      );

      return new FindLatestGameTurnByTurnCountOutput(
        turnCount,
        turn.board.discs,
        turn.nextDisc,
        // TODO 決着がついている場合、game_results テーブルから取得する
        undefined
      );
    } finally {
      await conn.end();
    }
  }

  async registerTurn(turnCount: number, disc: Disc, point: Point) {
    const conn = await connectMySQL();
    try {
      await conn.beginTransaction();

      // 1つ前のターンを取得する
      const game = await gameRepository.findLatest(conn);
      if (!game) {
        throw new ApplicationError(
          "LatestGameNotFound",
          "Latest game not found"
        );
      }
      if (!game.id) {
        throw new Error("game.id not exist");
      }

      const previousTurnCount = turnCount - 1;
      const previousTurn = await turnRepository.findForGameIdAndTurnCount(
        conn,
        game.id,
        previousTurnCount
      );
      //石を置く
      const newTurn = previousTurn.placeNext(disc, point);
      // ターンを保存する
      await turnRepository.save(conn, newTurn);

      //勝敗が決した場合、対戦結果を保存
      if (newTurn.gameEnded()) {
        const winnerDisc = newTurn.winnerDisc();
      }

      await conn.commit();
    } finally {
      await conn.end();
    }
  }
}
