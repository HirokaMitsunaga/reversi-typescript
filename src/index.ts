import express from "express";
import morgan from "morgan";
import "express-async-errors";

const PORT = 3000;

const app = express();

app.use(morgan("dev"));
app.use(express.static("static", { extensions: ["html"] }));

app.get("/api/hello", async (req, res) => {
  res.json({
    message: "Hello Express!",
  });
});

app.get("/api/error", async (req, res) => {
  throw new Error("Error endpoint");
});

app.post("/api/games", async (req, res) => {
  const startedAt = new Date();
  console.log(`startedAt = ${startedAt}`);

  res.status(201).end();
});
app.use(errorHandler);

//3000番ポートでサーバーの起動を試みて、成功したらログ出力してる。
app.listen(PORT, () => {
  console.log(`Reversi application started: http://localhost:${PORT}`);
});

function errorHandler(
  err: any,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  console.error("Unexpected error occured", err);
  res.status(500).send({
    message: "Unexpexted error occurred",
  });
}
