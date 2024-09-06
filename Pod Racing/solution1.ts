class Position {
    x: number
    y: number

    public constructor(x: number,y: number) {
        this.x = x
        this.y = y
    }

    toString() {
        return `(${this.x},${this.y})`
    }
}

class Target {
    x: number
    y: number
    trust: number
    angle: number
    distance: number

    public constructor(x: number,y: number, trust: number, angle: number, distance: number) {
        this.x = x
        this.y = y
        this.trust = trust
        this.angle = angle
        this.distance = distance
    }

    toString() {
        return `(${this.x},${this.y}) Trust: (${this.trust}) Angle: (${this.angle}) Distance: (${this.distance})`
    }
}

class Pod {
    position: Position
    lastPosition: Position
    speed: number
    usedBoost: boolean = false
    igniting: boolean = true
    trust: number = 0
    lastTrust: number

    constructor(public checkpointsManager: CheckpointsManager) {}

    updatePosition(position: Position) {
        this.position = position

        if (!this.lastPosition) {
            this.lastPosition = position
        }

        this.speed = this.calculateSpeed()
        if (this.igniting && this.speed > Config.STOP_IGNITING_SPEED) {
            this.igniting = false
        }

        this.lastPosition = position
    }

    updateTrust(trust: number) {
        this.lastTrust = this.trust
        this.trust = trust
    }

    calculateSpeed(): number {
        return Math.max(Utils.calculateDistance(this.position, this.lastPosition), 1)
    }

    shouldUseBoost(angle: number, distance: number): boolean {
        return Utils.shouldUseBoost(angle, distance, this)
    }

    followPath() {
        const lookaheadPosition = this.checkpointsManager.getLookaheadPoint(this.position, Config.LOOKAHEAD_DISTANCE)
        
        const angleToLookahead = Utils.calculateAngle(this.position, lookaheadPosition)
        const distanceToLookahead = Utils.calculateDistance(this.position, lookaheadPosition)

        let trust: number = Utils.getTrust(angleToLookahead, distanceToLookahead, this.speed)
        this.updateTrust(trust)

        this.trust = Math.round(Utils.smoothTrust(this.trust, this.lastTrust, Config.TRUST_SMOOTHING_FACTOR))

        DebugManager.DebugMessage(`Follow Path Position: (${lookaheadPosition.toString()})`)
        DebugManager.DebugMessage(`Follow Path Trust: (${trust})`)
        DebugManager.DebugMessage(`Follow Path Angle: (${angleToLookahead})`)
        DebugManager.DebugMessage(`Follow Path Distance: (${distanceToLookahead})`)

        return new Target(lookaheadPosition.x,  lookaheadPosition.y, this.trust, angleToLookahead, distanceToLookahead)
    }

    debugState() {
        DebugManager.DebugMessage(`Pod Position: (${this.position.toString()})`)
        DebugManager.DebugMessage(`Current Speed: ${this.speed}`)
        DebugManager.DebugMessage(`Boost Used: ${this.usedBoost}`)
        DebugManager.DebugMessage(`Igniting: ${this.igniting}`)
    }
}

class DebugManager {
    static DebugMessage(message: string) {
        if (Config.DEBUG) {
            console.error(`DEBUG: ${message}`)
        }
    }
}

class CatmullRomCalculator {
    private cache = new Map<string, Position>();

