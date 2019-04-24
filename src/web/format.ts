export type WebDataType = "Login"
    | "Room List"
    | "Enter Room"
    | "Synchronization Data"
    | "Error"
    | "Message"

export abstract class WebData {
    constructor(
        public readonly type: WebDataType,
        public readonly data: any
    ) { }
}
export class MessageData extends WebData {
    constructor(public readonly info: string) {
        super("Message", {
            info: info
        })
    }
}
export class ErrorData extends WebData {
    constructor(public readonly info: string) {
        super("Error", {
            info: info
        })
    }
}
export class LoginData extends WebData {
    constructor(public readonly user: string, public readonly pwd: string) {
        super("Login", {
            user: user,
            pwd: pwd
        })
    }
}
export class EnterRoomData extends WebData {
    constructor(public readonly room: number) {
        super("Login", {
            room: room
        })
    }
}


export type ModelData = {
    roads: RoadData[],
    buildings: BuildingData[]
}
export declare type RoadData = {
    from: THREE.Vector2,
    to: THREE.Vector2,
    width: number,
}
export declare type BuildingData = {
    prototype: string,
    center: THREE.Vector2
}
export class SynchronizationData extends WebData {
    constructor(public readonly modelData: ModelData) {
        super("Synchronization Data", {
            roads: modelData.roads,
            buildings: modelData.buildings
        })
    }
}