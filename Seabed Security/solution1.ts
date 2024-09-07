enum Direction {
    TOP = "T",
    BOTTOM = "B",
    LEFT = "L",
    RIGHT = "R"
}

class Vector {
    public constructor(public x: number, public y: number) {}
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
}

class Drone implements CollectionObj {
    id: number
    position: Vector
    emergency: number
    battery: number
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
    message(message: string) {
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
    
            // Write an action using console.log()
            // To debug: console.error('Debug messages...')
    
            console.log('WAIT 1')         // MOVE <x> <y> <light (1|0)> | WAIT <light (1|0)>
    }
}

const game = new Game()
game.init()