    catmullRom(p0: Position, p1: Position, p2: Position, p3: Position, t: number): Position {
        const cacheKey = `${p0.x},${p0.y},${p1.x},${p1.y},${p2.x},${p2.y},${p3.x},${p3.y},${t}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const t2 = t * t;
        const t3 = t2 * t;

        const x = 0.5 * (
            (2 * p1.x) +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );

        const y = 0.5 * (
            (2 * p1.y) +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );

        const result = new Position(x, y);

        this.cache.set(cacheKey, result);

        DebugManager.DebugMessage(`Catmull-Rom Calculation Positions:`);
        DebugManager.DebugMessage(`p0: (${p0.toString()})`);
        DebugManager.DebugMessage(`p1: (${p1.toString()})`);
        DebugManager.DebugMessage(`p2: (${p2.toString()})`);
        DebugManager.DebugMessage(`p3: (${p3.toString()})`);
        DebugManager.DebugMessage(`t: (${t})`);
        DebugManager.DebugMessage(`result: (${x},${y})`);

        return result;
    }
}

class CheckpointsManager {
    checkpoints: Position[] = []
    smoothedPath: Position[] = []
    currentLap: number = 1
    lastCheckpoint: Position | null = null
    currentCheckpoint: Position | null = null
    currentCheckpointIndex: number | null = null

    constructor(public catmullCalculator: CatmullRomCalculator) {}

    addCheckpoint(position: Position) {
        this.checkpoints.push(position)
        this.updateSmoothedPath();
    }

    // Catmull-Rom Spline calculation
    updateSmoothedPath() {
        if (this.checkpoints.length < 4) {
            return // it needs at least 4 positions
        }

        this.smoothedPath = []
        for (let i = 1; i < this.checkpoints.length - 2; i++) {
            let p0 = this.checkpoints[i - 1]
            let p1 = this.checkpoints[i]
            let p2 = this.checkpoints[i + 1]
            let p3 = this.checkpoints[i + 2]

            for(let t = 0; t < 1; t += 0.1) {
                const smoothedPosition = this.catmullCalculator.catmullRom(p0, p1, p2, p3, t)
                this.smoothedPath.push(smoothedPosition)
            }
        }
    }

    getLookaheadPoint(currentPosition: Position, lookaheadDistance: number): Position {
        let closestIndex = 0
        let minDistance = Infinity

        for(const i in this.smoothedPath) {
            const distance = Utils.calculateDistance(currentPosition, this.smoothedPath[i])
            if (distance < minDistance) {
                minDistance = distance
                closestIndex = parseInt(i)
            }
        }

        // point of lookahead
        const lookaheadPosition = Math.min(closestIndex + lookaheadDistance, this.smoothedPath.length - 1)
        return this.smoothedPath[lookaheadPosition]
    }

    detectLap(nextCheckpoint: Position) {
        if (!this.lastCheckpoint) {
            this.lastCheckpoint = nextCheckpoint
            this.addCheckpoint(nextCheckpoint)
        }

        if (
            this.lastCheckpoint.x === nextCheckpoint.x
            && this.lastCheckpoint.y === nextCheckpoint.y
        ) {
            return
        }

        if (
            this.lastCheckpoint.x !== nextCheckpoint.x
            || this.lastCheckpoint.y !== nextCheckpoint.y
        ) {
            this.lastCheckpoint = nextCheckpoint
            this.currentCheckpointIndex = this.checkpoints.findIndex(c => c.x === nextCheckpoint.x && c.y === nextCheckpoint.y)

            if (this.currentCheckpointIndex === -1) {
                this.currentLap = 1
                this.addCheckpoint(nextCheckpoint)
                return
            }

            if (
                this.checkpoints[0].x === nextCheckpoint.x
                && this.checkpoints[0].y === nextCheckpoint.y
            ) {
                this.currentLap++
            }
        }
    }

    isLastCheckpointAtLastLap(): boolean {
        return this.currentLap === Config.LAST_LAP && this.currentCheckpointIndex === this.checkpoints.length - 1
    }

    debugState() {
        DebugManager.DebugMessage(`Lap: (${this.currentLap})`)
        DebugManager.DebugMessage(`Checkpoints: (${Object.entries(this.checkpoints).toString()})`)
        DebugManager.DebugMessage(`Last Checkpoint: (${this.lastCheckpoint?.toString()})`)
        DebugManager.DebugMessage(`Current Checkpoint Index: (${this.currentCheckpointIndex})`)
    }
}

class Utils {
    static clamp(number: number, min: number, max: number): number {
        return Math.max(min, Math.min(number, max))
    }

    static adjustTrustBasedOnAngle(trust: number, angle: number): number {
        const angleAbs = Math.abs(angle);
        const angleFactor = Utils.clamp((90 - angleAbs) / 90, 0, 1);
        trust = trust * angleFactor
        return trust;
    }

    static getTrust(angle: number, distance: number, speed: number): number {
        const proposedTrust = (distance / speed) * Config.DISTANCE_SPEED_MULTIPLIER
        let trust = Utils.clamp(proposedTrust, Config.MIN_TRUST, Config.MAX_TRUST)
        return Utils.adjustTrustBasedOnAngle(trust, angle)
    }
    
    static shouldUseAdaptiveBoost(
        pod: Pod,
        nextCheckpointAngle: number,
        nextCheckpointDist: number,
        opponentPosition: Position
    ): boolean {
        if (Config.USE_ADAPTATIVE_BOOST) {
            const opponentDistance = Utils.calculateDistance(pod.position, opponentPosition);
            const isOnLastLap = pod.checkpointsManager.currentLap === Config.LAST_LAP;
            
            // Determine if the pod is behind or ahead of the opponent
            const isBehindOpponent = opponentDistance > nextCheckpointDist;
            
            // Prioritize boosting if we're behind and the angle is favorable
            if (isBehindOpponent && Math.abs(nextCheckpointAngle) < 10 && !pod.usedBoost) {
                return true;  // Boost to catch up
            }
        
            // If we're ahead but on the last lap, use the boost to finish strong
            if (!isBehindOpponent && isOnLastLap && Math.abs(nextCheckpointAngle) < 10 && !pod.usedBoost) {
                return true;  // Boost to maintain lead and finish strong
            }
        }
    
        // Default boost decision-making based on straight path and sufficient speed
        return Utils.shouldUseBoost(nextCheckpointAngle, nextCheckpointDist, pod);
    }
    

    static shouldUseBoost(
        angle: number,
        distance: number,
        pod: Pod
    ): boolean {
        if (Math.abs(angle) < 10 && !pod.usedBoost) {
            if (Config.START_STRONG) {
                return pod.speed > Config.MIN_SPEED_USE_BOOST
            } else if (Config.FINISH_STRONG) {
                return pod.checkpointsManager.isLastCheckpointAtLastLap()
            }
            return distance > Config.MIN_DISTANCE_USE_BOOST
                && pod.speed > Config.MIN_SPEED_USE_BOOST
                && pod.checkpointsManager.currentLap === Config.LAP_TO_USE_BOOST
                || pod.checkpointsManager.isLastCheckpointAtLastLap()
        }
        return false
    }

    static calculateAngle(
        p1: Position,
        p2: Position
    ): number {
        const deltaX = p2.x - p1.x
        const deltaY = p2.y - p1.y
        const radians = Math.atan2(deltaY, deltaX)
        const degrees = radians * (180 / Math.PI)
        return degrees
    }

    static calculateDistance(
        p1: Position,
        p2: Position
    ): number {
        const deltaX = p2.x - p1.x
        const deltaY = p2.y - p1.y
        return Math.sqrt(deltaX ** 2 + deltaY ** 2)
    }

    static smoothTrust(currentTrust: number, previousTrust: number, smoothingFactor: number = 0.8): number {
        return currentTrust * (1 - smoothingFactor) + previousTrust * smoothingFactor;
    }
}

class Config {
    static DEBUG = true
    
    // path calc config
    static USE_CATMULL_ROM_SPLINE = true
    static LOOKAHEAD_DISTANCE = 10

    // trust config
    static DISTANCE_SPEED_MULTIPLIER = 35
    static MIN_TRUST = 30
    static MAX_TRUST = 100
    static TRUST_SMOOTHING_FACTOR = 0.8
    static STOP_IGNITING_SPEED = 300

    // opponent trust config
    static NEAR_HIT_OPPONENT_TRUST_REDUCE = 0.5
    static NEAR_HIT_OPPONENT_DISTANCE = 800

    // boost config
    static MIN_SPEED_USE_BOOST = 0
    static MIN_DISTANCE_USE_BOOST = 7000
    static FINISH_STRONG = false
    static START_STRONG = true
    static USE_ADAPTATIVE_BOOST = false
    static LAP_TO_USE_BOOST = 3
    static LAST_LAP = 3
}

function main() {
    const catmullCalculator = new CatmullRomCalculator()
    const checkpointsManager = new CheckpointsManager(catmullCalculator)
    const pod = new Pod(checkpointsManager)

    while (true) {
        let inputs = readline().split(' ')
        const x = parseInt(inputs[0])
        const y = parseInt(inputs[1])
        let nextCheckpointX = parseInt(inputs[2])
        let nextCheckpointY = parseInt(inputs[3])
        let nextCheckpointDist = parseInt(inputs[4])
        let nextCheckpointAngle = parseInt(inputs[5])
        inputs = readline().split(' ')
        const opponentX = parseInt(inputs[0])
        const opponentY = parseInt(inputs[1])

        const nextCheckpoint = new Position(nextCheckpointX, nextCheckpointY)
        checkpointsManager.detectLap(nextCheckpoint)

        const podPosition = new Position(x, y)
        const opponentPosition = new Position(opponentX, opponentY)
        pod.updatePosition(podPosition)

        let trust: number | string = 100
        if (checkpointsManager.currentLap == 1 || checkpointsManager.checkpoints.length < 4 || !Config.USE_CATMULL_ROM_SPLINE) {
            if (Config.DEBUG) DebugManager.DebugMessage(`Lap ${checkpointsManager.currentLap} and ${checkpointsManager.checkpoints.length} is not enough`)
            trust = Utils.getTrust(nextCheckpointAngle, nextCheckpointDist, pod.speed)
        } else {
            const pathData = pod.followPath()
            trust = pathData.trust
            nextCheckpointX = pathData.x
            nextCheckpointY = pathData.y
            // nextCheckpointAngle = pathData.angle
            // nextCheckpointDist = pathData.distance
        }
        
        pod.updateTrust(trust)

        if (Utils.shouldUseAdaptiveBoost(pod, nextCheckpointAngle, nextCheckpointDist, opponentPosition)) {
            trust = 'BOOST'
            pod.usedBoost = true
        }

        const opponentDistance = Utils.calculateDistance(podPosition, opponentPosition)
        if (
            opponentDistance < Config.NEAR_HIT_OPPONENT_DISTANCE
            && Math.abs(nextCheckpointAngle) < 10
            && trust !== 'BOOST'
        ) {
            trust = Utils.clamp(
                Number(trust) * Config.NEAR_HIT_OPPONENT_TRUST_REDUCE,
                Config.MIN_TRUST,
                Config.MAX_TRUST
            )
            nextCheckpointX += (nextCheckpointX - x) * 0.1
            nextCheckpointY += (nextCheckpointY - y) * 0.1
        }

        if (typeof trust === 'number') {
            trust = Math.round(Utils.smoothTrust(trust, pod.lastTrust, Config.TRUST_SMOOTHING_FACTOR))
        }

        if (
            (
                pod.igniting
                && !Config.START_STRONG
            ) || (
                checkpointsManager.isLastCheckpointAtLastLap()
                && trust !== 'BOOST'
                && Math.abs(nextCheckpointAngle) < 45
            )
        ) {
            trust = 100
        }

        nextCheckpointX = Math.round(nextCheckpointX)
        nextCheckpointY = Math.round(nextCheckpointY)

        // Debugging output
        pod.debugState()
        checkpointsManager.debugState()
    
        DebugManager.DebugMessage(`Angle to Checkpoint: ${nextCheckpointAngle}`)
        DebugManager.DebugMessage(`Distance to Checkpoint: ${nextCheckpointDist}`)
        DebugManager.DebugMessage(`Trust Value: ${trust}`)
        
        console.log(`${nextCheckpointX} ${nextCheckpointY} ${trust}`)
    }
}

main()
