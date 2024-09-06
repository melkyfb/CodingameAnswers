class Vector {
    public constructor(public x: number, public y: number) {}
}

class Creature {
    id: number
    color: number
    type: number
    position?: Vector
    speed?: Vector
}

class Drone {
    id: number
    position: Vector
    emergency: number
    battery: number
}

class DebugManager {
    message(message: string) {
        if (Config.DEBUG) {
            console.error(`DEBUG: ${message}`)
        }
    }
}

class Config {
    static DEBUG = true
}

class Game {
    creaturesCount: number
    creatures: Creature[]
    playerScore: number
    AIScore: number
    playerScanCount: number
    playerCreatures: Creature[]
    playerDrones: Drone[]
    AIScanCount: number
    AICreatures: Creature[]
    AIDrones: Drone[]

    init() {
        this.creaturesCount = parseInt(readline())
        for (let i = 0; i < this.creaturesCount; i++) {
            var inputs: string[] = readline().split(' ')
            const creature = new Creature()
            creature.id = parseInt(inputs[0])
            creature.color = parseInt(inputs[1])
            creature.type = parseInt(inputs[2])
            this.creatures.push(creature)
        }

        // game loop
        while (true) {
            
            this.playerScore = parseInt(readline())
            this.AIScore = parseInt(readline())
            this.playerScanCount = parseInt(readline())
            this.playerCreatures = []
            for (let i = 0;i < this.playerScanCount;i++) {
                const creatureId: number = parseInt(readline())
                const creature = this.creatures.find(c => c.id === creatureId)
                if (creature) {
                    this.playerCreatures.push(creature)
                }
            }
            this.AIScanCount = parseInt(readline())
            this.AICreatures = []
            for (let i = 0; i < this.AIScanCount; i++) {
                const creatureId: number = parseInt(readline())
                const creature = this.creatures.find(c => c.id === creatureId)
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
                var inputs: string[] = readline().split(' ')
                const droneId: number = parseInt(inputs[0])
                const droneX: number = parseInt(inputs[1])
                const droneY: number = parseInt(inputs[2])
                const emergency: number = parseInt(inputs[3])
                const battery: number = parseInt(inputs[4])
            }
            const droneScanCount: number = parseInt(readline())
            for (let i = 0; i < droneScanCount; i++) {
                var inputs: string[] = readline().split(' ')
                const droneId: number = parseInt(inputs[0])
                const creatureId: number = parseInt(inputs[1])
            }
            const visibleCreatureCount: number = parseInt(readline())
            for (let i = 0; i < visibleCreatureCount; i++) {
                var inputs: string[] = readline().split(' ')
                const creatureId: number = parseInt(inputs[0])
                const creatureX: number = parseInt(inputs[1])
                const creatureY: number = parseInt(inputs[2])
                const creatureVx: number = parseInt(inputs[3])
                const creatureVy: number = parseInt(inputs[4])
            }
            const radarBlipCount: number = parseInt(readline())
            for (let i = 0; i < radarBlipCount; i++) {
                var inputs: string[] = readline().split(' ')
                const droneId: number = parseInt(inputs[0])
                const creatureId: number = parseInt(inputs[1])
                const radar: string = inputs[2]
            }
            for (let i = 0; i < playerDroneCount; i++) {
        
                // Write an action using console.log()
                // To debug: console.error('Debug messages...')
        
                console.log('WAIT 1')         // MOVE <x> <y> <light (1|0)> | WAIT <light (1|0)>
        
            }
        }

    }
}

const game = new Game()
game.init()
