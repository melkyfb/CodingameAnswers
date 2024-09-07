enum Direction {
    TOP = "T",
    BOTTOM = "B",
    LEFT = "L",
    RIGHT = "R"
}

class Vector {
    public constructor(public x: number, public y: number) {}

    add(other: Vector) {
        return new Vector(this.x + other.x, this.y + other.y)
    }

    scale(scalar: number) {
        return new Vector(this.x * scalar, this.y * scalar)
    }

    getDistanceTo(other: Vector): number {
        return Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2)
    }

    toString(): string {
        return `x: ${this.x}, y: ${this.y}`
    }
}

interface CollectionObj {
    id: number
}

class Creature implements CollectionObj {
    id: number
    color: number
    type: number
    position?: Vector
    velocity?: Vector

    predictNextPosition(deltaTime: number): Vector | undefined {
        const deltaPosition = this.velocity?.scale(deltaTime)
        if (deltaPosition) {
            return this.position?.add(deltaPosition)
        }
    }

    toString(): string {
        return `id: ${this.id}, color: ${this.color}, type: ${this.type}, position: ${this.position}, velocity: ${this.velocity}`
    }
}

class VectorHelper {
    static getNearestVector(vectors: Vector[], vector: Vector): Vector{
        return vectors.reduce((n, v) => v.getDistanceTo(vector) < n.getDistanceTo(vector) ? v : n)
    }
}

class CreaturesHelper {
    static subtractCreatures(creatures1: Creature[], creatures2: Creature[]): Creature[] {
        const creatures2Ids = creatures2.map(c => c.id)
        return creatures1.filter(c => !creatures2Ids.includes(c.id))
    }
}

class Drone implements CollectionObj {
    id: number
    position: Vector
    emergency: number
    battery: number

    getNextMove(creatures: Creature[], creaturesScanned: Creature[]) {
        let move = this.getMoveAction(creatures, creaturesScanned)
        let highLight = this.shouldUseHighlight(creatures, creaturesScanned)
        const finalMove = `${move} ${highLight}`
        console.log(finalMove,finalMove) // twice to show above the Drone
    }

    shouldUseHighlight(creatures: Creature[], creaturesScanned: Creature[]): number {
        let highLight = 0
        const creaturesNotScanned = CreaturesHelper.subtractCreatures(creatures, creaturesScanned)
        const creaturesVectors = creaturesNotScanned.map(c => c.position)
        if (creaturesVectors?.length) {
            const validVectors = creaturesVectors.filter((v): v is Vector => v !== undefined)
            const nearestVector = VectorHelper.getNearestVector(validVectors, this.position)
            if (nearestVector.getDistanceTo(this.position) <= Config.HIGH_LIGHT_ACTIVATE_DISTANCE) {
                highLight = 1
            }
        }
        return highLight
    }

    getMoveAction(creatures: Creature[], creaturesScanned: Creature[]): string {
        let move = "WAIT"
        const creaturesNotScanned = CreaturesHelper.subtractCreatures(creatures, creaturesScanned)
        const creaturesVectors = creaturesNotScanned.map(c => c.position)
        if (creaturesVectors?.length) {
            const validVectors = creaturesVectors.filter((v): v is Vector => v !== undefined)
            const nearestVector = VectorHelper.getNearestVector(validVectors, this.position)
            if (nearestVector.x !== this.position.x && nearestVector.y > this.position.y) {
                move = `MOVE ${nearestVector.x} ${nearestVector.y}`
            }
        }
        return move
    }
}

class DroneScan {
    drone: Drone
    creature: Creature
}

class RadarBlip {
    drone: Drone
    creature: Creature
    direction: Direction
}

class DebugManager {
    static message(message: string) {
        if (Config.DEBUG) {
            console.error(`DEBUG: ${message}`)
        }
    }
}

class Helper {
    static findById<T extends CollectionObj>(id: number, objs: T[]): T | undefined {
        return objs.find(o => o.id === id)
    }

    static getEnumByValue<T extends { [index: string]: string }>(
        myEnum: T,
        enumValue: string
      ): T[keyof T] | undefined {
        const enumMap: { [key: string]: T[keyof T] } = {}

        for (const key in myEnum) {
            const value = myEnum[key as keyof typeof myEnum];
            enumMap[value] = value
        }

        return enumMap[enumValue]
    }
}

class Config {
    static DEBUG = true

    static DELTA_TIME_FACTOR = 100 // this is to guess the next position of the creature

    static HIGH_LIGHT_ACTIVATE_DISTANCE = 2000 // 2000 is the minimum default distance for scan with high light
}

class Game {
    creatures: Creature[]
    playerScore: number
    AIScore: number
    playerCreatures: Creature[]
    playerDrones: Drone[]
    AICreatures: Creature[]
    AIDrones: Drone[]
    visibleCreatures: Creature[]
    playerDroneScans: DroneScan[]
    playerRadarBlips: RadarBlip[]

    init() {
        const creaturesCount = parseInt(readline())
        this.creatures = []
        for (let i = 0; i < creaturesCount; i++) {
            var inputs: string[] = readline().split(' ')
            const creature = new Creature()
            creature.id = parseInt(inputs[0])
            creature.color = parseInt(inputs[1])
            creature.type = parseInt(inputs[2])
            this.creatures.push(creature)
        }

        while (true) {
            this.processInputs()
            this.debugVariables()
            
            for (const drone of this.playerDrones) {
                this.getAction(drone)
            }
        }
    }

