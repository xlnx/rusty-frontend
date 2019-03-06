// interface PlainCoord {
//   x: number, y: number
// }



// class Point {
//   static precision = 0.00001
//   constructor(
//     public readonly x: number,
//     public readonly y: number
//   ) { }

//   minus(pt: Point): Point {
//     return new Point(this.x - pt.x, this.y - pt.y)
//   }
//   plus(pt: Point): Point {
//     return new Point(this.x + pt.x, this.y + pt.y)
//   }
//   div(n)
//   equals(pt: Point): boolean {
//     return Math.abs(this.x - pt.x) <= Point.precision && Math.abs(this.y - pt.y) <= Point.precision
//   }
//   dot(pt: Point): number {
//     return this.x * pt.x + this.y * pt.y
//   }
//   cross(pt: Point): number {
//     return this.x * pt.y - pt.x * this.y
//   }
//   norm(): number {
//     return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
//   }
// }