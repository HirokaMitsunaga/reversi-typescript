import express from "express";
import { GameServive } from "../application/service/gameService.js";
import { GameMySQLRepository } from "../infrastructure/repository/game/gameMySQLRepository.js";
import { TurnMySQLRepository } from "../infrastructure/repository/turn/turnMySQLRepository.js";

export const gameRouter = express.Router();

const gameService = new GameServive(
  new GameMySQLRepository(),
  new TurnMySQLRepository()
);

gameRouter.post("/api/games", async (req, res) => {
  await gameService.startGame();

  res.status(201).end();
});