    processInputs() {
        this.playerScore = parseInt(readline())
        this.AIScore = parseInt(readline())

        const playerScanCount = parseInt(readline())
        this.playerCreatures = []
        for (let i = 0;i < playerScanCount;i++) {
            const creatureId: number = parseInt(readline())
            const creature = Helper.findById(creatureId, this.creatures)
            if (creature) {
                this.playerCreatures.push(creature)
            }
        }

        const AIScanCount = parseInt(readline())
        this.AICreatures = []
        for (let i = 0; i < AIScanCount; i++) {
            const creatureId: number = parseInt(readline())
            const creature = Helper.findById(creatureId, this.creatures)
            if (creature) {
                this.AICreatures.push(creature)
            }
        }

        const playerDroneCount: number = parseInt(readline())
        this.playerDrones = []
        for (let i = 0; i < playerDroneCount; i++) {
            const drone = new Drone()
            var inputs: string[] = readline().split(' ')
            drone.id = parseInt(inputs[0])
            drone.position = new Vector(parseInt(inputs[1]), parseInt(inputs[2]))
            drone.emergency = parseInt(inputs[3])
            drone.battery = parseInt(inputs[4])
            this.playerDrones.push(drone)
        }
        
        const AIDroneCount: number = parseInt(readline())
        this.AIDrones = []
        for (let i = 0; i < AIDroneCount; i++) {
            const drone = new Drone()
            var inputs: string[] = readline().split(' ')
            drone.id = parseInt(inputs[0])
            drone.position = new Vector(parseInt(inputs[1]), parseInt(inputs[2]))
            drone.emergency = parseInt(inputs[3])
            drone.battery = parseInt(inputs[4])
            this.AIDrones.push(drone)
        }

        const droneScanCount: number = parseInt(readline())
        this.playerDroneScans = []
        for (let i = 0; i < droneScanCount; i++) {
            var inputs: string[] = readline().split(' ')
            const droneId: number = parseInt(inputs[0])
            const drone = Helper.findById(droneId, this.playerDrones)
            const creatureId: number = parseInt(inputs[1])
            const creature = Helper.findById(creatureId, this.creatures)
            if (drone && creature) {
                const droneScan = new DroneScan()
                droneScan.drone = drone
                droneScan.creature = creature
                this.playerDroneScans.push(droneScan)
            }
        }

        const visibleCreatureCount: number = parseInt(readline())
        this.visibleCreatures = []
        for (let i = 0; i < visibleCreatureCount; i++) {
            var inputs: string[] = readline().split(' ')
            const creatureId: number = parseInt(inputs[0])
            const creature = Helper.findById(creatureId, this.creatures)
            const creatureX: number = parseInt(inputs[1])
            const creatureY: number = parseInt(inputs[2])
            const position = new Vector(creatureX, creatureY)
            const creatureVx: number = parseInt(inputs[3])
            const creatureVy: number = parseInt(inputs[4])
            const velocity = new Vector(creatureVx, creatureVy)
            if (creature) {
                creature.position = position
                creature.velocity = velocity
                this.visibleCreatures.push(creature)
            }
        }

        const radarBlipCount: number = parseInt(readline())
        this.playerRadarBlips = []
        for (let i = 0; i < radarBlipCount; i++) {
            var inputs: string[] = readline().split(' ')
            const radarBlip = new RadarBlip()
            const droneId: number = parseInt(inputs[0])
            const drone = Helper.findById(droneId, this.playerDrones)
            const creatureId: number = parseInt(inputs[1])
            const creature = Helper.findById(creatureId, this.creatures)
            const direction = Helper.getEnumByValue(Direction, inputs[2])
            if (creature && drone && direction) {
                radarBlip.creature = creature
                radarBlip.drone = drone
                radarBlip.direction = direction
                this.playerRadarBlips.push(radarBlip)
            }
        }
    }

    getAction(drone: Drone) {    
            drone.getNextMove(this.visibleCreatures, this.playerCreatures)
    }

    debugVariables() {
        DebugManager.message(`creatures: ${JSON.stringify(this.creatures)}`);
        DebugManager.message(`playerScore: ${this.playerScore}`);
        DebugManager.message(`AIScore: ${this.AIScore}`);
        DebugManager.message(`playerCreatures: ${JSON.stringify(this.playerCreatures)}`);
        DebugManager.message(`playerDrones: ${JSON.stringify(this.playerDrones)}`);
        DebugManager.message(`AICreatures: ${JSON.stringify(this.AICreatures)}`);
        DebugManager.message(`AIDrones: ${JSON.stringify(this.AIDrones)}`);
        DebugManager.message(`visibleCreatures: ${JSON.stringify(this.visibleCreatures)}`);
        DebugManager.message(`playerDroneScans: ${JSON.stringify(this.playerDroneScans)}`);
        DebugManager.message(`playerRadarBlips: ${JSON.stringify(this.playerRadarBlips)}`);
      }
      
}

const game = new Game()
game.init()
