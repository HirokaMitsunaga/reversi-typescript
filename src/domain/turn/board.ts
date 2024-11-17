import { Disc } from "./disc.js";
import { Move } from "./move.js";
import { Point } from "./point.js";

export class Board {
  constructor(private _discs: Disc[][]) {}

  place(move: Move): Board {
    //空のマス目でない場合、置くことができない
    if (this._discs[move.point.y][move.point.x] !== Disc.Empty) {
      throw new Error("Selected point is not empty");
    }
    //ひっくり返せる点をリストアップ
    const flipPoints = this.listFlipPoints();
    //ひっくり返す点がない場合、置くことができない
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

    return new Board(newDiscs);
  }

  private listFlipPoints(): Point[] {
    return [new Point(0, 0)];
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
