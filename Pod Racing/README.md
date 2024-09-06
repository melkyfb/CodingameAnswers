# Pod Racing - Solution 1

This repository contains a solution for the "Pod Racing" challenge on [CodinGame](https://www.codingame.com/), implemented using TypeScript. The code makes use of the **Catmull-Rom Spline** algorithm to calculate smoother paths and improve the performance of the racing pod by finding more efficient routes between checkpoints.

## Repository Structure

- `solution1.py` – The main implementation for the "Pod Racing" challenge.
- `README.md` – This documentation file.
- `.gitignore` – Standard Git ignore file.

The code is designed to simulate the movement of a racing pod while considering factors such as:
- Checkpoint navigation.
- Speed and trust adjustments based on the angle and distance to the next checkpoint.
- Boost usage, with adaptive strategies for maximizing efficiency.

## Problem Overview

In the "Pod Racing" challenge, your goal is to control a pod and navigate it through checkpoints on a track as quickly as possible. The pod needs to follow an optimal path, adjusting its speed and trajectory based on checkpoint distance, angle, and other factors like opponent proximity. The game allows for one-time use of a **boost**, which can be critical for winning races.

### Objectives:
- Efficiently navigate the pod through all checkpoints on the track.
- Optimize speed and trust based on pod position, angle, and speed.
- Use boost strategically to gain an advantage over opponents.

## Solution Strategy

### Key Features:
1. **Catmull-Rom Spline Path Calculation**:
   - The code implements the **Catmull-Rom Spline** to calculate smooth paths between checkpoints. This helps the pod follow an optimal route instead of zigzagging between straight lines. 
   - The spline is calculated based on a lookahead point that provides a target for the pod to aim for in the immediate future, ensuring smoother turns and better control.

2. **Trust and Speed Management**:
   - The trust (or thrust) value is dynamically calculated based on the distance to the next checkpoint, the angle of approach, and the pod's current speed. The algorithm adjusts trust based on these factors to optimize performance.

3. **Boost Logic**:
   - A single-use **boost** can be deployed when the conditions are favorable (e.g., the pod is heading straight toward a far checkpoint with a low angle).
   - The boost logic is adaptive, considering both the pod's position relative to opponents and the overall race progress.

4. **Lap and Checkpoint Detection**:
   - The solution correctly tracks laps and checkpoints, ensuring that the pod progresses through the course in the correct order.

### Configuration:

- The solution uses several configurable constants in the `Config` class, including:
  - **Lookahead distance** for smoother pathfinding.
  - **Trust adjustments** based on angle and speed.
  - **Boost usage** strategy and conditions.

## File Descriptions

- **`solution1.py`**:
  The primary solution script that implements the logic for controlling the pod during the race. The key classes include:
    - `Pod`: Represents the pod and manages its position, speed, and thrust logic.
    - `CheckpointsManager`: Tracks checkpoints, laps, and pathfinding using the Catmull-Rom Spline.
    - `CatmullRomCalculator`: Implements the spline interpolation to smooth paths.
    - `Utils`: Helper functions for calculations like angle, distance, and smoothing values.
    - `DebugManager`: For logging debug messages when `Config.DEBUG` is enabled.

- **`Config`**:
  Contains configurable constants used to tweak the performance of the pod, such as thrust values, boost conditions, and pathfinding options.

## How to Run

1. **Clone the Repository**:
   First, clone this repository to your local machine:
   ```bash
   git clone https://github.com/melkyfb/CodingameAnswers.git
   cd CodingameAnswers/Pod\ Racing
   ```

2. **Run the Solution**:
   Since the game runs in the CodinGame environment, the script needs to be tested within the CodinGame IDE. Copy the contents of `solution1.py` into the editor for the "Pod Racing" challenge on CodinGame and run the simulation.

3. **Debugging**:
   If you'd like to enable debugging, set `Config.DEBUG` to `true` in the configuration section. This will output detailed logs during the simulation, which can help in tweaking the solution for better performance.

## Customization

- You can adjust the **Catmull-Rom Spline** behavior by changing the `LOOKAHEAD_DISTANCE` in the `Config` class.
- Modify the **boost usage strategy** by altering the logic in the `Utils.shouldUseBoost()` and `Utils.shouldUseAdaptiveBoost()` methods.
- Fine-tune the **trust and speed factors** by experimenting with `Config.DISTANCE_SPEED_MULTIPLIER`, `Config.MIN_TRUST`, and `Config.MAX_TRUST`.

## Future Improvements

- Add advanced opponent tracking to block them or optimize the path based on opponent behavior.
- Improve the spline smoothing algorithm for even better handling of sharp corners or complex tracks.
- Implement a learning-based approach to dynamically adjust strategies based on race conditions.

## Contributing

Contributions are welcome! If you find any issues or want to improve the performance of the solution, feel free to open a pull request or create an issue on GitHub.

## License

This project is licensed under the MIT License – see the [LICENSE](../LICENSE) file for details.