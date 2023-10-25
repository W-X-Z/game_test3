const CONSTANTS = {
    ORIGINAL_WIDTH: 540,
    ORIGINAL_HEIGHT: 160,
    CREATE_HEIGHT: 40,
    DEFEAT_HEIGHT: 120,
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
        '애플': '나무',
        '나무': '나무'
    },
    ICON_SCORES: {
        '코카콜라': 1,
        '삼성전자': 3,
        '테슬라': 6,
        '메타': 10,
        '엔비디아': 15,
        '아마존': 21,
        '구글': 28,
        '마이크로소프트': 36,
        '애플': 45,
        '나무': 55
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

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Game Logic
let game = new Phaser.Game(CONFIG);
let currentIcon;
let icons = [];
let GLOBAL_SCALE = Math.min(window.innerWidth / CONSTANTS.ORIGINAL_WIDTH, window.innerHeight / CONSTANTS.ORIGINAL_HEIGHT);

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
            let clampedX = clamp(pointer.x, currentIcon.radius, this.game.config.width - currentIcon.radius);
            currentIcon.x = clampedX;
        }
    });

    // Pointer Move Event (Drag)
    this.input.on('pointermove', (pointer) => {
        if (currentIcon && pointer.isDown) {
            let clampedX = clamp(pointer.x, currentIcon.radius, this.game.config.width - currentIcon.radius);
            currentIcon.x = clampedX;
        }
    });

    // Pointer Up Event
    this.input.on('pointerup', (pointer) => {
        if (currentIcon) {
            currentIcon.x = pointer.x; // Update the x-coordinate one last time to ensure accuracy
            currentIcon.setStatic(false);
            Phaser.Physics.Matter.Matter.Body.setVelocity(currentIcon.body, {x: 0, y: 20*GLOBAL_SCALE});
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
    this.scoreText = this.add.text(24, 24, this.score, { fontSize: 32 * GLOBAL_SCALE + 'px', fill: '#fff' });
}

function update() {
    console.log('DF_h:' + CONSTANTS.DEFEAT_HEIGHT, 'CR_h:' + CONSTANTS.CREATE_HEIGHT)
    for (let i = 0; i < icons.length; i++) {
        // Check for defeat condition
        if (!icons[i].isStatic && !icons[i].isDropping && icons[i].y <= CONSTANTS.DEFEAT_HEIGHT * GLOBAL_SCALE) {
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
            newIcon.setScale(0.5 * GLOBAL_SCALE, 0.5 * GLOBAL_SCALE);
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
        this.scoreText.setText(this.score); // Update the score display
    }
}

function spawnIcon(scene) {
    let randomIconKey = Phaser.Math.RND.pick(CONSTANTS.SPAWN_KEYS);
    currentIcon = createIcon(scene, randomIconKey);
    icons.push(currentIcon);
}

function createIcon(scene, iconKey) {
    let icon = scene.matter.add.image(computeGameDimension('width') / 2, CONSTANTS.CREATE_HEIGHT * GLOBAL_SCALE, iconKey);
    icon.setScale(0.5 * GLOBAL_SCALE, 0.5 * GLOBAL_SCALE);
    icon.setInteractive(); // Ensure the icon is interactive
    let radius = (icon.width * icon.scaleX) / 2;
    icon.setCircle(radius);
    icon.setStatic(true);
    icon.isDropping = false;
    icon.radius = radius;  // Store the radius in the icon object for easy access later
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
