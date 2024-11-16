import { Disc } from "./disc.js";
import { Point } from "./point.js";

export class Move {
  constructor(private _disc: Disc, private _point: Point) {}

  get disc() {
    return this._disc;
  }

  get point() {
    return this._point;
  }
}
