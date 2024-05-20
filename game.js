// Define global variables for game state and positions
let gameState = "start"; // Initial state
let playerLives = 3;
let goblinsDefeated = 0;
let goblinPositions = [];
let goblinLives = 2;
let ogreLives = 5;
let advancement = 0; // Track player's advancement
let goblinIndex = 0;
let restart = 0;

const outputBox = document.getElementById("textbox");
const inputBox = document.getElementById("user-input");

document.getElementById("start-button").addEventListener("click", startGame);
inputBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        handleUserInput();
    }
});

function startGame() {
    genPositions();
    gameState = "narrative";
    outputBox.innerText = `(You are a guard in the village of Estarossa)`;
    outputBox.innerText += `\n"You need to defeat the ogre that has been threatening our village. He get's closer every day... Keep going forward and you'll find him." \n-Village Chief \n(press enter in input box to continue)`;
    updateHealth();
    const goblins = countGoblins();
}

function handleUserInput() {
    const input = inputBox.value.trim();
    inputBox.value = "";
    if (gameState === "narrative") {
        gameState = "movement";
        outputBox.innerText = "1. Move forward\n2. Move left\n3. Move right";
    } else if (gameState === "movement") {
        handleMovement(input);
    } else if (gameState === "goblinFight") {
        handleGoblinFight(input);
    } else if (gameState === "ogreFight") {
        handleOgreFight(input);
    } else if (gameState === "restart") {
        restartGame(input);
    }
}

function handleMovement(input) {
    if (input === "1") {
        advancement++;
	goblinIndex++;
        outputBox.innerText = "\nYou move forward.\n";
        if (advancement === 7) {
            outputBox.innerText = "\nYou encounter the ogre! Prepare to fight!";
            outputBox.innerText += `\n1. Attack \n2. Block\n`;
	    gameState = "ogreFight";
        } else {
	    setTimeout(() => {
            outputBox.innerText = "\n1. Move forward\n2. Move left\n3. Move right";
            }, 1000);
	}
    } else if (input === "2" || input === "3") {
        const direction = input === "2" ? "left" : "right";
	const goblinPosition = goblinPositions[goblinIndex];
        if (goblinPosition === direction) {
            outputBox.innerText = `\nYou encounter a goblin to the ${direction}!\nPrepare to fight!`;
            outputBox.innerText += `\n1. Attack \n2. Block\n`;
            gameState = "goblinFight";
        } else {
            outputBox.innerText = `\nYou move ${direction} and find nothing...\n1. Move forward\n2. Move left\n3. Move right`;
        }
    } else {
        outputBox.innerText = "\nInvalid choice. Please choose: \n1. Move forward, \n2. Move left, or \n3. Move right\n";
    }
}

