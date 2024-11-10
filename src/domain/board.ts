import { Disc } from "./disc.js";
import { Move } from "./move.js";

export class Board {
  constructor(private _discs: Disc[][]) {}

  place(move: Move): Board {
    //TODO 盤面に置けるかチェック

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
