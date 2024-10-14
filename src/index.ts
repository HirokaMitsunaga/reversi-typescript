import express from "express";
import morgan from "morgan";
import "express-async-errors";
import mysql from "mysql2/promise";

const EMPTY = 0;
const DARK = 1;
const LIGHT = 2;

const INITIAL_BOARD = [
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, DARK, LIGHT, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, LIGHT, DARK, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
];

const PORT = 3000;

const app = express();

app.use(morgan("dev"));
app.use(express.static("static", { extensions: ["html"] }));
app.use(express.json());

app.get("/api/hello", async (req, res) => {
  res.json({
    message: "Hello Express!",
  });
});

app.get("/api/error", async (req, res) => {
  throw new Error("Error endpoint");
});

app.post("/api/games", async (req, res) => {
  const now = new Date();

  const conn = await connectMySQL();
  try {
    await conn.beginTransaction();

    const gameInsertRusult = await conn.execute<mysql.OkPacket>(
      "insert into games (started_at) values (?)",
      [now]
    );
    const gameId = gameInsertRusult[0].insertId;

    const turnInsertResut = await conn.execute<mysql.OkPacket>(
      "insert into turns (game_id, turn_count, next_disc, end_at) values (?,?,?,?)",
      [gameId, 0, DARK, now]
    );
    const turnId = turnInsertResut[0].insertId;

    //最初の状態のマス目の数を数えている(64となる)
    //reduceについてはhttps://qiita.com/rokumura7/items/cdfc92dba508bbfb6127を参照するとわかりやすい
    const squareCount = INITIAL_BOARD.map((line) => line.length).reduce(
      (v1, v2) => v1 + v2,
      0
    );

    const squaresInsertSql =
      "insert into squares (turn_id, x, y, disc) values" +
      Array.from(Array(squareCount))
        .map(() => "(?,?,?,?)")
        .join(",");

    //２重ループしている
    //一巡目は、indexがyに対応
    //二巡目は、index,がxに対応
    const squaresInsertValues: any[] = [];
    INITIAL_BOARD.forEach((line, y) => {
      line.forEach((disc, x) => {
        squaresInsertValues.push(turnId);
        squaresInsertValues.push(x);
        squaresInsertValues.push(y);
        squaresInsertValues.push(disc);
      });
    }),
      await conn.execute(squaresInsertSql, squaresInsertValues);

    await conn.commit();
  } finally {
    await conn.end();
  }

  res.status(201).end();
});

app.get("/api/games/latest/turns/:turnCount", async (req, res) => {
  const turnCount = parseInt(req.params.turnCount);
  const conn = await connectMySQL();
  try {
    //最新の対戦の取得
    const gameSelectResult = await conn.execute<mysql.RowDataPacket[]>(
      "select id, started_at from games order by id desc limit 1"
    );
    const game = gameSelectResult[0][0];

    const turnSelectResult = await conn.execute<mysql.RowDataPacket[]>(
      "select id, game_id, turn_count, next_disc, end_at from turns where game_id = ? and turn_count = ?",
      [game["id"], turnCount]
    );
    const turn = turnSelectResult[0][0];

    const squareSelectResult = await conn.execute<mysql.RowDataPacket[]>(
      "select id, turn_id, x, y, disc from squares where turn_id = ?",
      [turn["id"]]
    );

    const squares = squareSelectResult[0];
    //8x8の二次元配列を作成し、x,y、discを入れいていく
    const board = Array.from(Array(8)).map(() => Array.from(Array(8)));
    squares.forEach((s) => {
      board[s.y][s.x] = s.disc;
    });

    const responseBody = {
      turnCount,
      board,
      nextDisc: turn["next_disc"],
      //TODO: 決着がついている場合、game_result Tableから取得する
      wiinerdisc: null,
    };
    res.json(responseBody);
  } finally {
    await conn.end();
  }
});

app.post("/api/games/latest/turns", async (req, res) => {
  const turnCount = parseInt(req.body.turnCount);
  const disc = parseInt(req.body.move.disc);
  const x = parseInt(req.body.move.x);
  const y = parseInt(req.body.move.y);

  //一つ前のターンを取得する
  const conn = await connectMySQL();
  try {
    //最新の対戦の取得
    const gameSelectResult = await conn.execute<mysql.RowDataPacket[]>(
      "select id, started_at from games order by id desc limit 1"
    );
    const game = gameSelectResult[0][0];

    //一つ前の盤面を取得するために-1をつけている
    const previousTurnCount = turnCount - 1;
    const turnSelectResult = await conn.execute<mysql.RowDataPacket[]>(
      "select id, game_id, turn_count, next_disc, end_at from turns where game_id = ? and turn_count = ?",
      [game["id"], previousTurnCount]
    );
    const turn = turnSelectResult[0][0];

    const squareSelectResult = await conn.execute<mysql.RowDataPacket[]>(
      "select id, turn_id, x, y, disc from squares where turn_id = ?",
      [turn["id"]]
    );

    const squares = squareSelectResult[0];
    //8x8の二次元配列を作成し、x,y、discを入れいていく
    const board = Array.from(Array(8)).map(() => Array.from(Array(8)));
    squares.forEach((s) => {
      board[s.y][s.x] = s.disc;
    });

    //盤面に置けるのかチェックする

    //石を置く
    board[y][x] = disc;

    //ひっくり返す

    //ターンを保存する
    const nextDisc = disc === DARK ? LIGHT : DARK;
    const now = new Date();
    const turnInsertResut = await conn.execute<mysql.OkPacket>(
      "insert into turns (game_id, turn_count, next_disc, end_at) values (?,?,?,?)",
      [game["id"], turnCount, nextDisc, now]
    );
    const turnId = turnInsertResut[0].insertId;

    //最初の状態のマス目の数を数えている(64となる)
    //reduceについてはhttps://qiita.com/rokumura7/items/cdfc92dba508bbfb6127を参照するとわかりやすい
    const squareCount = board
      .map((line) => line.length)
      .reduce((v1, v2) => v1 + v2, 0);

    const squaresInsertSql =
      "insert into squares (turn_id, x, y, disc) values" +
      Array.from(Array(squareCount))
        .map(() => "(?,?,?,?)")
        .join(",");

    //２重ループしている
    //一巡目は、indexがyに対応
    //二巡目は、index,がxに対応
    const squaresInsertValues: any[] = [];
    INITIAL_BOARD.forEach((line, y) => {
      line.forEach((disc, x) => {
        squaresInsertValues.push(turnId);
        squaresInsertValues.push(x);
        squaresInsertValues.push(y);
        squaresInsertValues.push(disc);
      });
    }),
      await conn.execute(squaresInsertSql, squaresInsertValues);

    await conn.execute(
      "insert into moves (turn_id, disc, x,y) values(?,?,?,?)",
      [turnId, disc, x, y]
    );

    await conn.commit();
  } finally {
    await conn.end();
  }

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

async function connectMySQL() {
  return await mysql.createConnection({
    host: "localhost",
    database: "reversi",
    user: "reversi",
    password: "password",
  });
}
