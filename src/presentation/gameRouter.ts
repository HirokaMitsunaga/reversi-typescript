import express from "express";
import { StartNewGameUseCase } from "../application/useCase/startNewGameUseCase.js";
import { GameMySQLRepository } from "../infrastructure/repository/game/gameMySQLRepository.js";
import { TurnMySQLRepository } from "../infrastructure/repository/turn/turnMySQLRepository.js";

export const gameRouter = express.Router();

const startNewGameUseCase = new StartNewGameUseCase(
  new GameMySQLRepository(),
  new TurnMySQLRepository()
);

gameRouter.post("/api/games", async (req, res) => {
  await startNewGameUseCase.run();

  res.status(201).end();
});
