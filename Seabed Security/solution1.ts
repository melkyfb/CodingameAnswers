enum Direction {
    TOP = "T",
    BOTTOM = "B",
    LEFT = "L",
    RIGHT = "R",
    TOP_LEFT = "TL",
    TOP_RIGHT = "TR",
    BOTTOM_LEFT = "BL",
    BOTTOM_RIGHT = "BR"
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

        getPoints(): number {
            return this.type + 1
        }

        toString(): string {
            return `id: ${this.id}, color: ${this.color}, type: ${this.type}, position: ${this.position}, velocity: ${this.velocity}`
        }
    }

    class VectorHelper {
        static getNearestVector(vectors: Vector[], vector: Vector): Vector | undefined {
            if (vectors.length) {
                return vectors.reduce((n, v) => v.getDistanceTo(vector) < n.getDistanceTo(vector) ? v : n)
            }
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
        usedHighLight: boolean

        getNextMove(
            creatures: Creature[],
            creaturesVisible: Creature[],
            creaturesScanned: Creature[],
            creaturesOpponentScanned: Creature[],
            creaturesScanMap: Creature[],
            radarBlips: RadarBlip[]
        ) {
            let move = this.getMoveAction(creatures, creaturesVisible, creaturesScanned, creaturesOpponentScanned, creaturesScanMap, radarBlips)
            let highLight = this.shouldUseHighlight()
            const finalMove = `${move} ${highLight}`
            console.log(finalMove,finalMove) // twice to show above the Drone
        }

        shouldUseHighlight(): number {
            let highLight = 0
            const centerVector = new Vector(5000,5000)
            if (this.position.getDistanceTo(centerVector) < Config.HIGH_LIGHT_ACTIVATE_DISTANCE && !this.usedHighLight) {
                highLight = 1
                this.usedHighLight = true
            } 
            
            if (this.position.getDistanceTo(centerVector) >= Config.HIGH_LIGHT_ACTIVATE_DISTANCE) {
                this.usedHighLight = false
            }
            return highLight
        }

        getMoveAction(
            creatures: Creature[],
            creaturesVisible: Creature[],
            creaturesScanned: Creature[],
            creaturesOpponentScanned: Creature[],
            creaturesScanMap: Creature[],
            radarBlips: RadarBlip[]
        ): string {
            let move = "WAIT"
            DebugManager.message(`getMoveAction creatures: ${JSON.stringify(creatures)}`)
            DebugManager.message(`getMoveAction creaturesVisible: ${JSON.stringify(creaturesVisible)}`)
            DebugManager.message(`getMoveAction creaturesScanned: ${JSON.stringify(creaturesScanned)}`)
            DebugManager.message(`getMoveAction creaturesScanMap: ${JSON.stringify(creaturesScanMap)}`)
            DebugManager.message(`getMoveAction radarBlips: ${JSON.stringify(radarBlips)}`)
            const creaturesNotScanned = CreaturesHelper.subtractCreatures(creaturesVisible, [...creaturesScanMap, ...creaturesScanned, ...creaturesOpponentScanned])
            const creaturesVectors = creaturesNotScanned.map(c => c.position)
            const creaturesNotSaved = CreaturesHelper.subtractCreatures(creaturesScanMap, creaturesScanned)
            DebugManager.message(`getMoveAction creaturesNotScanned: ${JSON.stringify(creaturesNotScanned)}`)
            DebugManager.message(`getMoveAction creaturesVectors: ${JSON.stringify(creaturesVectors)}`)
            DebugManager.message(`getMoveAction creaturesNotSaved: ${JSON.stringify(creaturesNotSaved)}`)
            if (creaturesNotSaved.length >= Config.NUMBER_OF_CREATURES_SCANNED_BEFORE_SAVE && this.position.y > 500) {
                move = `MOVE ${this.position.x} 400`
            } else if (creaturesVectors.length) {
                const validVectors = creaturesVectors.filter((v): v is Vector => v !== undefined)
                const nearestVector = VectorHelper.getNearestVector(validVectors, this.position)
                if (nearestVector && nearestVector.x !== this.position.x) {
                    move = `MOVE ${nearestVector.x} ${nearestVector.y}`
                }
            } else {
                move = this.getNextMoveFromRadarBlips(creatures, [...creaturesScanMap, ...creaturesScanned], radarBlips)
            }
            return move
        }

        getNextMoveFromRadarBlips(
            creatures: Creature[],
            creaturesScanned: Creature[],
            radarBlips: RadarBlip[]
        ): string {
            const creaturesNotScanned = CreaturesHelper.subtractCreatures(creatures, creaturesScanned)
            let move = "WAIT"
            if (radarBlips.length) {
                const notScannedCreaturesByRadarBlips = radarBlips.filter(rb => creaturesNotScanned.map(cns => cns.id).includes(rb.creature.id))
                if (notScannedCreaturesByRadarBlips.length) {
                    const mostValuableCreatureNotScannedByRadarBlip = this.getMostValuableCreatureNotScannedByRadarBlip(notScannedCreaturesByRadarBlips, creaturesScanned)
                    const vectorDirection = mostValuableCreatureNotScannedByRadarBlip.convertDirectionToVector()
                    const direction = this.position.add(vectorDirection)
                    if (
                        direction.x !== this.position.x
                        || direction.y !== this.position.y
                    ) {
                        move = `MOVE ${Math.round(direction.x)} ${Math.round(direction.y)}`
                    }
                }
            }
            return move
        }

        getMostValuableCreatureNotScannedByRadarBlip(radarBlips: RadarBlip[], creaturesScanned: Creature[]): RadarBlip {
            const mostValuableCreatureNotScannedByRadarBlip = radarBlips.reduce((p,rb) => (rb.creature.getPoints() > p.creature.getPoints()) ? p : rb)
            return mostValuableCreatureNotScannedByRadarBlip
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
        
        convertDirectionToVector(): Vector {
            const vectorMap = {
                [Direction.TOP]: new Vector(0, -Config.RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE),
                [Direction.BOTTOM]: new Vector(0, Config.RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE),
                [Direction.LEFT]: new Vector(-Config.RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE, 0),
                [Direction.RIGHT]: new Vector(Config.RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE, 0),
                [Direction.TOP_LEFT]: new Vector(-Config.RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE_DIAGONAL, -Config.RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE_DIAGONAL),
                [Direction.TOP_RIGHT]: new Vector(Config.RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE_DIAGONAL, -Config.RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE_DIAGONAL),
                [Direction.BOTTOM_LEFT]: new Vector(-Config.RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE_DIAGONAL, Config.RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE_DIAGONAL),
                [Direction.BOTTOM_RIGHT]: new Vector(Config.RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE_DIAGONAL, Config.RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE_DIAGONAL)
            };
    
            return vectorMap[this.direction] || new Vector(0, 0);
        }
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
        static DEBUG_VARIABLES = false

        static DELTA_TIME_FACTOR = 100 // this is to guess the next position of the creature

        static HIGH_LIGHT_ACTIVATE_DISTANCE = 2000 // 2000 is the minimum default distance for scan with high light

        static RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE = 1000 // this will mean that Top = y+100 Right = x+100 and so on
        static RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE_DIAGONAL = Config.RADAR_BLIP_VECTOR_CONVERSOR_DISTANCE / Math.sqrt(2)

        static NUMBER_OF_CREATURES_SCANNED_BEFORE_SAVE = 2
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
                if (Config.DEBUG_VARIABLES) {
                    this.debugVariables()
                }
                
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
                drone.getNextMove(
                    this.creatures,
                    this.visibleCreatures,
                    this.playerCreatures,
                    this.AICreatures,
                    this.playerDroneScans.map(ds => ds.creature),
                    this.playerRadarBlips
                )
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
