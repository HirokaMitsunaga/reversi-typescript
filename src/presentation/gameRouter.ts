import express from "express";
import { GameServive } from "../application/gameService.js";

export const gameRouter = express.Router();

const gameService = new GameServive();

gameRouter.post("/api/games", async (req, res) => {
  await gameService.startGame();

  res.status(201).end();
});
