/* -------------------------------------------------------------------------- */
/* 1. KONSTANTA & DATA                           */
/* -------------------------------------------------------------------------- */

const pathArea = document.getElementById("path-area");
const board = document.getElementById("board");
const ALL_PATHS = {};
const MAX_FAIL_TURNS = 6;

const PLAYER_COLORS = {
    red: "#e74c3c",
    green: "#2ecc71",
    blue: "#3498db",
    yellow: "#f1c40f",
};

const POLYGON_TRIANGLE = {
    left: "polygon(0% 0%, 50% 50%, 0% 100%)",
    top: "polygon(0% 0%, 100% 0%, 50% 50%)",
    right: "polygon(100% 0%, 100% 100%, 50% 50%)",
    bottom: "polygon(0% 100%, 50% 50%, 100% 100%)",
};

const CENTER_POSITION = {
    0: (offset) => ({ top: "50%", left: 15 + offset + "%" }),
    1: (offset) => ({ top: 15 + offset + "%", left: "50%" }),
    2: (offset) => ({ top: "50%", left: 85 - offset + "%" }),
    3: (offset) => ({ top: 85 - offset + "%", left: "50%" }),
};

const SAFE_ZONES = {
    star: [
        [9, 3],
        [3, 7],
        [7, 13],
        [13, 9],
    ],
    start: [
        [7, 2],
        [2, 9],
        [9, 14],
        [14, 7],
    ],
};

const MAIN_PATH = [
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
    [7, 6],
    [6, 7],
    [5, 7],
    [4, 7],
    [3, 7],
    [2, 7],
    [1, 7],
    [1, 8],
    [1, 9],
    [2, 9],
    [3, 9],
    [4, 9],
    [5, 9],
    [6, 9],
    [7, 10],
    [7, 11],
    [7, 12],
    [7, 13],
    [7, 14],
    [7, 15],
    [8, 15],
    [9, 15],
    [9, 14],
    [9, 13],
    [9, 12],
    [9, 11],
    [9, 10],
    [10, 9],
    [11, 9],
    [12, 9],
    [13, 9],
    [14, 9],
    [15, 9],
    [15, 8],
    [15, 7],
    [14, 7],
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 6],
    [9, 5],
    [9, 4],
    [9, 3],
    [9, 2],
    [9, 1],
    [8, 1],
    [7, 1],
];

const HOME_PATHS_DATA = {
    0: [
        [8, 2],
        [8, 3],
        [8, 4],
        [8, 5],
        [8, 6],
        [8, 7],
    ],
    1: [
        [2, 8],
        [3, 8],
        [4, 8],
        [5, 8],
        [6, 8],
        [7, 8],
    ],
    2: [
        [8, 14],
        [8, 13],
        [8, 12],
        [8, 11],
        [8, 10],
        [8, 9],
    ],
    3: [
        [14, 8],
        [13, 8],
        [12, 8],
        [11, 8],
        [10, 8],
        [9, 8],
    ],
};
const START_INDEX_DATA = {
    0: 0,
    1: 13,
    2: 26,
    3: 39,
};

const sounds = {
    roll: new Audio("assets/sounds/roll.mp3"),
    move: new Audio("assets/sounds/move.mp3"),
    capture: new Audio("assets/sounds/capture.mp3"),
    exitHome: new Audio("assets/sounds/exit-home.mp3"),
    finish: new Audio("assets/sounds/finish.mp3"),
    win: new Audio("assets/sounds/win.mp3"),
};

function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].volume = 1;
        sounds[soundName].play().catch(e => console.log("Audio play blocked by browser"));
    }
}

/* -------------------------------------------------------------------------- */
/* 2. STATE PERMAINAN                            */
/* -------------------------------------------------------------------------- */

let ALL_COLORS = [];
let players = ["red", "yellow"];
let currentPlayerIndex = 0;
let currentDiceValue = 0;
let isRolling = false;
let turnStep = "roll";
let winnersOrder = [];
let isAnimating = false;
let isAutoMoving = false;
let botPlayers = [];
let isVsComputerMode = false;
let consecutiveSixCount = 0;
let startTime;
let gameEnded = false;

let turnsWithoutExit = {
    red: 0,
    green: 0,
    blue: 0,
    yellow: 0,
};

