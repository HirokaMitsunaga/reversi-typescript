import { Disc, isOppositeDisc } from "./disc.js";
import { Move } from "./move.js";
import { Point } from "./point.js";

export class Board {
  private _walledDiscs: Disc[][];
  constructor(private _discs: Disc[][]) {
    this._walledDiscs = this.wallDiscs();
  }

  place(move: Move): Board {
    //空のマス目でない場合、置くことができない
    if (this._discs[move.point.y][move.point.x] !== Disc.Empty) {
      throw new Error("Selected point is not empty");
    }
    //クリックされたマス目の中でひっくり返せる点をリストアップ
    const flipPoints = this.listFlipPoints(move);
    //クリックされたマス目の中でひっくり返す点がない場合、置くことができない
    if (flipPoints.length === 0) {
      throw new Error("Flip points is empty");
    }

    //盤面をコピー
    const newDiscs = this._discs.map((line) => {
      return line.map((disc) => {
        return disc;
      });
    });

    //石を置く
    newDiscs[move.point.y][move.point.x] = move.disc;
    // ひっくり返す
    flipPoints.forEach((p) => {
      newDiscs[p.y][p.x] = move.disc;
    });

    return new Board(newDiscs);
  }

  //ひっくり返すことのできる点をリストアップする関数
  private listFlipPoints(move: Move): Point[] {
    const flipPoints: Point[] = [];

    //moveの表を番兵を考慮して調節する
    const walledX = move.point.x + 1;
    const walledY = move.point.y + 1;

    const checkFlipPoints = (xMove: number, yMove: number) => {
      //　上方向
      const flipCandidate: Point[] = [];

      //　1つ動いた位置から開始
      let cursorX = walledX + xMove;
      let cursorY = walledY + yMove;

      //手と逆の色の石がある間、1つずつ見ていく
      while (isOppositeDisc(move.disc, this._walledDiscs[cursorY][cursorX])) {
        //番兵を考慮して-1にする
        flipCandidate.push(new Point(cursorX - 1, cursorY - 1));
        cursorX += xMove;
        cursorY += yMove;
        //次の手が同じ色の石なら、ひっくり変える石が確定
        if (move.disc === this._walledDiscs[cursorY][cursorX]) {
          flipPoints.push(...flipCandidate);
          break;
        }
      }
    };

    //上
    checkFlipPoints(0, -1);
    //左上
    checkFlipPoints(-1, -1);
    //左
    checkFlipPoints(-1, 0);
    //左下
    checkFlipPoints(-1, 1);
    //下
    checkFlipPoints(0, 1);
    //右下
    checkFlipPoints(1, 1);
    //右
    checkFlipPoints(1, 0);
    //右上
    checkFlipPoints(1, -1);

    return flipPoints;
  }

  private wallDiscs(): Disc[][] {
    const walled: Disc[][] = [];

    //(this._discs[0].length + 2)は10になる想定
    const topAndBottomWall = Array(this._discs[0].length + 2).fill(Disc.Wall);

    //上部の壁の追加
    walled.push(topAndBottomWall);

    //左右の壁の追加
    this._discs.forEach((line) => {
      const walledLine = [Disc.Wall, ...line, Disc.Wall];
      walled.push(walledLine);
    });

    //下部の壁の追加
    walled.push(topAndBottomWall);

    return walled;
  }

  get discs() {
    return this._discs;
  }
}

const E = Disc.Empty;
const D = Disc.Dark;
const L = Disc.Light;

const INITIAL_BOARD = [
  [E, E, E, E, E, E, E, E],
  [E, E, E, E, E, E, E, E],
  [E, E, E, E, E, E, E, E],
  [E, E, E, D, L, E, E, E],
  [E, E, E, L, D, E, E, E],
  [E, E, E, E, E, E, E, E],
  [E, E, E, E, E, E, E, E],
  [E, E, E, E, E, E, E, E],
];

//_discsはborad内部で持つべき値のため、board.tsの外に出したくない。
//そのため、new Boradとした状態で公開する。
export const initialBoard = new Board(INITIAL_BOARD);
