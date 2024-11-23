import { DomainError } from "../../eroor/domainError.js";
import { Board, initialBoard } from "./board.js";
import { Disc } from "./disc.js";
import { Move } from "./move.js";
import { Point } from "./point.js";

export class Turn {
  constructor(
    private _gameId: number,
    private _turnCount: number,
    private _nextDisc: Disc | undefined,
    private _move: Move | undefined,
    private _board: Board,
    private _endAt: Date
  ) {}

  placeNext(disc: Disc, point: Point): Turn {
    //打とうとした石が、次の石でない場合、置くことができない
    if (disc !== this._nextDisc) {
      throw new DomainError(
        "SelectedDiscIsNotNextDisc",
        "Selected disc is not next disc"
      );
    }
    const move = new Move(disc, point);

    const nextBoard = this._board.place(move);

    //TODO  次の石が置けない場合はスキップする処理
    //現在が黒なら白、白なら黒になる
    const nextDisc = this.decideNextDisc(nextBoard, disc);

    return new Turn(
      this._gameId,
      this._turnCount + 1,
      nextDisc,
      move,
      nextBoard,
      new Date()
    );
  }

  private decideNextDisc(board: Board, previousDisc: Disc): Disc | undefined {
    //盤面に対して白が置けるのか黒がおけるのか判断する
    const existDarkValidMove = board.existValidMove(Disc.Dark);
    const existLightValidMove = board.existValidMove(Disc.Light);

    if (existDarkValidMove && existLightValidMove) {
      //両方置ける場合、前の石と反対の石の番
      return previousDisc === Disc.Dark ? Disc.Light : Disc.Dark;
    } else if (!existDarkValidMove && !existLightValidMove) {
      //両方置けない場合は、次の石はない
      return undefined;
    } else if (existDarkValidMove) {
      //片方しかない場合は、置ける方の石の番
      return Disc.Dark;
    } else {
      return Disc.Light;
    }
  }

  get gameId() {
    return this._gameId;
  }

  get turnCount() {
    return this._turnCount;
  }

  get nextDisc() {
    return this._nextDisc;
  }

  get move() {
    return this._move;
  }

  get board() {
    return this._board;
  }

  get endAt() {
    return this._endAt;
  }
}

export function firstTurn(gameId: number, endAt: Date): Turn {
  return new Turn(gameId, 0, Disc.Dark, undefined, initialBoard, endAt);
}
