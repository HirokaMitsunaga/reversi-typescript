import express from "express";

const PORT = 3000;

const app = express();

app.get("/api/hello", async (req, res) => {
  res.json({
    message: "Hello Express",
  });
});

//3000番ポートでサーバーの起動を試みて、成功したらログ出力してる。
app.listen(PORT, () => {
  console.log(`Reversi application started: http://localhost:${PORT}`);
});