let playerLife = playerLives;
function handleGoblinFight(input) {
    if (input === "1" || input === "2") {
        const goblinAction = Math.floor(Math.random() * 10);

        if ([0, 4, 8].includes(goblinAction)) {
            outputBox.innerText = "\nThe goblin attacks:";
        } else if ([1, 5, 9].includes(goblinAction)) {
            outputBox.innerText = "\nThe goblin blocks:";
        } else {
            outputBox.innerText = "\nThe goblin does nothing:";
        }

        if (input === "1") { // Player attacks
            if ([0, 4, 8].includes(goblinAction)) { // Goblin attacks
                goblinLives--;
                playerLife--;
                outputBox.innerText += "\nBoth you and the goblin lose a life";
                updateHealth();
                setTimeout(() => {
                    outputBox.innerText = `\n\n1. Attack \n2. Block`;
                    }, 1000);
            } else if ([1, 5, 9].includes(goblinAction)) { // Goblin blocks
                outputBox.innerText += "\nThe goblin blocked the attack";
		        updateHealth();
                setTimeout(() => {
                    outputBox.innerText = `\n\n1. Attack \n2. Block`;
                    }, 1000);
            } else { // Goblin does nothing
                goblinLives--;
                outputBox.innerText += "\nYou hit the goblin";
		        updateHealth();
                setTimeout(() => {
                    outputBox.innerText = `\n\n1. Attack \n2. Block`;
                    }, 1000);
            }
        } else if (input === "2") { // Player blocks
            if ([0, 4, 8].includes(goblinAction)) { // Goblin attacks
                outputBox.innerText += "\nYou blocked the goblin's attack";
		        updateHealth();
                setTimeout(() => {
                    outputBox.innerText = `\n\n1. Attack \n2. Block`;
                    }, 1000);
            } else {
                outputBox.innerText += "\nYou both blocked (or nothing happens)";
		    updateHealth();
                setTimeout(() => {
                    outputBox.innerText = `\n\n1. Attack \n2. Block`;
                    }, 1000);
          }
        }

        if (goblinLives <= 0) {
            goblinsDefeated++;
            setTimeout (() => {
            outputBox.innerText = "\n\nYou defeated the goblin!";
            if (Math.floor(Math.random() * 10) === 1) {
                playerLife++;
                outputBox.innerText += "\nYou found a health potion and gained a life!";
                updateHealth();
            }
            if ([0, 4, 8].includes(goblinAction)) {
                outputBox.innerText += "\n\nThe goblin attacked. You lose a life as well."
            }
        goblinLives = 2; // Reset goblin lives for the next encounter
        gameState = "movement";
	    setTimeout(() => {
            outputBox.innerText = "\n1. Move forward\n2. Move left\n3. Move right";
            }, 2500);
        }, 1100);
    }

        if (playerLife <= 0) {
            gameOver("dead");
        }
    }
}

function handleOgreFight(input) {
    if (input === "1" || input === "2") {
        const ogreAction = Math.floor(Math.random() * 10);

        if ([0, 2, 6, 8].includes(ogreAction)) {
            outputBox.innerText = "\nThe ogre attacks";
        } else if ([1, 3, 7].includes(ogreAction)) {
            outputBox.innerText = "\nThe ogre blocks";
        } else {
            outputBox.innerText = "\nThe ogre does nothing";
        }

        if (input === "1") { // Player attacks
            if ([0, 2, 6, 8].includes(ogreAction)) { // Ogre attacks
                ogreLives--;
                playerLife--;
                outputBox.innerText += "\nBoth you and the ogre lose a life";
		        updateHealth();
                setTimeout(() => {
                    outputBox.innerText = `1. Attack \n2. Block`;
                    }, 1000);
            } else if ([1, 3, 7].includes(ogreAction)) { // Ogre blocks
                outputBox.innerText += "\nThe ogre blocked the attack";
		        updateHealth();
                setTimeout(() => {
                    outputBox.innerText = `1. Attack \n2. Block`;
                    }, 1000);
            } else { // Ogre does nothing
                ogreLives--;
                outputBox.innerText += "\nYou hit the ogre";
		        updateHealth();
                setTimeout(() => {
                    outputBox.innerText = `1. Attack \n2. Block`;
                    }, 1000);
            }
        } else if (input === "2") { // Player blocks
            if ([0, 2, 6, 8].includes(ogreAction)) { // Ogre attacks
                outputBox.innerText += "\nYou blocked the ogre's attack";
		        updateHealth();
                setTimeout(() => {
                    outputBox.innerText = `1. Attack \n2. Block`;
                    }, 1000);
            } else {
                outputBox.innerText += "\nYou both blocked (or nothing happens)";
		        updateHealth();
                setTimeout(() => {
                    outputBox.innerText = `1. Attack \n2. Block`;
                    }, 1000);
            }
        }

        if (ogreLives <= 0) {
        const goblins = countGoblins();
        setTimeout(() => { 
	   if (goblinsDefeated === goblins) {
                gameOver("good");
            } else {
                gameOver("bad");
            }
	   }, 1050);
        }
        if (playerLife <= 0) {
	    setTimeout(() => {
            gameOver("dead");
	    }, 1050);
        }
    }
}

