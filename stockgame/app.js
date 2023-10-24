const CONSTANTS = {
    ORIGINAL_WIDTH: 540,
    ORIGINAL_HEIGHT: 987,
    mergeMap: {
        '엔에이치': '코카콜라',
        '코카콜라': '삼성전자',
        '삼성전자': '테슬라',
        '테슬라': '메타',
        '메타': '엔비디아',
        '엔비디아': '아마존',
        '아마존': '구글',
        '구글': '마이크로소프트',
        '마이크로소프트': '애플',
        '애플': '나무'
    },
    ICON_SCORES: {
        '코카콜라': 2,
        '삼성전자': 3,
        '테슬라': 6,
        '메타': 8,
        '엔비디아': 10,
        '아마존': 13,
        '구글': 17,
        '마이크로소프트': 24,
        '애플': 27,
        '나무': 100
    },
    SPAWN_KEYS: ['엔에이치', '코카콜라', '삼성전자']
};

const CONFIG = {
    type: Phaser.AUTO,
    width: computeGameDimension('width'),
    height: computeGameDimension('height'),
    backgroundColor: '#333333',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false
        }
    },
    scene: {
        preload,
        create,
        update
    }
};

// Helper Functions
function computeGameDimension(dimensionType) {
    const scale = Math.min(window.innerWidth / CONSTANTS.ORIGINAL_WIDTH, window.innerHeight / CONSTANTS.ORIGINAL_HEIGHT);
    return CONSTANTS[dimensionType === 'width' ? 'ORIGINAL_WIDTH' : 'ORIGINAL_HEIGHT'] * scale;
}

// Game Logic
let game = new Phaser.Game(CONFIG);
let currentIcon;
let icons = [];

function preload() {
    this.load.image('엔에이치', 'stockgame/01.png');
    this.load.image('코카콜라', 'stockgame/02.png');
    this.load.image('삼성전자', 'stockgame/03.png');
    this.load.image('테슬라', 'stockgame/04.png');
    this.load.image('메타', 'stockgame/05.png');
    this.load.image('엔비디아', 'stockgame/06.png');
    this.load.image('아마존', 'stockgame/07.png');
    this.load.image('구글', 'stockgame/08.png');
    this.load.image('마이크로소프트', 'stockgame/09.png');
    this.load.image('애플', 'stockgame/10.png');
    this.load.image('나무', 'stockgame/11.png');
}

function create() {
    this.matter.world.setBounds(0, 0, this.game.config.width, this.game.config.height);
    icons = [];
    spawnIcon(this);
    this.input.on('pointerdown', (pointer) => {
        if (currentIcon) {
            currentIcon.x = pointer.x; // Set the x-coordinate of the icon to the pointer's x-coordinate
        }
    });

    // Pointer Move Event (Drag)
    this.input.on('pointermove', (pointer) => {
        if (currentIcon && pointer.isDown) { // Check if the pointer is currently pressed down
            currentIcon.x = pointer.x; // Update the icon's x-coordinate to follow the pointer
        }
    });

    // Pointer Up Event
    this.input.on('pointerup', (pointer) => {
        if (currentIcon) {
            currentIcon.x = pointer.x; // Update the x-coordinate one last time to ensure accuracy
            currentIcon.setStatic(false);
            Phaser.Physics.Matter.Matter.Body.setVelocity(currentIcon.body, {x: 0, y: 20});
            currentIcon.setAngularVelocity(0);
            currentIcon.isDropping = true; 
            currentIcon = null;
            this.time.delayedCall(1000, spawnIcon, [this], this);
        }
    });

    this.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
        let icon1 = bodyA.gameObject;
        let icon2 = bodyB.gameObject;
        if (icon1 && icon2 && icons.includes(icon1) && icons.includes(icon2) && icon1 !== icon2) {
            handleMerge.call(this, icon1, icon2);
        }
    });

    this.score = 0;
    this.scoreText = this.add.text(10, 10, 'Score: ' + this.score, { fontSize: '32px', fill: '#fff' });
}

function update() {
    for (let i = 0; i < icons.length; i++) {
        // Check for defeat condition
        if (!icons[i].isStatic && !icons[i].isDropping && icons[i].y <= 40) {
            endGame('defeat');
            return; // Exit the update function once a defeat is detected
        }
    }
}


function handleMerge(icon1, icon2) {

    // Check if the two icons are of the same type
    if (icon1.texture.key === icon2.texture.key) {
        // Get the key for the next icon from the mergeMap
        let nextIconKey = CONSTANTS.mergeMap[icon1.texture.key];
        if (nextIconKey) {
            let newIcon = this.matter.add.image((icon1.x + icon2.x) / 2, (icon1.y + icon2.y) / 2, nextIconKey, null, { restitution: 0.5, friction: 0.05 });
            newIcon.setScale(0.5, 0.5);
            let scaledRadius = (newIcon.width * newIcon.scaleX) / 2;
            newIcon.setCircle(scaledRadius);
            newIcon.setStatic(false); 
            icons.push(newIcon);
            
            // Check for the win condition
            if (nextIconKey === '나무') {
                setTimeout(() => {
                    endGame('win');
                }, 200);  // 2000 milliseconds = 2 seconds delay
            }
        }

        // Destroy the merged icons
        icon1.destroy();
        icon2.destroy();

        // Use the filter method to remove the merged icons from the icons array
        icons = icons.filter(icon => icon !== icon1 && icon !== icon2);

        this.score += CONSTANTS.ICON_SCORES[nextIconKey];
        this.scoreText.setText('Score: ' + this.score); // Update the score display
    }
}



function spawnIcon(scene) {
    let randomIconKey = Phaser.Math.RND.pick(CONSTANTS.SPAWN_KEYS);
    currentIcon = createIcon(scene, randomIconKey);
    icons.push(currentIcon);
}

function createIcon(scene, iconKey) {
    let icon = scene.matter.add.image(computeGameDimension('width') / 2, 20, iconKey);
    icon.setScale(0.5, 0.5);
    let radius = (icon.width * icon.scaleX) / 2;
    icon.setCircle(radius);
    icon.setStatic(true);
    icon.isDropping = false;
    return icon;
}

function endGame(result) {
    if(result === 'defeat') {
        // Logic for when the game ends in defeat
        alert('Game Over!'); // Replace with a more stylish game-over screen if desired
    } else if(result === 'win') {
        // Logic for when the game ends in victory
        alert('You Win!'); // Replace with a more stylish victory screen if desired
    }

    // You might want to restart the game or navigate to a different screen here
    // For now, let's just reload the game:
    location.reload();
}