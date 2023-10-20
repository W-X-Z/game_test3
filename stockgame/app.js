let config = {
    type: Phaser.AUTO,
    width: 400,
    height: 200,
    backgroundColor: '#333333',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const mergeMap = {
    '맥도날드': '코카콜라',
    '코카콜라': '삼성전자',
    '삼성전자': '테슬라',
    '테슬라': '메타',
    '메타': '엔비디아',
    '엔비디아': '아마존',
    '아마존': '구글',
    '구글': '마이크로소프트',
    '마이크로소프트': '애플',
    '애플': '나무'
};

const iconScores = {
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
};


let game = new Phaser.Game(config);
let currentIcon;
let activeIcon = null;
let icons;

function preload() {
    this.load.image('맥도날드', 'stockgame/01.png');
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

function handleMerge(icon1, icon2) {
    if (icon1.isDropping || icon2.isDropping) {
        return;
    }

    // Check if the two icons are of the same type
    if (icon1.texture.key === icon2.texture.key) {
        // Get the key for the next icon from the mergeMap
        let nextIconKey = mergeMap[icon1.texture.key];
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

        this.score += iconScores[nextIconKey];
        this.scoreText.setText('Score: ' + this.score); // Update the score display
    }
}

function create() {
    this.matter.world.setBounds(0, 0, this.game.config.width, this.game.config.height);
    icons = [];
    spawnIcon(this);
    this.input.on('pointerdown', (pointer) => {
        if (currentIcon) {
            currentIcon.x = pointer.x;
            currentIcon.setStatic(false);
            Phaser.Physics.Matter.Matter.Body.setVelocity(currentIcon.body, {x: 0, y: 20});
            currentIcon.isDropping = false;
            currentIcon = null;
            spawnIcon(this);
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

function spawnIcon(scene) {
    if (activeIcon !== null) {
        currentIcon = activeIcon;
    }
    let iconKeys = ['맥도날드','코카콜라','삼성전자','테슬라'];
    let randomIcon = Phaser.Math.RND.pick(iconKeys);
    currentIcon = scene.matter.add.image(270, 20, randomIcon);
    currentIcon.setScale(0.5, 0.5);
    let radius = (currentIcon.width * currentIcon.scaleX) / 2;
    currentIcon.setCircle(radius);
    currentIcon.setStatic(true);
    currentIcon.isDropping = true;
    icons.push(currentIcon);
    activeIcon = currentIcon;
}

function update() {
    for (let i = 0; i < icons.length; i++) {
        for (let j = i + 1; j < icons.length; j++) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(icons[i].getBounds(), icons[j].getBounds()) &&
                icons[i].texture.key === icons[j].texture.key &&
                !icons[i].isDropping && !icons[j].isDropping) {
                handleMerge.call(this, icons[i], icons[j]);
                break; // Break out of the inner loop if a merge is found to prevent handling the same pair multiple times in one frame
            }
        }
        // Check for defeat condition
        if (!icons[i].isDropping && icons[i].y <= 60) {
            endGame('defeat');
            return; // Exit the update function once a defeat is detected
        }
    }
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