let pionsPos = {
    red: [-1, -1, -1, -1],
    green: [-1, -1, -1, -1],
    blue: [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
};

/* -------------------------------------------------------------------------- */
/* 3. RENDERING (UI AWAL)                             */
/* -------------------------------------------------------------------------- */

function updateTurnVisuals() {
    const currentColor = players[currentPlayerIndex];

    document.querySelectorAll(".player-label").forEach((l) => {
        l.style.background = "rgba(0, 0, 0, 0.7)";
        l.style.transform = "translateX(-50%) scale(1)";
    });

    const activeHome = document.querySelector(`.home-square.${currentColor}`);
    if (activeHome) {
        const label = activeHome.querySelector(".player-label");
        if (label) {
            label.style.background = "#e67e22";
            label.style.transform = "translateX(-50%)";
        }
    }
}

function renderHomeBases() {
    board.querySelectorAll(".home-square").forEach((el) => el.remove());
    const activeColor = players[currentPlayerIndex];

    ALL_COLORS.forEach((color, index) => {
        const isPlaying = players.includes(color);

        const homeSquare = document.createElement("div");
        homeSquare.classList.add("home-square", color);

        if (isPlaying && color === activeColor) {
            homeSquare.classList.add("blink");
        }

        const positions = [
            { row: "1 / 7", col: "1 / 7" },
            { row: "1 / 7", col: "10 / 16" },
            { row: "10 / 16", col: "10 / 16" },
            { row: "10 / 16", col: "1 / 7" },
        ];

        homeSquare.style.gridRow = positions[index].row;
        homeSquare.style.gridColumn = positions[index].col;

        if (isPlaying && botPlayers.length === 0) {
            const playerNum = players.indexOf(color) + 1;
            const label = document.createElement("div");
            label.classList.add("player-label");
            label.innerText = `PLAYER ${playerNum}`;
            homeSquare.appendChild(label);
        }

        if (isPlaying && botPlayers.length > 0) {
            const botNum = botPlayers.indexOf(color) + 1;
            const label = document.createElement("div");
            label.classList.add("player-label");
            label.innerText = botPlayers.includes(color)
                ? `COMPUTER ${botNum}`
                : "YOU";
            homeSquare.appendChild(label);
        }

        const whiteBox = document.createElement("div");
        whiteBox.classList.add("home-white-box");
        whiteBox.id = `white-box-${color}`;

        const overlay = document.createElement("div");
        overlay.classList.add("home-overlay");
        overlay.id = `overlay-${color}`;
        whiteBox.appendChild(overlay);

        for (let i = 1; i <= 4; i++) {
            const spot = document.createElement("div");
            spot.classList.add("pion-spot", `${color}-spot`);

            if (isPlaying) {
                const pion = document.createElement("div");
                pion.classList.add("pion", `${color}-pion`);
                pion.id = `${color}-${i}`;
                pion.onclick = () => movePion(pion.id);

                spot.appendChild(pion);
            }

            whiteBox.appendChild(spot);
        }
        homeSquare.appendChild(whiteBox);
        board.appendChild(homeSquare);
    });
}

function renderCenterTriangles() {
    const centerSquare = document.getElementById("center-square");
    centerSquare.innerHTML = "";
    ALL_COLORS.forEach((color, index) => {
        const tri = document.createElement("div");
        tri.classList.add("triangle", `${color}-tri`);
        tri.style.clipPath =
            POLYGON_TRIANGLE[["left", "top", "right", "bottom"][index]];
        tri.style.backgroundColor = PLAYER_COLORS[color];
        centerSquare.appendChild(tri);
    });
}

function renderGridPath() {
    pathArea.innerHTML = "";
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            if (
                ((row >= 6 && row <= 8) || (col >= 6 && col <= 8)) &&
                !(row >= 6 && row <= 8 && col >= 6 && col <= 8)
            ) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.id = `cell-${row + 1}-${col + 1}`;
                cell.style.gridColumnStart = col + 1;
                cell.style.gridRowStart = row + 1;

                ALL_COLORS.forEach((color, index) => {
                    const colorCode = PLAYER_COLORS[color];

                    const isHomeStraight =
                        (index === 0 && row === 7 && col > 0 && col < 7) ||
                        (index === 1 && col === 7 && row > 0 && row < 7) ||
                        (index === 2 && row === 7 && col > 7 && col < 14) ||
                        (index === 3 && col === 7 && row > 7 && row < 14);

                    const isStartingBox =
                        (index === 0 && row === 6 && col === 1) ||
                        (index === 1 && row === 1 && col === 8) ||
                        (index === 2 && row === 8 && col === 13) ||
                        (index === 3 && row === 13 && col === 6);

                    if (isHomeStraight || isStartingBox) {
                        cell.style.backgroundColor = colorCode;
                    }
                });

                if (isStarZone(row, col)) {
                    const star = document.createElement("div");
                    star.classList.add("star");
                    cell.style.position = "relative";
                    cell.appendChild(star);
                }

                if (col === 0 && row >= 6 && row <= 8) {
                    cell.style.borderLeft = "2px solid #000";
                } else if (row === 0 && col >= 6 && col <= 8) {
                    cell.style.borderTop = "2px solid #000";
                } else if (col === 14 && row >= 6 && row <= 8) {
                    cell.style.borderRight = "2px solid #000";
                } else if (row === 14 && col >= 6 && col <= 8) {
                    cell.style.borderBottom = "2px solid #000";
                }

                pathArea.appendChild(cell);
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* 4. LOGIKA DADU                                */
/* -------------------------------------------------------------------------- */

function rollDice(isBotCall = false) {
    if (winnersOrder.length >= players.length - 1) return;
    const color = players[currentPlayerIndex];
    if (botPlayers.includes(color) && !isBotCall) return;
    if (isRolling || (turnStep !== "roll" && !isBotCall)) return;
    const diceElement = document.getElementById("dice");
    isRolling = true;
    playSound("roll");
    diceElement.classList.add("disabled");

    let rollInterval = setInterval(() => {
        const randomValue = Math.floor(Math.random() * 6) + 1;
        diceElement.setAttribute("data-dice", randomValue);
    }, 80);

    setTimeout(() => {
        clearInterval(rollInterval);

        const color = players[currentPlayerIndex];
        const path = ALL_PATHS[color];
        const otherPionsPos = pionsPos[color];

        function isDiceBlockedByStack(diceValue) {
            for (let i = 0; i < otherPionsPos.length; i++) {
                for (let j = 0; j < otherPionsPos.length; j++) {
                    if (i === j) continue;

                    const posA = otherPionsPos[i];
                    const posB = otherPionsPos[j];

                    if (posA === -1 || posB === -1) continue;

                    if (posA + diceValue === posB) {
                        const targetCoords = path[posB];

                        const isSafe = isStarZone(
                            targetCoords[0] - 1,
                            targetCoords[1] - 1,
                        );
                        const isHomePath = posB >= path.length - 6;

                        if (!isSafe && !isHomePath) {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        function canAnyPionMove(diceValue) {
            return otherPionsPos.some((pos, idx) => {
                const targetPos = pos + diceValue;

                if (targetPos > path.length - 1) return false;

                const targetCoords = path[targetPos];

                const isSafe = isStarZone(
                    targetCoords[0] - 1,
                    targetCoords[1] - 1,
                );
                const isHomePath = targetPos >= path.length - 6;
                const isStartingPoint = SAFE_ZONES.start.some(
                    ([row, col]) =>
                        row === targetCoords[0] && col === targetCoords[1],
                );

                if (isSafe || isHomePath || isStartingPoint) return true;

                const isOccupiedByFriend = otherPionsPos.some((pPos, pIdx) => {
                    return pIdx !== idx && pPos === targetPos;
                });

                return !isOccupiedByFriend;
            });
        }

        const validDice = [];

        for (let d = 1; d <= 6; d++) {
            if (d === 6 && consecutiveSixCount >= 2) continue;

            if (isDiceBlockedByStack(d)) continue;

            if (canAnyPionMove(d)) {
                validDice.push(d);
            }
        }

        const isAnyPionInHomePath = otherPionsPos.some((pos) => {
            return pos >= path.length - 6 && pos < path.length - 1;
        });
        const isAllSafeOrFinished = otherPionsPos.every((pos) => {
            return pos >= path.length - 6;
        });

        const hasPionInPlay = otherPionsPos.some(
            (pos) => pos >= 0 && pos < path.length - 1,
        );

        if (!hasPionInPlay) {
            turnsWithoutExit[color]++;
        } else {
            turnsWithoutExit[color] = 0;
        }

        let finalDiceValue;
        if (!hasPionInPlay && turnsWithoutExit[color] >= MAX_FAIL_TURNS) {
            finalDiceValue = 6;
            turnsWithoutExit[color] = 0;
        } else {
            if (validDice.length > 0 && !isAnyPionInHomePath) {
                finalDiceValue =
                    validDice[Math.floor(Math.random() * validDice.length)];
            } else {
                if (isAllSafeOrFinished) {
                    let finalRoll = Math.floor(Math.random() * 6) + 1;
                    if (finalRoll === 6 && consecutiveSixCount >= 2) {
                        finalRoll = Math.floor(Math.random() * 5) + 1;
                    }
                    finalDiceValue = finalRoll;
                } else {
                    finalDiceValue =
                        validDice[Math.floor(Math.random() * validDice.length)];
                }
            }
        }

        currentDiceValue = finalDiceValue;

        if (currentDiceValue === 6) {
            consecutiveSixCount++;
        } else {
            consecutiveSixCount = 0;
        }

        diceElement.setAttribute("data-dice", currentDiceValue);

        const movablePionIds = [];
        pionsPos[color].forEach((pos, idx) => {
            if (pos === -1) {
                if (currentDiceValue === 6) {
                    movablePionIds.push(`${color}-${idx + 1}`);
                }
            } else if (pos + currentDiceValue <= path.length - 1) {
                const targetPos = pos + currentDiceValue;
                const targetCoords = path[targetPos];
                const isSafe = isStarZone(
                    targetCoords[0] - 1,
                    targetCoords[1] - 1,
                );
                const isHomePath = targetPos >= path.length - 6;

                const isOccupiedByFriend = pionsPos[color].some(
                    (pPos, pIdx) => {
                        return pIdx !== idx && pPos === targetPos;
                    },
                );

                if (!isOccupiedByFriend || isSafe || isHomePath) {
                    movablePionIds.push(`${color}-${idx + 1}`);
                }
            }
        });

        if (movablePionIds.length === 0) {
            setTimeout(() => {
                diceElement.classList.remove("disabled");
                nextTurn();
            }, 500);
        } else {
            movablePionIds.forEach((id) => {
                document.getElementById(id).classList.add("can-move");
            });

            const activePionsOutside = movablePionIds.filter((id) => {
                const idx = parseInt(id.split("-")[1]) - 1;
                return pionsPos[color][idx] > -1;
            });
            const firstPionIdx = parseInt(movablePionIds[0].split("-")[1]) - 1;
            const isFirstPionOutside = pionsPos[color][firstPionIdx] > -1;

            const allInSamePos = movablePionIds.every((id) => {
                const idx = parseInt(id.split("-")[1]) - 1;
                return pionsPos[color][idx] === pionsPos[color][firstPionIdx];
            });

            if (
                (movablePionIds.length === 1 && isFirstPionOutside) ||
                (allInSamePos && isFirstPionOutside)
            ) {
                isAutoMoving = true;
                setTimeout(() => {
                    movePion(movablePionIds[0]);
                    isAutoMoving = false;
                }, 200);
            } else {
                turnStep = "move";
                if (botPlayers.includes(color) && turnStep === "move") {
                    setTimeout(() => {
                        let pionToMove = null;

                        if (currentDiceValue === 6) {
                            pionToMove = movablePionIds.find((id) => {
                                let idx = parseInt(id.split("-")[1] - 1);
                                return pionsPos[color][idx] === -1;
                            });
                        }

                        if (!pionToMove) {
                            const path = ALL_PATHS[color];
                            pionToMove = movablePionIds.find((id) => {
                                let idx = parseInt(id.split("-")[1] - 1);
                                let currentPos = pionsPos[color][idx];
                                return (
                                    currentPos + currentDiceValue ===
                                    path.length - 1
                                );
                            });
                        }

                        if (!pionToMove) {
                            pionToMove = movablePionIds.find((id) => {
                                let idx = parseInt(id.split("-")[1] - 1);
                                let currentPos = pionsPos[color][idx];

                                if (currentPos !== -1) {
                                    let targetPos =
                                        currentPos + currentDiceValue;
                                    let targetCoords =
                                        ALL_PATHS[color][targetPos];

                                    return simulateCheckCapture(
                                        id,
                                        targetCoords,
                                    );
                                }
                                return false;
                            });
                        }

                        if (!pionToMove) {
                            let safePions = movablePionIds.filter((id) => {
                                let idx = parseInt(id.split("-")[1]) - 1;
                                let targetPos =
                                    pionsPos[color][idx] + currentDiceValue;
                                if (pionsPos[color][idx] === -1) return false;
                                return isPositionSafe(
                                    ALL_PATHS[color][targetPos],
                                    color,
                                );
                            });

                            if (safePions.length > 0) {
                                let maxProgress = -1;
                                safePions.forEach((id) => {
                                    let idx = parseInt(id.split("-")[1]) - 1;
                                    if (pionsPos[color][idx] > maxProgress) {
                                        maxProgress = pionsPos[color][idx];
                                        pionToMove = id;
                                    }
                                });
                            }
                        }

                        if (!pionToMove) {
                            let maxProgress = -1;
                            movablePionIds.forEach((id) => {
                                let idx = parseInt(id.split("-")[1] - 1);
                                if (pionsPos[color][idx] > maxProgress) {
                                    maxProgress = pionsPos[color][idx];
                                    pionToMove = id;
                                }
                            });
                        }

                        if (!pionToMove) pionToMove = movablePionIds[0];

                        movePion(pionToMove);
                    }, 500);
                }
            }
        }
        isRolling = false;
    }, 1000);
}

function isPositionSafe(targetCoords, myColor) {
    const isStartingPoint = SAFE_ZONES.start.some(
        ([row, col]) => row === targetCoords[0] && col === targetCoords[1],
    );

    const isStar = isStarZone(targetCoords[0] - 1, targetCoords[1] - 1);

    if (isStar || isStartingPoint) return true;

    let isSafe = true;

    players.forEach((enemyColor) => {
        if (enemyColor === myColor) return;

        pionsPos[enemyColor].forEach((pos) => {
            if (pos === -1) return;

            const enemyPath = ALL_PATHS[enemyColor];
            const enemyCoords = enemyPath[pos];

            for (let dice = 1; dice <= 6; dice++) {
                const nextPos = pos + dice;
                if (nextPos < enemyPath.length) {
                    const futureEnemyCoords = enemyPath[nextPos];
                    if (
                        futureEnemyCoords[0] === targetCoords[0] &&
                        futureEnemyCoords[1] === targetCoords[1]
                    ) {
                        isSafe = false;
                    }
                }
            }
        });
    });

    return isSafe;
}

function simulateCheckCapture(movingPionId, targetCoords) {
    const [movingColor] = movingPionId.split("-");
    const isStar = isStarZone(targetCoords[0] - 1, targetCoords[1] - 1);
    const isStartingPoint = SAFE_ZONES.start.some(
        ([r, c]) => r === targetCoords[0] && c === targetCoords[1],
    );
    if (isStar || isStartingPoint) return false;

    let canCapture = false;
    players.forEach((color) => {
        if (color === movingColor) return;

        pionsPos[color].forEach((pos) => {
            if (pos === -1) return;
            const enemyCoords = ALL_PATHS[color][pos];
            if (
                enemyCoords[0] === targetCoords[0] &&
                enemyCoords[1] === targetCoords[1]
            ) {
                canCapture = true;
            }
        });
    });
    return canCapture;
}

/* -------------------------------------------------------------------------- */
/* 5. LOGIKA PION                                */
/* -------------------------------------------------------------------------- */

function checkCapture(movingPionId, targetCoords) {
    const [movingColor, movingId] = movingPionId.split("-");

    const isStar = isStarZone(targetCoords[0] - 1, targetCoords[1] - 1);
    const isStartingPoint = SAFE_ZONES.start.some(
        ([r, c]) => r === targetCoords[0] && c === targetCoords[1],
    );

    if (isStar || isStartingPoint) return false;

    let captured = false;

    players.forEach((color) => {
        if (color === movingColor) return;

        pionsPos[color].forEach((pos, index) => {
            if (pos === -1) return;

            const enemyPath = ALL_PATHS[color];
            const enemyCoords = enemyPath[pos];

            if (
                enemyCoords[0] === targetCoords[0] &&
                enemyCoords[1] === targetCoords[1]
            ) {
                pionsPos[color][index] = -1;
                const enemyPionId = `${color}-${index + 1}`;
                resetPionToHome(enemyPionId, color);
                playSound("capture");
                captured = true;
            }
        });
    });

    return captured;
}

function resetPionToHome(pionId, color) {
    const pion = document.getElementById(pionId);
    const whiteBox = document.getElementById(`white-box-${color}`);
    const spots = whiteBox.querySelectorAll(".pion-spot");

    const pionIndex = parseInt(pionId.split("-")[1]) - 1;
    spots[pionIndex].appendChild(pion);

    pion.style.position = "static";
    pion.style.width = "100%";
    pion.style.height = "100%";
}

function animateMove(pionId, color, pionIndex, steps) {
    isAnimating = true;
    let stepCount = 0;
    const interval = setInterval(() => {
        pionsPos[color][pionIndex]++;
        playSound("move");
        updatePionUI(pionId, color, pionsPos[color][pionIndex]);
        stepCount++;
        if (stepCount >= steps) {
            clearInterval(interval);

            const path = ALL_PATHS[color];
            const currentPos = pionsPos[color][pionIndex];
            const currentCoords = ALL_PATHS[color][currentPos];
            const targetCell = document.getElementById(
                `cell-${currentCoords[0]}-${currentCoords[1]}`,
            );

            const isCaptured = checkCapture(pionId, currentCoords);

            const isFinishedNow = currentPos === path.length - 1;

            if (isFinishedNow) {
                playSound("finish");
            }

            if (targetCell) {
                updatePionSizes(targetCell);
            }

            isAnimating = false;

            if (isCaptured || currentDiceValue === 6 || isFinishedNow) {
                if (!isPlayerFinished(color)) {
                    currentDiceValue = 0;
                    turnStep = "roll";
                    document
                        .getElementById("dice")
                        .classList.remove("disabled");
                    document
                        .querySelectorAll(".pion")
                        .forEach((p) => p.classList.remove("can-move"));

                    if (botPlayers.includes(color)) {
                        setTimeout(() => {
                            if (turnStep === "roll" && !isRolling) {
                                rollDice(true);
                            }
                        }, 500);
                    }
                } else {
                    afterAction(pionIndex);
                }
            } else {
                nextTurn();
            }

            setTimeout(() => {
                checkAndShowRank(color);
            }, 1);
        }
    }, 250);
}

function movePion(pionId) {
    const color = pionId.split("-")[0];
    if (color !== players[currentPlayerIndex]) return;
    if (turnStep !== "move" && !isAutoMoving) return;

    if (isAnimating) return;

    const pionIndex = parseInt(pionId.split("-")[1]) - 1;
    const path = ALL_PATHS[color];
    let currentPos = pionsPos[color][pionIndex];

    if (currentPos === -1 && currentDiceValue === 6) {
        isAnimating = true;
        playSound("exitHome");
        pionsPos[color][pionIndex] = 0;
        updatePionUI(pionId, color, 0);

        setTimeout(() => {
            isAnimating = false;
            afterAction(pionIndex);
        }, 100);
    } else if (
        currentPos !== -1 &&
        currentPos + currentDiceValue <= path.length - 1
    ) {
        animateMove(pionId, color, pionIndex, currentDiceValue);
    }
}

/* -------------------------------------------------------------------------- */
/* 6. UPDATE UI                                 */
/* -------------------------------------------------------------------------- */

function checkAndShowRank(color) {
    const overlay = document.getElementById(`overlay-${color}`);
    if (isPlayerFinished(color) && !winnersOrder.includes(color)) {
        playSound("win");
        winnersOrder.push(color);

        const rank = winnersOrder.length;
        overlay.style.display = "flex";

        overlay.innerText = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";

        const remainingPlayers = players.filter((p) => !isPlayerFinished(p));

        if (remainingPlayers.length === 1) {
            turnStep = "finished";
            const diceElement = document.getElementById("dice");
            diceElement.classList.add("disabled");
            diceElement.style.opacity = "0.5";
            setTimeout(() => {
                const loserColor = remainingPlayers[0];
                const loserOverlay = document.getElementById(
                    `overlay-${loserColor}`,
                );
                const diceElement = document.getElementById("dice");

                winnersOrder.push(loserColor);
                loserOverlay.style.display = "flex";
                loserOverlay.innerText = "LOSE";
                loserOverlay.style.color = "#e74c3c";
                loserOverlay.style.fontSize = "30px";

                diceElement.classList.add("disabled");
                document
                    .querySelector(`.home-square.blink`)
                    .classList.remove("blink");

                setTimeout(showFinalResult, 1000);
            }, 10);
        }
    }
}

function updatePionUI(pionId, color, pathIndex) {
    const pion = document.getElementById(pionId);
    const path = ALL_PATHS[color];
    const coords = path[pathIndex];
    const oldCell = pion.parentElement;

    if (pathIndex === path.length - 1) {
        const center = document.querySelector(".center-square");

        pion.style.transition = "none";

        center.appendChild(pion);
        pion.style.position = "absolute";
        pion.style.margin = "0";
        void pion.offsetWidth;
        updateCenterPionSizes(color);
        setTimeout(() => {
            checkAndShowRank(color);
        }, 50);
        if (oldCell && oldCell.classList.contains("cell"))
            updatePionSizes(oldCell);
        return;
    }

    if (coords) {
        const targetCell = document.getElementById(
            `cell-${coords[0]}-${coords[1]}`,
        );
        if (targetCell) {
            targetCell.appendChild(pion);
            pion.style.position = "static";
            pion.style.margin = "auto";
            updatePionSizes(targetCell);
            if (oldCell && oldCell.classList.contains("cell"))
                updatePionSizes(oldCell);
        }
    }
}

function updatePionSizes(cell) {
    const pions = cell.querySelectorAll(".pion");
    const count = pions.length;
    pions.forEach((p) => {
        p.style.zIndex = "10";
        if (count === 1) {
            p.style.width = "30px";
            p.style.height = "30px";
        } else {
            p.style.width = count <= 4 ? "15px" : "10px";
            p.style.height = count <= 4 ? "15px" : "10px";
        }
    });
}

function updateCenterPionSizes(color) {
    const center = document.querySelector(".center-square");
    const finishedPions = center.querySelectorAll(`.${color}-pion`);
    const staticColorIndex = ALL_COLORS.indexOf(color);

    finishedPions.forEach((p, index) => {
        p.style.zIndex = 10 + index;
        p.style.width = "22px";
        p.style.height = "22px";
        p.style.border = "2px solid #000";
        p.style.position = "absolute";

        let offset = index * 5;

        const posCalc = CENTER_POSITION[staticColorIndex](offset);

        p.style.top = posCalc.top;
        p.style.left = posCalc.left;
        p.style.transform = "translate(-50%, -50%)";
    });
}

function updateDiceUI() {
    const dice = document.getElementById("dice");
    const color = players[currentPlayerIndex];
    dice.style.backgroundColor = PLAYER_COLORS[color];
    if (botPlayers.includes(color)) {
        dice.style.cursor = "not-allowed";
        dice.style.opacity = "0.6";
    } else {
        dice.style.cursor = "pointer";
        dice.style.opacity = "1";
    }

    dice.classList.remove("disabled");
    updateTurnVisuals();
}

function syncPionsPos() {
    players.forEach((color) => {
        pionsPos[color].forEach((posIndex, i) => {
            const pionId = `${color}-${i + 1}`;
            const pion = document.getElementById(pionId);

            if (!pion) return;

            if (posIndex === -1) {
                resetPionToHome(pionId, color);
            } else {
                updatePionUI(pionId, color, posIndex);
            }
        });
    });
}

/* -------------------------------------------------------------------------- */
/* 7. ALUR TURN                                  */
/* -------------------------------------------------------------------------- */

function afterAction(pionIndex) {
    const color = players[currentPlayerIndex];
    const path = ALL_PATHS[color];

    setTimeout(() => {
        checkAndShowRank(color);
    }, 10);

    const isFinishedNow =
        pionIndex !== undefined &&
        pionsPos[color][pionIndex] === path.length - 1;

    if ((currentDiceValue === 6 || isFinishedNow) && !isPlayerFinished(color)) {
        currentDiceValue = 0;
        turnStep = "roll";
        document.getElementById("dice").classList.remove("disabled");
        document
            .querySelectorAll(".pion")
            .forEach((p) => p.classList.remove("can-move"));

        if (botPlayers.includes(color)) {
            setTimeout(() => {
                if (turnStep === "roll") {
                    rollDice(true);
                }
            }, 500);
        }
    } else {
        nextTurn();
    }
}

function nextTurn() {
    consecutiveSixCount = 0;
    let playersFinishedCount = 0;

    if (winnersOrder.length >= players.length - 1) {
        const diceElement = document.getElementById("dice");
        diceElement.classList.add("disabled");
        diceElement.style.opacity = "0.5";
        diceElement.style.cursor = "not-allowed";

        document
            .querySelectorAll(".home-square")
            .forEach((h) => h.classList.remove("blink"));
        setTimeout(showFinalResult, 1000);
        return;
    }

    const prevPlayerHome = document.querySelector(`.home-square.blink`);
    if (prevPlayerHome) {
        prevPlayerHome.classList.remove("blink");
    }
    document
        .querySelectorAll(".pion")
        .forEach((p) => p.classList.remove("can-move"));

    do {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        playersFinishedCount++;

        if (playersFinishedCount > players.length) {
            document.getElementById("dice").classList.add("disabled");
            return;
        }
    } while (
        isPlayerFinished(players[currentPlayerIndex]) &&
        playersFinishedCount <= players.length
    );

    const currentPlayerColor = players[currentPlayerIndex];
    const currentPlayerHomeBase = document.querySelector(
        `.home-square.${currentPlayerColor}`,
    );
    if (currentPlayerHomeBase) {
        currentPlayerHomeBase.classList.add("blink");
    }

    currentDiceValue = 0;
    turnStep = "roll";
    updateDiceUI();
    updateTurnVisuals();

    const nextColor = players[currentPlayerIndex];
    if (botPlayers.includes(nextColor)) {
        setTimeout(() => {
            if (turnStep === "roll" && !isRolling) {
                rollDice(true);
            }
        }, 500);
    }
}

/* -------------------------------------------------------------------------- */
/* 8. UTILITIES                                  */
/* -------------------------------------------------------------------------- */

function getPath(startIndex) {
    const path = [
        ...MAIN_PATH.slice(startIndex),
        ...MAIN_PATH.slice(0, startIndex),
    ];
    path.pop();
    return path;
}

function isPlayerFinished(color) {
    const pathLength = ALL_PATHS[color].length - 1;
    return pionsPos[color].every((pos) => pos === pathLength);
}

function isStarZone(row, col) {
    return SAFE_ZONES.star.some(([r, c]) => r === row + 1 && c === col + 1);
}

/* -------------------------------------------------------------------------- */
/* 9. INISIALISASI                               */
/* -------------------------------------------------------------------------- */

function initGame() {
    currentPlayerIndex = 0;

    players.forEach((color) => {
        const originalIndex = ALL_COLORS.indexOf(color);
        const mainPathSegment = getPath(START_INDEX_DATA[originalIndex]);
        ALL_PATHS[color] = [
            ...mainPathSegment,
            ...HOME_PATHS_DATA[originalIndex],
        ];
    });

    renderHomeBases();
    renderCenterTriangles();
    renderGridPath();
    syncPionsPos();

    players.forEach((color) => checkAndShowRank(color));

    updateDiceUI();

    startTime = new Date();
}

function showFinalResult() {
    if (gameEnded) return;
    gameEnded = true;

    const overlay = document.getElementById("result-overlay");
    const statsBody = document.getElementById("stats-body");
    const finishTimeDisplay = document.getElementById("finish-time");

    const endTime = new Date();
    const timeDiff = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(timeDiff / 60);
    const seconds = timeDiff % 60;
    finishTimeDisplay.innerText = `${minutes}m ${seconds}s`;

    statsBody.innerHTML = "";
    winnersOrder.forEach((color, index) => {
        const row = document.createElement("tr");
        const rankText =
            index === 0
                ? "🥇 1st"
                : index === 1
                  ? "🥈 2nd"
                  : index === 2
                    ? "🥉 3rd"
                    : "4th";
        const isLoser = index === players.length - 1;

        row.innerHTML = `
            <td style="color: #fff">${rankText}</td>
            <td style="color: ${PLAYER_COLORS[color]}">${color.toUpperCase()}</td>
            <td style="color: ${isLoser ? "#e74c3c" : "#2ecc71"}">${isLoser ? "LOSER" : "FINISHED"}</td>
        `;
        statsBody.appendChild(row);
    });

    overlay.style.display = "flex";
}

let selectedPlayers = [];

function vsPlayer() {
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("menu-select-player").style.display = "block";
    document.getElementById("menu-vs-bot").style.display = "none";
    showConfig("2p");
    document.getElementById("btn-2p").click();

    checkSelectionReady();
}

function vsComputer() {
    isVsComputerMode = true;
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("menu-select-player").style.display = "none";
    document.getElementById("menu-vs-bot").style.display = "block";

    botPlayers = [];
    document
        .querySelectorAll("#menu-vs-bot .color-btn")
        .forEach((btn) => btn.classList.remove("selected"));
    document.querySelector("#menu-vs-bot .play-btn").disabled = true;
}

document.querySelectorAll("#menu-vs-bot .button-area button").forEach((btn) => {
    btn.onclick = function () {
        document
            .querySelectorAll("#menu-vs-bot .button-area button")
            .forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        document.querySelector("#menu-vs-bot .player-config").style.display =
            "block";

        checkBotSelectionReady();
    };
});

document.querySelectorAll("#menu-vs-bot .color-btn").forEach((btn) => {
    btn.onclick = function () {
        document
            .querySelectorAll("#menu-vs-bot .color-btn")
            .forEach((b) => b.classList.remove("selected"));
        this.classList.add("selected");
        checkBotSelectionReady();
    };
});

function checkBotSelectionReady() {
    const hasColor = document.querySelector("#menu-vs-bot .color-btn.selected");
    const hasBotCount = document.querySelector(
        "#menu-vs-bot .button-area button.active",
    );
    document.querySelector("#menu-vs-bot .play-btn").disabled = !(
        hasColor && hasBotCount
    );
}

document.querySelector("#menu-vs-bot .play-btn").onclick = function () {
    const userColor = document.querySelector("#menu-vs-bot .color-btn.selected")
        .dataset.color;
    const botCount = parseInt(
        document.querySelector("#menu-vs-bot .button-area button.active").id,
    );

    const allAvailable = ["red", "green", "yellow", "blue"];

    let otherColors = allAvailable.filter((c) => c !== userColor);

    players = [userColor];
    botPlayers = [];

    for (let i = 0; i < botCount; i++) {
        players.push(otherColors[i]);
        botPlayers.push(otherColors[i]);
    }

    finalizeAllColors(players);

    document.getElementById("menu-vs-bot").style.display = "none";
    document.getElementById("game-container").style.display = "flex";
    initGame();
};

function goBack() {
    document.getElementById("main-menu").style.display = "block";
    document.getElementById("menu-select-player").style.display = "none";
    document.getElementById("menu-vs-bot").style.display = "none";
}

function showConfig(type) {
    document
        .querySelectorAll("#menu-select-player .player-config")
        .forEach((el) => (el.style.display = "none"));
    if (type === "2p")
        document.getElementById("menu-2player").style.display = "block";
    if (type === "3p")
        document.getElementById("menu-3player").style.display = "block";
    if (type === "4p")
        document.getElementById("menu-4player").style.display = "block";
}

document.getElementById("btn-2p").onclick = () => showConfig("2p");
document.getElementById("btn-3p").onclick = () => showConfig("3p");
document.getElementById("btn-4p").onclick = () => showConfig("4p");
document.querySelectorAll(".back").forEach((el) => {
    el.innerHTML = "<";
    el.onclick = goBack;
});

document.querySelectorAll(".color-btn").forEach((btn) => {
    btn.onclick = function () {
        if (this.parentElement.classList.contains("disabled")) return;

        this.parentElement
            .querySelectorAll(".color-btn")
            .forEach((b) => b.classList.remove("selected"));
        this.classList.add("selected");
    };
});

document.querySelector(".play-btn").onclick = function () {
    const activeConfig = document.querySelector(
        '.player-config[style*="display: block"]',
    );
    const selectedColors = [];

    const selectedButtons = activeConfig.querySelectorAll(
        ".color-btn.selected",
    );
    selectedButtons.forEach((btn) => selectedColors.push(btn.dataset.color));

    let required = 2;
    if (activeConfig.id === "menu-3player") required = 3;
    if (activeConfig.id === "menu-4player") required = 4;

    if (activeConfig.id === "menu-4player") {
        ALL_COLORS = ["green", "red", "yellow", "blue"];
        players = [...ALL_COLORS];
    } else {
        players = selectedColors;
        finalizeAllColors(selectedColors);
    }

    document.getElementById("menu-select-player").style.display = "none";
    document.getElementById("game-container").style.display = "flex";

    initGame();
};

function checkSelectionReady() {
    const menuVsBot = document.getElementById("menu-vs-bot");
    const menuVsPlayer = document.getElementById("menu-select-player");

    if (menuVsBot && menuVsBot.style.display === "block") {
        const playBtn = menuVsBot.querySelector(".play-btn");
        const selectedColor = menuVsBot.querySelector(".color-btn.selected");
        const selectedBotCount = menuVsBot.querySelector(
            ".button-area button.active",
        );

        if (selectedColor && selectedBotCount) {
            playBtn.disabled = false;
        } else {
            playBtn.disabled = true;
        }
        return;
    }

    if (menuVsPlayer && menuVsPlayer.style.display === "block") {
        const playBtn = menuVsPlayer.querySelector(".play-btn");
        const activeConfig = menuVsPlayer.querySelector(
            '.player-config[style*="display: block"]',
        );

        if (!activeConfig) return;

        let required =
            activeConfig.id === "menu-3player"
                ? 3
                : activeConfig.id === "menu-4player"
                  ? 4
                  : 2;

        const selectedCount = activeConfig.querySelectorAll(
            ".color-btn.selected",
        ).length;

        if (activeConfig.id === "menu-4player") {
            playBtn.disabled = false;
        } else {
            playBtn.disabled = selectedCount < required;
        }
    }
}

document.querySelectorAll(".button-area button").forEach((btn) => {
    btn.onclick = function () {
        document
            .querySelectorAll(".button-area button")
            .forEach((b) => b.classList.remove("active"));
        this.classList.add("active");

        const type = this.id.replace("btn-", "");
        showConfig(type);

        resetColorSelection();
        checkSelectionReady();
    };
});

function resetColorSelection() {
    document.querySelectorAll(".color-btn").forEach((btn) => {
        btn.classList.remove("selected", "disabled");
    });
}

document.querySelectorAll(".player-config .color-btn").forEach((btn) => {
    btn.onclick = function () {
        const isVsBot = this.closest("#menu-vs-bot");

        if (isVsBot) {
            isVsBot
                .querySelectorAll(".color-btn")
                .forEach((b) => b.classList.remove("selected"));
            this.classList.add("selected");
        } else {
            const parentRow = this.closest(".player-row");
            const configArea = this.closest(".player-config");

            parentRow
                .querySelectorAll(".color-btn")
                .forEach((b) => b.classList.remove("selected"));
            this.classList.add("selected");

            updateUnavailableColors(configArea);
        }

        checkSelectionReady();
    };
});

function updateUnavailableColors(configArea) {
    const currentlySelected = Array.from(
        configArea.querySelectorAll(".color-btn.selected"),
    ).map((btn) => btn.dataset.color);

    configArea.querySelectorAll(".color-btn").forEach((btn) => {
        const color = btn.dataset.color;
        const isThisButtonSelected = btn.classList.contains("selected");

        if (currentlySelected.includes(color) && !isThisButtonSelected) {
            btn.classList.add("disabled");
        } else {
            btn.classList.remove("disabled");
        }
    });
}

function finalizeAllColors(selectedColors) {
    const baseColors = ["green", "red", "yellow", "blue"];

    remainingColors = baseColors.filter((c) => !selectedColors.includes(c));

    remainingColors.sort(() => Math.random() - 0.5);

    let finalPath = [null, null, null, null];

    if (selectedColors.length === 2) {
        finalPath[3] = selectedColors[0];
        finalPath[1] = selectedColors[1];

        finalPath[0] = remainingColors[0];
        finalPath[2] = remainingColors[1];
    } else if (selectedColors.length === 3) {
        finalPath[0] = selectedColors[0];
        finalPath[1] = selectedColors[1];
        finalPath[2] = remainingColors[0];
        finalPath[3] = selectedColors[2];
    } else {
        finalPath = [...selectedColors];
    }

    ALL_COLORS = finalPath;
}

function openSettings() {
    document.getElementById("settings-modal").style.display = "flex";
}

function closeSettings() {
    document.getElementById("settings-modal").style.display = "none";
}

function setTheme(mode) {
    const body = document.body;
    const btnLight = document.getElementById("theme-light");
    const btnDark = document.getElementById("theme-dark");

    if (mode === "dark") {
        body.classList.remove("light-mode");
        body.classList.add("dark-mode");
        btnDark.classList.add("active");
        btnLight.classList.remove("active");
    } else {
        body.classList.remove("dark-mode");
        body.classList.add("light-mode");
        btnLight.classList.add("active");
        btnDark.classList.remove("active");
    }

    localStorage.setItem("ludo-theme", mode);
}

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("ludo-theme") || "dark";
    setTheme(savedTheme);
});