function gameOver(ending) {
    let quote = randomQuote();
    if (ending === "good") {
        outputBox.innerText = "You’ve defeated the ogre and protected your village!\n";
        outputBox.innerText += quote;
        outputBox.innerText += "\nWould you like to play again?\n1. Yes\n2. No";
	gameState = "restart";
    } else if (ending === "bad") {
        outputBox.innerText = "You’ve defeated the ogre! But you missed some goblins… They ran to the village and killed your family. All alone with nothing to protect… you kill yourself in despair.\n\n";
	    outputBox.innerText += quote;
	    outputBox.innerText += "\nWould you like to play again?\n1. Yes\n2. No";
    gameState = "restart";
    } else if (ending === "dead") {
	setTimeout(() => {
        outputBox.innerText = "You died.\n";
        outputBox.innerText += quote;
        outputBox.innerText += "\nWould you like to play again?\n1. Yes\n2. No";
        gameState = "restart";
	}, 1050);
    }
}

function restartGame(input) {
    if (input === "1") {
        gameState = "narrative";
        outputBox.innerText = `(You are a knight in the village of Estarossa)\n"You need to defeat the ogre that has be threatening our village. He get's closer every day... Keep going forward and you'll find him."\n-Village Chief\n(press enter in input box to continue)`;
        playerLife = 3;
        goblinPositions = [];
        goblinsDefeated = 0;
        goblinLives = 2;
        ogreLives = 5;
        genPositions();
        advancement = 0; // Reset advancement
	    goblinIndex = 0;
	    updateHealth();
	    const goblins = countGoblins();
        restart++;
        if (restart >= 5) {
            outputBox.innerText = `You either really like this game or really like killing goblins`;
        } else if (restart >= 10) {
            outputBox.innerText = `You're really determined to win lol. GL`;
        } else if (restart >= 20) {
            outputBox.innerText = `I think it's time to give up.`;
        } else if (restart >= 30) {
            outputBox.innerText = `Bro...`;
        }
    } else if (input === "2") {
        outputBox.innerText = "Thanks for playing!";
        gameState = "end";
    }
}

function updateHealth() {
    const livesInput = document.getElementById("lives");
    livesInput.value = playerLife;
}

function genPositions() {
	goblinPositions = [];
    for (let i = 0; i < 7; i++) {
        const randomNumber = Math.floor(Math.random() * 3);
        if (randomNumber === 0) {
            goblinPositions.push("right");
        } else if (randomNumber === 1) {
            goblinPositions.push("left");
        } else {
            goblinPositions.push("nothing");
        }
    }
}

function countGoblins() {
    let totalCount = 0;

    for (let position of goblinPositions) {
        if (position === "right" || position === "left") {
            totalCount++;
        }
    }

    return totalCount;
}

function randomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
}

const quotes = [
    `"Life is a game of chance. We may not always get what we want, but it's the possibility of failure and taking risks that make it fun."`,
    `"It's easy to take the quick route and go straight towards the goal, but where's the fun in that? Enjoy your surroundings and do the side quest for a change"`,
    `"What kind of life lesson did you learn from this game?"`,
    `"Doing extra work makes life harder and could kill you, but sometimes you get a sweeter reward."`,
    `"Made in China"`,
    `"/finding Real progress, estarossa Regains glory-They never yelled. Yet recently Everyone laughed."`,
    `"Fight with honor! Die with GLORY!"`,
    `"Tis but a scratch"`,
    `"Yay if you won, or rip if you died. idk which"`,
    `"And I ate... the ~Croissant"`,
    `"Let's go again! Let's go again!"`,
    `"Did you get all 3 victory endings?"`,
    `"A flying pig has hit the second hut."`,
    `"I wonder where I put my 7500 piece Millenium Falcon..."`,
    `"The universe is constantly expanding, but what is it expanding into? -Ferb"`,
    `"Knock knock" "Dad?" "What? No." -TAWOG`,
    `"Thanos is an angry grape with a rock collection."`,
    `(You meet your pen-pal girlfriend) "Uncle?"`,
    `"If you break your legs, just walk it off!"`,
    `"Yes, I would love you if you were a worm"`,
    `You should run "sudo rm -rf /" in linux (I'm legally not responisble for any consequences this may bring)`,
];

