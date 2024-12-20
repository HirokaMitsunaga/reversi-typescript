import express from "express";
import { Point } from "../domain/model/turn/point.js";
import { toDisc } from "../domain/model/turn/disc.js";
import { TurnMySQLRepository } from "../infrastructure/repository/turn/turnMySQLRepository.js";
import { GameMySQLRepository } from "../infrastructure/repository/game/gameMySQLRepository.js";
import { GameResultMySQLRepository } from "../infrastructure/repository/gameResult/gameResultMySQLRepository.js";
import { RegisterTurnUseCase } from "../application/useCase/registerTurnUseCase.js";
import { FindLatestGameTurnByTurnCountOutputUseCase } from "../application/useCase/findLatestGameTurnByTurnCountOutputUseCase.js";

export const turnRouter = express.Router();

const findLatestGameTurnByTurnCountOutputUseCase =
  new FindLatestGameTurnByTurnCountOutputUseCase(
    new TurnMySQLRepository(),
    new GameMySQLRepository(),
    new GameResultMySQLRepository()
  );

const registerTurnUseCase = new RegisterTurnUseCase(
  new TurnMySQLRepository(),
  new GameMySQLRepository(),
  new GameResultMySQLRepository()
);

interface TurnGetResponseBody {
  turnCount: number;
  board: number[][];
  nextDisc: number | null;
  winnerDisc: number | null;
}

turnRouter.get(
  "/api/games/latest/turns/:turnCount",
  async (req, res: express.Response<TurnGetResponseBody>) => {
    const turnCount = parseInt(req.params.turnCount);
    const output = await findLatestGameTurnByTurnCountOutputUseCase.run(
      turnCount
    );

    const responseBody = {
      turnCount: output.turnCount,
      board: output.board,
      nextDisc: output.nextDisc ?? null,
      winnerDisc: output.winnerDisc ?? null,
    };

    res.json(responseBody);
  }
);

interface TurnPostRequestBody {
  turnCount: number;
  move: {
    disc: number;
    x: number;
    y: number;
  };
}

turnRouter.post(
  "/api/games/latest/turns",
  async (req: express.Request<{}, {}, TurnPostRequestBody>, res) => {
    const turnCount = req.body.turnCount;
    const disc = toDisc(req.body.move.disc);
    const point = new Point(req.body.move.x, req.body.move.y);

    await registerTurnUseCase.run(turnCount, disc, point);

    res.status(201).end();
  }
);
