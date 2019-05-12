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
    toString() {
        return JSON.stringify(this, null, 4)
    }
}
export class MessageData extends WebData {
    constructor(info: string) {
        super("Message", {
            info: info
        })
    }
}
export class ErrorData extends WebData {
    constructor(info: string) {
        super("Error", {
            info: info
        })
    }
}
export class LoginData extends WebData {
    constructor(user: string, pwd: string) {
        super("Login", {
            user: user,
            pwd: pwd
        })
    }
}
export class EnterRoomData extends WebData {
    constructor(room: number) {
        super("Login", {
            room: room
        })
    }
}


export type ModelData = {
    state: string, // 'insert' or 'remove'
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
    constructor(modelData: ModelData) {
        super("Synchronization Data", {
            state: modelData.state,
            roads: modelData.roads,
            buildings: modelData.buildings
        })
    }
}