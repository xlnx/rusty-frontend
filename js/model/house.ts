class HousePrototype {
  readonly model: any
  readonly w: number
  readonly h: number

  constructor(filename: string) {
    //   const data = aquire(filename)
    //   model = loadModel(data.model)
    // w = data.w
    // h = data.h
  }
}
class House {
  constructor(readonly proto: HousePrototype) { }
}
