class HousePrototype {
  readonly model: any
  // readonly w: number
  // readonly h: number

  constructor(filename: string,
    readonly w: number,
    readonly h: number) {

    //   const data = aquire(filename)
    //   model = loadModel(data.model)
    // w = data.w
    // h = data.h
  }
}
class House {
  constructor(readonly type: HousePrototype, readonly x: number, readonly y: number) { }
  crossRoad(road: Road): boolean {

  }
}
