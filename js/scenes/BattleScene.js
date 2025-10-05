class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });

        this.player1 = null;
        this.player2 = null;


        this.gameEnded = false;
        this.battleTimer = 30;
        this.battleTimerEvent = null;


        this.keys1 = null; // WASD + Spacebar
        this.keys2 = null; // Arrow keys + Shift

      
        this.healthBar1 = null;
        this.healthBar2 = null;
        this.timerText = null;

  
        this.arenaLeft = 100;
        this.arenaRight = null;
        this.groundY = null;


        this.attackCooldown1 = 0;
        this.attackCooldown2 = 0;
        this.dashCooldown1 = 0;
        this.dashCooldown2 = 0;

     
        this.weapons = [];
        this.weaponSpawnTimer = 0;
        this.weaponSpawnInterval = 5000; 


        this.bullets = [];


        this.lastKeyPress1 = { key: null, time: 0 };
        this.lastKeyPress2 = { key: null, time: 0 };
        this.doubleTapWindow = 300; 
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

      
        this.gameEnded = false;
        this.battleTimer = 30;
        this.battleTimerEvent = null;
        this.attackCooldown1 = 0;
        this.attackCooldown2 = 0;
        this.dashCooldown1 = 0;
        this.dashCooldown2 = 0;

    
        this.weapons.forEach(weapon => {
            if (weapon.sprite) weapon.sprite.destroy();
        });
        this.weapons = [];
        this.weaponSpawnTimer = 0;

       
        this.bullets.forEach(bullet => {
            if (bullet.sprite) bullet.sprite.destroy();
        });
        this.bullets = [];

        
        const currentMatch = this.getCurrentMatch();
        if (!currentMatch) {
            this.scene.start('TournamentBracketScene');
            return;
        }

  
        if (window.audioManager) {
            window.audioManager.stopMusic();
            window.audioManager.playMusic('battleMusic');
        }

        this.createRandomArena();

      
        this.createPlayer1(currentMatch.player1);
        this.createPlayer2(currentMatch.player2);

 
        this.createUI(currentMatch);


        this.setupInput();

   
        this.startCountdown();
    }


    createRandomArena() {
        
        const arenaTypes = ['default', 'ground_only', 'spike_arena', 'lava_arena'];
        const selectedArena = Phaser.Utils.Array.GetRandom(arenaTypes);


        this.arenaType = selectedArena;

        console.log(`Selected arena: ${selectedArena}`);

        switch (selectedArena) {
            case 'default':
                this.createDefaultArena();
                break;
            case 'ground_only':
                this.createGroundOnlyArena();
                break;
            case 'spike_arena':
                this.createSpikeArena();
                break;
            case 'lava_arena':
                this.createLavaArena();
                break;
            default:
                console.warn(`Unknown arena type: ${selectedArena}, defaulting to default arena`);
                this.arenaType = 'default';
                this.createDefaultArena();
                break;
        }
    }

    createDefaultArena() {
       
        this.arenaLeft = this.cameras.main.width * 0.1; // 10% from left
        this.arenaRight = this.cameras.main.width * 0.9; // 10% from right
        this.groundY = this.cameras.main.height * 0.75; // 75% down the screen

 
        this.createEpicMedievalBackground();



        
        const bannerGraphics = this.add.graphics();
        const titleY = 25;

  
        bannerGraphics.fillStyle(0x8B0000, 0.9);
        bannerGraphics.fillRoundedRect(this.cameras.main.centerX - 200, titleY - 15, 400, 50, 10);
        bannerGraphics.lineStyle(4, 0xFFD700);
        bannerGraphics.strokeRoundedRect(this.cameras.main.centerX - 200, titleY - 15, 400, 50, 10);


        bannerGraphics.fillStyle(0xFFD700);
        bannerGraphics.fillTriangle(
            this.cameras.main.centerX - 195, titleY - 10,
            this.cameras.main.centerX - 185, titleY - 10,
            this.cameras.main.centerX - 190, titleY - 5
        );
        bannerGraphics.fillTriangle(
            this.cameras.main.centerX + 185, titleY - 10,
            this.cameras.main.centerX + 195, titleY - 10,
            this.cameras.main.centerX + 190, titleY - 5
        );

        const title = this.add.text(this.cameras.main.centerX, titleY + 10, '⚔️ Exhile ⚔️', {
            fontSize: '28px',
            fill: '#FFD700',
            fontFamily: 'serif',
            fontStyle: 'bold',
            stroke: '#8B0000',
            strokeThickness: 4,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 8,
                fill: true
            }
        }).setOrigin(0.5);

        const subtitleBanner = this.add.graphics();
        subtitleBanner.fillStyle(0x8B0000, 0.7);
        subtitleBanner.fillRoundedRect(this.cameras.main.centerX - 150, titleY + 40, 300, 25, 5);
        subtitleBanner.lineStyle(2, 0xB8860B);
        subtitleBanner.strokeRoundedRect(this.cameras.main.centerX - 150, titleY + 40, 300, 25, 5);


        const subtitle = this.add.text(this.cameras.main.centerX, titleY + 52, 'MORITURI TE SALUTANT', {
            fontSize: '14px',
            fill: '#DAA520',
            fontFamily: 'serif',
            fontStyle: 'italic',
            stroke: '#4A0000',
            strokeThickness: 2
        }).setOrigin(0.5);


        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (!this.gameEnded) {
                    const particle = this.add.circle(
                        this.cameras.main.centerX + Phaser.Math.Between(-180, 180),
                        titleY + Phaser.Math.Between(-10, 60),
                        2,
                        0xFFD700,
                        0.8
                    );

                    this.tweens.add({
                        targets: particle,
                        y: particle.y - 30,
                        alpha: 0,
                        duration: 2000,
                        onComplete: () => particle.destroy()
                    });
                }
            },
            repeat: -1
        });
    }


    createPlayer1(playerData) {
        const stats = this.getPlayerStats(playerData.statChoice);

     
        let spawnX = 200;
        let spawnY = this.groundY - 25;


        if (this.platforms && this.platforms.length === 4) {
            // Lava arena detected (has 4 platforms)
            const leftmostPlatform = this.platforms[0];
            spawnX = leftmostPlatform.x + leftmostPlatform.width / 2;
            spawnY = leftmostPlatform.y - 25;
        }
       
        else if (this.actualGroundLeft !== undefined && this.actualGroundRight !== undefined) {

            spawnX = this.actualGroundLeft + (this.actualGroundRight - this.actualGroundLeft) * 0.25;
            spawnY = this.groundY - 25;
        }

        this.player1 = this.add.container(spawnX, spawnY);

       
        this.player1.parts = this.createWarriorParts('red');
        Object.values(this.player1.parts).forEach(part => this.player1.add(part));


        this.player1.body = {
            x: this.player1.x - 15,
            y: this.player1.y - 25,
            width: 30,
            height: 50,
            velocityX: 0,
            velocityY: 0,
            grounded: true,
            facingRight: true
        };

   
        this.player1.stats = stats;
        this.player1.health = stats.health;
        this.player1.playerData = playerData;
        this.player1.isAttacking = false;
        this.player1.isDashing = false;
        this.player1.isWalking = false;
        this.player1.walkFrame = 0;
        this.player1.weapon = null; // No weapon by default
        this.player1.knockbackTime = 0; // For knockback effects


        this.player1.abilityTriggered = false; 
        this.player1.abilityActive = false; 
        this.player1.abilityEffect = null; 
        this.player1.healingTimer = 0; 


        this.player1.sacrificeUsed = false; 
        this.player1.sacrificeAttacking = false; 

        this.player1.gambitUsed = false; 
        this.player1.buffActive = false; 
        this.player1.buffType = null;
        this.player1.buffTimer = 0;

        this.player1.attackHitbox = this.add.rectangle(0, 0, 60, 40, 0xff0000, 0);
    }

    createPlayer2(playerData) {
        const stats = this.getPlayerStats(playerData.statChoice);

        
        let spawnX = this.cameras.main.width - 200;
        let spawnY = this.groundY - 25;

        if (this.platforms && this.platforms.length === 4) {

            const rightmostPlatform = this.platforms[3]; 
            spawnX = rightmostPlatform.x + rightmostPlatform.width / 2;
            spawnY = rightmostPlatform.y - 25;
        }
      
        else if (this.actualGroundLeft !== undefined && this.actualGroundRight !== undefined) {

            spawnX = this.actualGroundLeft + (this.actualGroundRight - this.actualGroundLeft) * 0.75;
            spawnY = this.groundY - 25;
        }

      
        this.player2 = this.add.container(spawnX, spawnY);

       
        this.player2.parts = this.createWarriorParts('blue');
        Object.values(this.player2.parts).forEach(part => this.player2.add(part));


        this.player2.setScale(-1, 1);

      
        this.player2.body = {
            x: this.player2.x - 15,
            y: this.player2.y - 25,
            width: 30,
            height: 50,
            velocityX: 0,
            velocityY: 0,
            grounded: true,
            facingRight: false
        };


        this.player2.stats = stats;
        this.player2.health = stats.health;
        this.player2.playerData = playerData;
        this.player2.isAttacking = false;
        this.player2.isDashing = false;
        this.player2.isWalking = false;
        this.player2.walkFrame = 0;
        this.player2.weapon = null; 
        this.player2.knockbackTime = 0; 

        this.player2.abilityTriggered = false; 
        this.player2.abilityActive = false; 
        this.player2.abilityEffect = null; 
        this.player2.healingTimer = 0; 

        this.player2.sacrificeUsed = false; 
        this.player2.sacrificeAttacking = false; 

        this.player2.gambitUsed = false; 
        this.player2.buffActive = false; 
        this.player2.buffType = null;
        this.player2.buffTimer = 0; 

  
        this.player2.attackHitbox = this.add.rectangle(0, 0, 60, 40, 0xff0000, 0);
    }

    getPlayerStats(statChoice) {
        switch(statChoice) {
            case 'damage': // PATH OF FURY
                return { health: 80, damage: 25, speed: 200 };
            case 'health': // PATH OF ENDURANCE
                return { health: 120, damage: 15, speed: 200 };
            default:
                return { health: 80, damage: 25, speed: 200 }; 
        }
    }

    createUI(currentMatch) {
        const topY = 80;

        this.add.text(150, topY - 30, currentMatch.player1.name, {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(this.cameras.main.width - 150, topY - 30, currentMatch.player2.name, {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);


        this.add.rectangle(150, topY, 200, 20, 0x2c3e50).setStrokeStyle(2, 0x34495e);
        this.add.rectangle(this.cameras.main.width - 150, topY, 200, 20, 0x2c3e50).setStrokeStyle(2, 0x34495e);


        this.healthBar1 = this.add.rectangle(150, topY, 196, 16, 0xe74c3c);
        this.healthBar2 = this.add.rectangle(this.cameras.main.width - 150, topY, 196, 16, 0x3498db);


        this.timerText = this.add.text(this.cameras.main.centerX, topY + 70, '30', {
            fontSize: '36px',
            fill: '#f39c12',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        
        const controlsBg = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.height - 22,
            1260,
            40,
            0x000000,
            0.75
        );

        this.add.text(this.cameras.main.centerX, this.cameras.main.height - 22,
            'P1: WASD+SPACE | E=Sacrifice Q=Gambit    P2: ARROWS+SHIFT | ENTER=Sacrifice CTRL=Gambit    [Dash: Double-tap A/D or ←/→]', {
            fontSize: '12px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    setupInput() {
        
        this.keys1 = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            sacrifice: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            gambit: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)
        };

        
        this.keys2 = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            sacrifice: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
            gambit: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL)
        };
    }

    startCountdown() {
        this.gameEnded = true; 
        let count = 3;
        const countdownText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, '3', {
            fontSize: '72px',
            fill: '#e74c3c',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                if (count > 0) {
                    countdownText.setText(count.toString());
                } else if (count === 0) {
                    countdownText.setText('FIGHT!').setFill('#27ae60');
                } else {
                    countdownText.destroy();
                    this.gameEnded = false; // Allow movement
                    this.startBattleTimer();
                }
            },
            repeat: 3
        });
    }

    startBattleTimer() {
        this.battleTimerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.battleTimer--;
                this.timerText.setText(this.battleTimer.toString());

                if (this.battleTimer <= 0) {
                    
                    this.startSuddenDeath();
                }
            },
            repeat: 29
        });
    }

    createWarriorParts(color) {
        const parts = {};

        const colors = {
            blue: { main: 0x3498db, dark: 0x2980b9, accent: 0x2c3e50 },
            red: { main: 0xe74c3c, dark: 0xc0392b, accent: 0x8b4513 }
        };

        const scheme = colors[color];

    
        parts.head = this.add.circle(0, -20, 8, 0xf4d1ae);

    
        parts.helmet = this.add.graphics();
        parts.helmet.fillStyle(scheme.accent);
        parts.helmet.fillEllipse(0, -20, 18, 16);
        parts.helmet.lineStyle(2, scheme.dark);
        parts.helmet.strokeEllipse(0, -20, 18, 16);

        parts.body = this.add.graphics();
        parts.body.fillStyle(scheme.main);
        parts.body.fillRect(-8, -10, 16, 20);
        parts.body.lineStyle(2, scheme.dark);
        parts.body.strokeRect(-8, -10, 16, 20);

        parts.leftArm = this.add.graphics();
        parts.leftArm.fillStyle(scheme.main);
        parts.leftArm.fillEllipse(-12, -5, 6, 15);
        parts.leftArm.lineStyle(1, scheme.dark);
        parts.leftArm.strokeEllipse(-12, -5, 6, 15);

        parts.rightArm = this.add.graphics();
        parts.rightArm.fillStyle(scheme.main);
        parts.rightArm.fillEllipse(12, -5, 6, 15);
        parts.rightArm.lineStyle(1, scheme.dark);
        parts.rightArm.strokeEllipse(12, -5, 6, 15);

        parts.leftLeg = this.add.graphics();
        parts.leftLeg.fillStyle(scheme.accent);
        parts.leftLeg.fillEllipse(-5, 15, 6, 15);
        parts.leftLeg.lineStyle(1, scheme.dark);
        parts.leftLeg.strokeEllipse(-5, 15, 6, 15);

        parts.rightLeg = this.add.graphics();
        parts.rightLeg.fillStyle(scheme.accent);
        parts.rightLeg.fillEllipse(5, 15, 6, 15);
        parts.rightLeg.lineStyle(1, scheme.dark);
        parts.rightLeg.strokeEllipse(5, 15, 6, 15);

        return parts;
    }

    checkPlayerCollision(player1, player2) {
      
        if (!player1 || !player2 || !player1.body || !player2.body) {
            return false;
        }

        const p1Left = player1.body.x;
        const p1Right = player1.body.x + player1.body.width;
        const p2Left = player2.body.x;
        const p2Right = player2.body.x + player2.body.width;

      
        return !(p1Right <= p2Left || p1Left >= p2Right);
    }

    getCurrentMatch() {
        const tournamentData = this.registry.get('tournamentData');
        const currentRound = tournamentData.bracket[tournamentData.currentRound - 1];
        return currentRound ? currentRound.matches[tournamentData.currentMatch] : null;
    }

    update(time, delta) {
        if (this.gameEnded) return;

       
        this.attackCooldown1 = Math.max(0, this.attackCooldown1 - delta);
        this.attackCooldown2 = Math.max(0, this.attackCooldown2 - delta);
        this.dashCooldown1 = Math.max(0, this.dashCooldown1 - delta);
        this.dashCooldown2 = Math.max(0, this.dashCooldown2 - delta);

     
        this.player1.knockbackTime = Math.max(0, this.player1.knockbackTime - delta);
        this.player2.knockbackTime = Math.max(0, this.player2.knockbackTime - delta);


        this.updateWeaponSpawning(delta);

        this.updateBullets(delta);

        this.updatePassiveAbilities(delta);

        this.updateBuffTimers(delta);

t
        this.handlePlayer1Input(delta);
        this.handlePlayer2Input(delta);


        this.updatePlayerPhysics(this.player1, delta);
        this.updatePlayerPhysics(this.player2, delta);

        this.updateAttackHitboxes();


        this.updatePlayerAnimations(this.player1, delta);
        this.updatePlayerAnimations(this.player2, delta);

        this.checkAttacks();


        this.checkWeaponPickups();
    }

    handlePlayer1Input(delta) {
        const player = this.player1;
        const keys = this.keys1;
        const speed = player.stats.speed + (player.buffSpeedBonus || 0);


        let intendedVelocityX = 0;

    
        const currentTime = Date.now();
        if (Phaser.Input.Keyboard.JustDown(keys.left)) {
            if (this.lastKeyPress1.key === 'left' &&
                currentTime - this.lastKeyPress1.time < this.doubleTapWindow &&
                this.dashCooldown1 <= 0) {
                this.performDash(player, 1, 'left');
                this.dashCooldown1 = 1000;
            }
            this.lastKeyPress1 = { key: 'left', time: currentTime };
        }

        if (Phaser.Input.Keyboard.JustDown(keys.right)) {
            if (this.lastKeyPress1.key === 'right' &&
                currentTime - this.lastKeyPress1.time < this.doubleTapWindow &&
                this.dashCooldown1 <= 0) {
                this.performDash(player, 1, 'right');
                this.dashCooldown1 = 1000;
            }
            this.lastKeyPress1 = { key: 'right', time: currentTime };
        }

        if (keys.left.isDown) {
            intendedVelocityX = -speed;
            if (player.body.facingRight) {
                player.body.facingRight = false;
                this.flipPlayer(player, false);
            }
            player.isWalking = true;
        } else if (keys.right.isDown) {
            intendedVelocityX = speed;
            if (!player.body.facingRight) {
                player.body.facingRight = true;
                this.flipPlayer(player, true);
            }
            player.isWalking = true;
        } else {
            intendedVelocityX = 0;
            player.isWalking = false;
        }

        const otherPlayer = this.player2;
        const tempX = player.body.x + intendedVelocityX * (1/60);

        const tempBody = {
            x: tempX,
            y: player.body.y,
            width: player.body.width,
            height: player.body.height
        };


        if (!this.checkPlayerCollision(tempBody, otherPlayer.body)) {
            if (player.knockbackTime <= 0) {
                player.body.velocityX = intendedVelocityX;
            }
        } else {
            if (player.knockbackTime <= 0) {
                player.body.velocityX = 0;
            }
            player.isWalking = false;
        }

        if (intendedVelocityX === 0 && player.knockbackTime <= 0) {
            player.body.velocityX *= 0.8;
        }


        if (Phaser.Input.Keyboard.JustDown(keys.up) && player.body.grounded) {
            player.body.velocityY = -550; 
            player.body.grounded = false;
        }


        if (keys.down.isDown && !player.body.grounded && player.body.velocityY > 0) {
            player.body.velocityY += 600 * (1/60);
        }

       
        if (Phaser.Input.Keyboard.JustDown(keys.down) && player.body.grounded && player.body.y + player.body.height < this.groundY - 10) {
            player.body.grounded = false;
            player.body.velocityY = 100; 
        }


        if (Phaser.Input.Keyboard.JustDown(keys.attack) && this.attackCooldown1 <= 0) {
            this.performAttack(player, 1);
            this.attackCooldown1 = 500; 
        }

        if (Phaser.Input.Keyboard.JustDown(keys.sacrifice) && !player.sacrificeUsed && player.health > 30) {
            this.performSacrificeAttack(player, 1);
        }

     
        if (Phaser.Input.Keyboard.JustDown(keys.gambit) && !player.gambitUsed) {
            this.performBloodGambit(player);
        }
    }

    handlePlayer2Input(delta) {
        const player = this.player2;
        const keys = this.keys2;
        const speed = player.stats.speed + (player.buffSpeedBonus || 0);

        let intendedVelocityX = 0;

        const currentTime = Date.now();
        if (Phaser.Input.Keyboard.JustDown(keys.left)) {
            if (this.lastKeyPress2.key === 'left' &&
                currentTime - this.lastKeyPress2.time < this.doubleTapWindow &&
                this.dashCooldown2 <= 0) {
                this.performDash(player, 2, 'left');
                this.dashCooldown2 = 1000;
            }
            this.lastKeyPress2 = { key: 'left', time: currentTime };
        }

        if (Phaser.Input.Keyboard.JustDown(keys.right)) {
            if (this.lastKeyPress2.key === 'right' &&
                currentTime - this.lastKeyPress2.time < this.doubleTapWindow &&
                this.dashCooldown2 <= 0) {
                this.performDash(player, 2, 'right');
                this.dashCooldown2 = 1000;
            }
            this.lastKeyPress2 = { key: 'right', time: currentTime };
        }

        if (keys.left.isDown) {
            intendedVelocityX = -speed; 
            if (player.body.facingRight) {
                player.body.facingRight = false;
                this.flipPlayer(player, false);
            }
            player.isWalking = true;
        } else if (keys.right.isDown) {
            intendedVelocityX = speed;
            if (!player.body.facingRight) {
                player.body.facingRight = true;
                this.flipPlayer(player, true);
            }
            player.isWalking = true;
        } else {
            intendedVelocityX = 0;
            player.isWalking = false;
        }

        const otherPlayer = this.player1;
        const tempX = player.body.x + intendedVelocityX * (1/60);

        const tempBody = {
            x: tempX,
            y: player.body.y,
            width: player.body.width,
            height: player.body.height
        };

        if (!this.checkPlayerCollision(tempBody, otherPlayer.body)) {
            if (player.knockbackTime <= 0) {
                player.body.velocityX = intendedVelocityX;
            }
        } else {
            if (player.knockbackTime <= 0) {
                player.body.velocityX = 0;
            }
            player.isWalking = false;
        }

        if (intendedVelocityX === 0 && player.knockbackTime <= 0) {
            player.body.velocityX *= 0.8;
        }

        if (Phaser.Input.Keyboard.JustDown(keys.up) && player.body.grounded) {
            player.body.velocityY = -550; 
            player.body.grounded = false;
        }

        
        if (keys.down.isDown && !player.body.grounded && player.body.velocityY > 0) {
            player.body.velocityY += 600 * (1/60); 
        }


        if (Phaser.Input.Keyboard.JustDown(keys.down) && player.body.grounded && player.body.y + player.body.height < this.groundY - 10) {
            player.body.grounded = false;
            player.body.velocityY = 100; 
        }

        if (Phaser.Input.Keyboard.JustDown(keys.attack) && this.attackCooldown2 <= 0) {
            this.performAttack(player, 2);
            this.attackCooldown2 = 500; 
        }


        if (Phaser.Input.Keyboard.JustDown(keys.sacrifice) && !player.sacrificeUsed && player.health > 30) {
            this.performSacrificeAttack(player, 2);
        }

        if (Phaser.Input.Keyboard.JustDown(keys.gambit) && !player.gambitUsed) {
            this.performBloodGambit(player);
        }
    }

    updatePlayerPhysics(player, delta) {
        const deltaSeconds = delta / 1000;


        if (!player.body.grounded) {
            player.body.velocityY += 800 * deltaSeconds; 
       
            player.body.velocityY = Math.min(player.body.velocityY, 1500);
        }

   
        player.body.x += player.body.velocityX * deltaSeconds;
        player.body.y += player.body.velocityY * deltaSeconds;

 
        if (player.body.x < this.arenaLeft) {
            player.body.x = this.arenaLeft;
            player.body.velocityX = 0;
        } else if (player.body.x + player.body.width > this.arenaRight) {
            player.body.x = this.arenaRight - player.body.width;
            player.body.velocityX = 0;
        }


        let onPlatform = false;
        if (this.platforms) {
            for (const platform of this.platforms) {
                const playerLeft = player.body.x;
                const playerRight = player.body.x + player.body.width;
                const playerTop = player.body.y;
                const playerBottom = player.body.y + player.body.height;

                const platformLeft = platform.x;
                const platformRight = platform.x + platform.width;
                const platformTop = platform.y;
                const platformBottom = platform.y + platform.height;

                if (playerRight > platformLeft && playerLeft < platformRight) {

                    if (player.body.velocityY > 0 &&
                        playerBottom >= platformTop &&
                        playerTop < platformTop) {

                        player.body.y = platformTop - player.body.height;
                        player.body.velocityY = 0;
                        player.body.grounded = true;
                        onPlatform = true;
                        player.x = player.body.x + player.body.width / 2;
                        player.y = player.body.y + player.body.height / 2;
                        return;
                    }

                    if (player.body.velocityY < 0 &&
                        playerTop <= platformBottom &&
                        playerBottom > platformBottom) {

                        player.body.y = platformBottom;
                        player.body.velocityY = 0;
                        player.x = player.body.x + player.body.width / 2;
                        player.y = player.body.y + player.body.height / 2;
                        return;
                    }

                    if (player.body.grounded &&
                        Math.abs(playerBottom - platformTop) < 5) {
                        onPlatform = true;
                    }
                }
            }

           
            if (player.body.grounded && !onPlatform && player.body.y + player.body.height < this.groundY - 10) {
                player.body.grounded = false;
            }
        }

        if (this.arenaType === 'ground_only' && player.body.grounded) {
            const playerCenterX = player.body.x + player.body.width / 2;

            if (playerCenterX < this.actualGroundLeft || playerCenterX > this.actualGroundRight) {
                player.body.grounded = false;
            }
        }


        if (player.body.y + player.body.height >= this.groundY) {

            if (this.arenaType === 'ground_only') {
              
                const playerCenterX = player.body.x + player.body.width / 2;
                const playerAtGroundLevel = player.body.y + player.body.height >= this.groundY && player.body.y + player.body.height <= this.groundY + 10;

                if (playerAtGroundLevel && playerCenterX >= this.actualGroundLeft && playerCenterX <= this.actualGroundRight) {
                    player.body.y = this.groundY - player.body.height;
                    player.body.velocityY = 0;
                    player.body.grounded = true;
                }
                
            } else if (this.arenaType === 'default' || this.arenaType === 'spike_arena') {
               
                if (player.body.y + player.body.height > this.groundY) {
                    player.body.y = this.groundY - player.body.height;
                    player.body.velocityY = 0;
                    player.body.grounded = true;
                }
            }
            
        }


        if ((this.arenaType === 'default' || this.arenaType === 'spike_arena')) {
            
            if (player.body.y + player.body.height > this.groundY) {
                player.body.y = this.groundY - player.body.height;
                player.body.velocityY = 0;
                player.body.grounded = true;
            }
        }


        player.x = player.body.x + player.body.width / 2;
        player.y = player.body.y + player.body.height / 2;

        this.checkHazardCollisions(player);

        this.checkArenaWallCollisions(player);

        
        if (this.deathBoundary && player.body.y > this.deathBoundary) {
      
            const winner = player === this.player1 ? this.player2 : this.player1;
            this.createDeathEffect(player.x, player.y, 'void');
            this.endBattle('hazard', winner);
        }
    }

    checkHazardCollisions(player) {
        if (!this.hazards || this.hazards.length === 0) return;

        const playerLeft = player.body.x;
        const playerRight = player.body.x + player.body.width;
        const playerTop = player.body.y;
        const playerBottom = player.body.y + player.body.height;

        for (const hazard of this.hazards) {
            const hazardLeft = hazard.x;
            const hazardRight = hazard.x + hazard.width;
            const hazardTop = hazard.y;
            const hazardBottom = hazard.y + hazard.height;


            if (playerRight > hazardLeft &&
                playerLeft < hazardRight &&
                playerBottom > hazardTop &&
                playerTop < hazardBottom) {

     
                const winner = player === this.player1 ? this.player2 : this.player1;

       
                this.createDeathEffect(player.x, player.y, hazard.type);

                
                this.endBattle('hazard', winner);
                return;
            }
        }
    }

    createDeathEffect(x, y, hazardType) {
        let effectColor = 0xFF0000;
        let effectText = 'DEATH!';

        if (hazardType === 'lava') {
            effectColor = 0xFF4500;
            effectText = 'LAVA DEATH!';
        } else if (hazardType === 'spikes') {
            effectColor = 0xFF0000;
            effectText = 'SPIKED!';
        } else if (hazardType === 'void') {
            effectColor = 0x800080;
            effectText = 'RING OUT!';
        }


        for (let i = 0; i < 12; i++) {
            const particle = this.add.circle(
                x + Phaser.Math.Between(-20, 20),
                y + Phaser.Math.Between(-20, 20),
                Phaser.Math.Between(3, 8),
                effectColor,
                0.8
            );

            this.tweens.add({
                targets: particle,
                x: particle.x + Phaser.Math.Between(-60, 60),
                y: particle.y + Phaser.Math.Between(-60, 60),
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: 600,
                onComplete: () => particle.destroy()
            });
        }

        const deathText = this.add.text(x, y - 40, effectText, {
            fontSize: '32px',
            fill: '#FF0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: deathText,
            y: deathText.y - 80,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => deathText.destroy()
        });
    }

    flipPlayer(player, facingRight) {

        player.setScale(facingRight ? 1 : -1, 1);
    }

    updatePlayerAnimations(player, delta) {
        if (!player.parts) return;


        if (player.isWalking && player.body.grounded) {
            player.walkFrame += delta * 0.01;

 
            const legSwing = Math.sin(player.walkFrame) * 0.2;
            player.parts.leftLeg.rotation = legSwing;
            player.parts.rightLeg.rotation = -legSwing;
        } else {

            player.parts.leftLeg.rotation = 0;
            player.parts.rightLeg.rotation = 0;
        }


        const breathe = Math.sin(Date.now() * 0.002) * 0.02;
        player.parts.body.scaleY = 1 + breathe;
    }

    updateAttackHitboxes() {
  
        if (this.player1.body.facingRight) {
            this.player1.attackHitbox.x = this.player1.x + 50;
        } else {
            this.player1.attackHitbox.x = this.player1.x - 50;
        }
        this.player1.attackHitbox.y = this.player1.y;

        if (this.player2.body.facingRight) {
            this.player2.attackHitbox.x = this.player2.x + 50;
        } else {
            this.player2.attackHitbox.x = this.player2.x - 50;
        }
        this.player2.attackHitbox.y = this.player2.y;
    }

    performAttack(player, playerNum) {
        if (!player.parts) return;

        if (window.audioManager) {
            if (player.weapon && player.weapon.type === 'sword') {
                window.audioManager.playSound('swordSwing'); 
            } else if (player.weapon && player.weapon.type === 'gun') {

            } else if (player.weapon && player.weapon.type === 'shield') {
                window.audioManager.playSound('swordHit'); 
            } else {
                window.audioManager.playSound('buttonHover'); 
            }
        }

        if (player.weapon && player.weapon.type === 'sword') {
  
            this.tweens.add({
                targets: player.weapon.sprite,
                rotation: Math.PI / 3,
                duration: 100,
                ease: 'Power2',
                yoyo: true
            });
        }

        if (player.weapon && player.weapon.type === 'sword') {
     
            this.tweens.add({
                targets: player.parts.rightArm,
                rotation: Math.PI / 4,
                duration: 100,
                ease: 'Power2',
                yoyo: true
            });
        } else if (player.weapon && player.weapon.type === 'gun') {
           
            this.tweens.add({
                targets: player.parts.rightArm,
                rotation: -Math.PI / 8,
                duration: 80,
                ease: 'Power2',
                yoyo: true
            });
    
            this.fireBullet(player);
        } else if (player.weapon && player.weapon.type === 'shield') {
            
            this.tweens.add({
                targets: player.parts.rightArm,
                rotation: -Math.PI / 3,
                duration: 100,
                ease: 'Power2',
                yoyo: true
            });
        } else {
   
            this.tweens.add({
                targets: player.parts.rightArm,
                rotation: -Math.PI / 3, 
                duration: 100,
                ease: 'Power2',
                yoyo: true
            });
        }


        const attackDirection = player.body.facingRight ? 1 : -1;
        this.tweens.add({
            targets: player,
            x: player.x + (attackDirection * 10),
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });

        player.isAttacking = true;
        this.time.delayedCall(200, () => {
            player.isAttacking = false;
        });
    }

    performDash(player, playerNum, direction) {
        if (!player.parts) return;


        if (window.audioManager) {
            window.audioManager.playSound('dashWhoosh'); 
        }

        const dashDirection = direction === 'left' ? -1 : 1;
        const dashDistance = 240; 

 
        const otherPlayer = player === this.player1 ? this.player2 : this.player1;
        const targetX = player.body.x + (dashDirection * dashDistance);

        const clampedTargetX = Math.max(this.arenaLeft, Math.min(targetX, this.arenaRight - player.body.width));

        const tempBody = {
            x: clampedTargetX,
            y: player.body.y,
            width: player.body.width,
            height: player.body.height
        };

        let finalTargetX = clampedTargetX;
        if (this.checkPlayerCollision(tempBody, otherPlayer.body)) {

            const step = dashDirection > 0 ? -10 : 10;
            let testX = clampedTargetX;
            while (Math.abs(testX - player.body.x) > 20) {
                testX += step;
                const testBody = {
                    x: testX,
                    y: player.body.y,
                    width: player.body.width,
                    height: player.body.height
                };
                if (!this.checkPlayerCollision(testBody, otherPlayer.body)) {
                    finalTargetX = testX;
                    break;
                }
            }
        }

        player.isDashing = true;

        this.tweens.add({
            targets: player.body,
            x: finalTargetX,
            duration: 150,
            ease: 'Power2'
        });

        if (dashDirection === -1 && player.body.facingRight) {
            player.body.facingRight = false;
            this.flipPlayer(player, false);
        } else if (dashDirection === 1 && !player.body.facingRight) {
            player.body.facingRight = true;
            this.flipPlayer(player, true);
        }


        this.tweens.add({
            targets: player,
            rotation: dashDirection * 0.2,
            duration: 120,
            yoyo: true,
            ease: 'Power2'
        });

        this.tweens.add({
            targets: player.parts.body,
            scaleX: 1.4,
            scaleY: 0.8,
            duration: 120,
            yoyo: true,
            ease: 'Power2'
        });

     
        const effectPlayerNum = player === this.player1 ? 2 : 1; 
        this.createDashEffect(player, effectPlayerNum);

s
        this.time.delayedCall(150, () => {
            player.isDashing = false;
            player.body.velocityX = 0; 
        });
    }

    createDashEffect(player, playerNum) {

        for (let i = 0; i < 5; i++) {
            const afterimage = this.add.container(
                player.x - (player.body.facingRight ? i * 12 : -i * 12),
                player.y
            );

            
            const silhouette = this.add.circle(0, 0, 15, playerNum === 1 ? 0x3498db : 0xe74c3c, 0.3 - i * 0.05);
            afterimage.add(silhouette);

            this.tweens.add({
                targets: afterimage,
                alpha: 0,
                duration: 300,
                onComplete: () => afterimage.destroy()
            });
        }

        for (let i = 0; i < 6; i++) {
            const dust = this.add.circle(
                player.x + Phaser.Math.Between(-10, 10),
                player.y + 25,
                Phaser.Math.Between(3, 6),
                0x8b4513,
                0.6
            );

            this.tweens.add({
                targets: dust,
                x: dust.x + Phaser.Math.Between(-20, 20),
                y: dust.y + Phaser.Math.Between(5, 15),
                alpha: 0,
                duration: 400,
                onComplete: () => dust.destroy()
            });
        }
    }

    performSacrificeAttack(player, playerNum) {
        if (!player.parts) return;

        
        player.sacrificeUsed = true;
        player.sacrificeHit = false; 

        const costText = this.add.text(player.x, player.y - 100, 'SACRIFICE ATTACK!', {
            fontSize: '20px',
            fill: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: costText,
            y: costText.y - 40,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => costText.destroy()
        });

       
        if (player.weapon && player.weapon.type === 'gun') {
            
            this.fireSacrificeBullet(player, playerNum);
        } else {
            
            player.sacrificeAttacking = true;

            
            const attackDirection = player.body.facingRight ? 1 : -1;

           
            const chargeEffect = this.add.circle(player.x, player.y, 60, 0x8b0000, 0.6);
            this.tweens.add({
                targets: chargeEffect,
                scaleX: 0.5,
                scaleY: 0.5,
                alpha: 0,
                duration: 200,
                onComplete: () => chargeEffect.destroy()
            });

       
            this.tweens.add({
                targets: player.parts.rightArm,
                rotation: -Math.PI / 2,
                duration: 150,
                ease: 'Power3',
                yoyo: true
            });

            
            this.tweens.add({
                targets: player,
                x: player.x + (attackDirection * 30),
                duration: 150,
                yoyo: true,
                ease: 'Power3'
            });

         
            if (window.audioManager) {
                window.audioManager.playSound('criticalHit');
            }

           
            this.time.delayedCall(300, () => {
                player.sacrificeAttacking = false;

               
                if (!player.sacrificeHit) {
                    this.applySacrificeMissPenalty(player);
                }
            });
        }
    }

    fireSacrificeBullet(player, playerNum) {
        const bulletSpeed = 800;
        const direction = player.body.facingRight ? 1 : -1;

       
        const startX = player.x + (direction * 25);
        const startY = player.y - 5;

        const sacrificeBullet = {
            sprite: this.add.circle(startX, startY, 5, 0x8b0000, 1), 
            velocityX: direction * bulletSpeed,
            velocityY: 0,
            shooter: player,
            isSacrifice: true, 
            lifespan: 3000, 
            hit: false
        };

        this.bullets.push(sacrificeBullet);


        if (player.parts && player.parts.rightArm) {
            this.tweens.add({
                targets: player.parts.rightArm,
                rotation: -Math.PI / 6,
                duration: 80,
                ease: 'Power2',
                yoyo: true
            });
        }

        if (window.audioManager) {
            window.audioManager.playSound('gunShot');
        }

        const muzzleFlash = this.add.circle(startX, startY, 15, 0xff0000, 0.9);
        this.tweens.add({
            targets: muzzleFlash,
            alpha: 0,
            scaleX: 3,
            scaleY: 3,
            duration: 150,
            onComplete: () => muzzleFlash.destroy()
        });


        player.sacrificeBullet = sacrificeBullet;
    }

    applySacrificeMissPenalty(player) {
        player.health = Math.max(0, player.health - 30);
        this.updateHealthBars();

        const damageText = this.add.text(player.x, player.y - 40, '-30', {
            fontSize: '24px',
            fill: '#ff4444',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: damageText,
            y: damageText.y - 60,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });

        const missText = this.add.text(player.x, player.y - 80, 'MISSED! SELF DAMAGE!', {
            fontSize: '18px',
            fill: '#ff6666',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: missText,
            y: missText.y - 40,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => missText.destroy()
        });

        this.tweens.add({
            targets: player,
            alpha: 0.3,
            duration: 100,
            yoyo: true
        });

       
        if (player.health <= 0) {
            const winner = player === this.player1 ? this.player2 : this.player1;
            this.endBattle('knockout', winner);
        }
    }

    performBloodGambit(player) {

        const healthPercent = (player.health / player.stats.health) * 100;
        if (healthPercent <= 30) {

            const warningText = this.add.text(player.x, player.y - 80, 'NOT ENOUGH HP!', {
                fontSize: '18px',
                fill: '#ffaa00',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);

            this.tweens.add({
                targets: warningText,
                y: warningText.y - 40,
                alpha: 0,
                duration: 1500,
                onComplete: () => warningText.destroy()
            });
            return;
        }


        player.gambitUsed = true;

 
        const cost = Math.floor(player.stats.health * 0.3);
        player.health = Math.max(1, player.health - cost);
        this.updateHealthBars();

        const costText = this.add.text(player.x, player.y - 40, `-${cost}`, {
            fontSize: '24px',
            fill: '#ff4444',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: costText,
            y: costText.y - 60,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => costText.destroy()
        });

        this.cameras.main.flash(200, 139, 0, 0, true);

        const buffs = player.weapon ? ['berserker', 'swift', 'iron', 'vampiric'] : ['berserker', 'swift', 'iron', 'vampiric', 'weapon'];
        const selectedBuff = Phaser.Utils.Array.GetRandom(buffs);

        this.applyBuff(player, selectedBuff);
    }

    applyBuff(player, buffType) {
        player.buffActive = true;
        player.buffType = buffType;

        let buffName = '';
        let buffColor = '#ffffff';
        let duration = 8000;
        switch (buffType) {
            case 'berserker':
                buffName = 'BERSERKER!';
                buffColor = '#ff0000';
                player.buffTimer = duration;
                
                break;

            case 'swift':
                buffName = 'SWIFT STEP!';
                buffColor = '#00aaff';
                player.buffTimer = duration;
              
                player.buffSpeedBonus = player.stats.speed * 0.6;
                break;

            case 'iron':
                buffName = 'IRON SKIN!';
                buffColor = '#888888';
                player.buffTimer = 6000; 
          
                break;

            case 'vampiric':
                buffName = 'VAMPIRIC!';
                buffColor = '#aa00ff';
                player.buffTimer = duration;
              
                break;

            case 'weapon':
                buffName = 'WEAPON SUMMON!';
                buffColor = '#ffd700';
         
                const weaponTypes = ['sword', 'gun', 'shield', 'potion'];
                const randomWeapon = Phaser.Utils.Array.GetRandom(weaponTypes);
                this.spawnWeapon(randomWeapon, player.x, player.y + 40);
                player.buffActive = false;
                break;
        }

        // Show buff name
        const buffText = this.add.text(player.x, player.y - 100, buffName, {
            fontSize: '24px',
            fill: buffColor,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: buffText,
            y: buffText.y - 40,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => buffText.destroy()
        });

        // Create visual effect for buff (except weapon)
        if (buffType !== 'weapon') {
            this.createBuffEffect(player, buffType);
        }

        // Play sound
        if (window.audioManager) {
            window.audioManager.playSound('battleStart');
        }
    }

    createBuffEffect(player, buffType) {
        let color, particleColor;

        switch (buffType) {
            case 'berserker': color = 0xff0000; particleColor = 0xff0000; break;
            case 'swift': color = 0x00aaff; particleColor = 0x00aaff; break;
            case 'iron': color = 0x888888; particleColor = 0x888888; break;
            case 'vampiric': color = 0xaa00ff; particleColor = 0xaa00ff; break;
        }

    
        const particleEvent = this.time.addEvent({
            delay: 100,
            callback: () => {
                if (player.buffActive && !this.gameEnded) {
                    const particle = this.add.circle(
                        player.x + Phaser.Math.Between(-20, 20),
                        player.y + Phaser.Math.Between(-20, 20),
                        3,
                        particleColor,
                        0.8
                    );

                    this.tweens.add({
                        targets: particle,
                        y: particle.y - 30,
                        alpha: 0,
                        duration: 800,
                        onComplete: () => particle.destroy()
                    });
                }
            },
            repeat: -1
        });

        player.buffEffect = particleEvent;
    }

    updateBuffTimers(delta) {

        if (this.player1.buffActive && this.player1.buffTimer > 0) {
            this.player1.buffTimer -= delta;
            if (this.player1.buffTimer <= 0) {
                this.removeBuff(this.player1);
            }
        }


        if (this.player2.buffActive && this.player2.buffTimer > 0) {
            this.player2.buffTimer -= delta;
            if (this.player2.buffTimer <= 0) {
                this.removeBuff(this.player2);
            }
        }
    }

    removeBuff(player) {
        player.buffActive = false;
        player.buffType = null;
        player.buffTimer = 0;

       
        if (player.buffSpeedBonus) {
            player.buffSpeedBonus = 0;
        }

 
        if (player.buffEffect) {
            player.buffEffect.destroy();
            player.buffEffect = null;
        }
    }

    checkAttacks() {
       
        if (!this.player1 || !this.player2) {
            return;
        }

    
        if (this.player1.sacrificeAttacking && this.player1.attackHitbox && this.checkCollision(this.player1.attackHitbox, this.player2)) {
            const baseDamage = this.calculateDamage(this.player1);
            const sacrificeDamage = Math.floor(baseDamage * 2); // Double damage, rounded down
            this.dealDamage(this.player2, sacrificeDamage, 'sacrifice', this.player1);
            this.player1.sacrificeAttacking = false; // Prevent multiple hits
            this.player1.sacrificeHit = true; // Mark that sacrifice hit

     
            this.cameras.main.shake(250, 0.03);

     
            const hitText = this.add.text(this.player2.x, this.player2.y - 100, 'SACRIFICE HIT!', {
                fontSize: '20px',
                fill: '#ff0000',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.tweens.add({
                targets: hitText,
                y: hitText.y - 40,
                alpha: 0,
                duration: 1500,
                ease: 'Power2',
                onComplete: () => hitText.destroy()
            });
        }

        
        if (this.player2.sacrificeAttacking && this.player2.attackHitbox && this.checkCollision(this.player2.attackHitbox, this.player1)) {
            const baseDamage = this.calculateDamage(this.player2);
            const sacrificeDamage = Math.floor(baseDamage * 2); // Double damage, rounded down
            this.dealDamage(this.player1, sacrificeDamage, 'sacrifice', this.player2);
            this.player2.sacrificeAttacking = false; // Prevent multiple hits
            this.player2.sacrificeHit = true; // Mark that sacrifice hit

          
            this.cameras.main.shake(250, 0.03);

            
            const hitText = this.add.text(this.player1.x, this.player1.y - 100, 'SACRIFICE HIT!', {
                fontSize: '20px',
                fill: '#ff0000',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.tweens.add({
                targets: hitText,
                y: hitText.y - 40,
                alpha: 0,
                duration: 1500,
                ease: 'Power2',
                onComplete: () => hitText.destroy()
            });
        }

        
        if (this.player1.isAttacking && this.player1.attackHitbox && this.checkCollision(this.player1.attackHitbox, this.player2)) {
            const damage = this.calculateDamage(this.player1);
            this.dealDamage(this.player2, damage, this.player1.weapon ? this.player1.weapon.type : 'punch', this.player1);
            this.player1.isAttacking = false; 
        }

       
        if (this.player2.isAttacking && this.player2.attackHitbox && this.checkCollision(this.player2.attackHitbox, this.player1)) {
            const damage = this.calculateDamage(this.player2);
            this.dealDamage(this.player1, damage, this.player2.weapon ? this.player2.weapon.type : 'punch', this.player2);
            this.player2.isAttacking = false; 
        }
    }

    calculateDamage(player) {
        let baseDamage = player.stats.damage;

      
        if (player.abilityActive && player.playerData.statChoice === 'damage') {
            baseDamage *= 1.5; 
        }

      
        if (player.buffActive && player.buffType === 'berserker') {
            baseDamage *= 1.5; // 50% damage increase
        }

        if (player.weapon) {
            switch (player.weapon.type) {
                case 'sword':
                    baseDamage *= 2; // Double damage with sword
                    break;
                case 'gun':
                    baseDamage = baseDamage; // Same damage but ranged
                    break;
                case 'potion':
                    // Potion is used for healing, not damage
                    break;
            }
        }

        return baseDamage;
    }

    checkCollision(hitbox, target) {

        if (!hitbox || !target) {
            return false;
        }

        try {
            const hitboxBounds = hitbox.getBounds();
            const targetBounds = target.getBounds();

            return Phaser.Geom.Rectangle.Overlaps(hitboxBounds, targetBounds);
        } catch (error) {
            console.warn('Collision detection error:', error);
            return false;
        }
    }

    dealDamage(target, damage, weaponType = 'punch', attacker = null) {

        let finalDamage = damage;
        if (target.weapon && target.weapon.type === 'shield') {
            finalDamage = Math.ceil(damage * 0.5); // 50% damage reduction, rounded up
        }

        if (target.buffActive && target.buffType === 'iron') {
            finalDamage = Math.ceil(finalDamage * 0.5); // 50% damage reduction
        }

        target.health -= finalDamage;

        
        if (attacker && attacker.buffActive && attacker.buffType === 'vampiric') {
            const healAmount = 10;
            attacker.health = Math.min(attacker.health + healAmount, attacker.stats.health);
            this.updateHealthBars();


            const healText = this.add.text(attacker.x, attacker.y - 60, `+${healAmount}`, {
                fontSize: '18px',
                fill: '#aa00ff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);

            this.tweens.add({
                targets: healText,
                y: healText.y - 30,
                alpha: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => healText.destroy()
            });
        }

       
        const damageColor = (target.weapon && target.weapon.type === 'shield') ? '#66ccff' : '#ff4444';
        const damageText = this.add.text(target.x, target.y - 40, `-${finalDamage}`, {
            fontSize: '24px',
            fill: damageColor,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

       
        if (target.weapon && target.weapon.type === 'shield' && finalDamage < damage) {
            const blockedText = this.add.text(target.x + 30, target.y - 60, 'BLOCKED!', {
                fontSize: '16px',
                fill: '#4169E1',
                fontStyle: 'bold',
                stroke: '#FFD700',
                strokeThickness: 2
            }).setOrigin(0.5);

            this.tweens.add({
                targets: blockedText,
                y: blockedText.y - 40,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => blockedText.destroy()
            });
        }

    
        this.tweens.add({
            targets: damageText,
            y: damageText.y - 60,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });

   t
        this.createHitEffect(target);

        this.tweens.add({
            targets: target,
            alpha: 0.3,
            duration: 100,
            yoyo: true
        });

    
        let knockbackDirection = 1; // Default right
        if (attacker) {
            
            knockbackDirection = target.x > attacker.x ? 1 : -1;
        } else {
            
            knockbackDirection = target === this.player1 ? -1 : 1;
        }

        let knockbackForce = 200; // Default for punch

        switch (weaponType) {
            case 'sword':
                knockbackForce = 400; // High pushback for sword
                break;
            case 'gun':
                knockbackForce = 150; // Lower pushback for gun
                break;
            case 'punch':
                knockbackForce = 200; // Standard pushback for punch
                break;
        }

        
        target.body.velocityX = knockbackDirection * knockbackForce;
        target.knockbackTime = 300; // 300ms of knockback immunity from friction

  
        const shakeIntensity = weaponType === 'sword' ? 0.02 : 0.01;
        this.cameras.main.shake(150, shakeIntensity);

        this.updateHealthBars();

        if (target.health <= 0) {
            const winner = target === this.player1 ? this.player2 : this.player1;
            this.endBattle('knockout', winner);
        }


        if (window.audioManager) {
            switch (weaponType) {
                case 'sword':
                    window.audioManager.playSound('swordHit'); // Metallic clang for sword hit
                    break;
                case 'gun':
                    window.audioManager.playSound('gunShot'); // Gun impact sound
                    break;
                case 'shield':
                    window.audioManager.playSound('swordSwing'); // Heavy thud for shield bash hit
                    break;
                case 'punch':
                    window.audioManager.playSound('heavyHit'); // Sharp thud for punch hit
                    break;
            }
        }
    }

    createHitEffect(target) {

        const impactFlash = this.add.circle(target.x, target.y, 25, 0xffffff, 0.8);

        this.tweens.add({
            targets: impactFlash,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 200,
            onComplete: () => impactFlash.destroy()
        });
    }

    startSuddenDeath() {
        this.gameEnded = true;


        const suddenDeathText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50,
            'OVERTIME SACRIFICE!', {
            fontSize: '32px',
            fill: '#ff0000',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        const subtitleText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 10,
            'Your life force drains...', {
            fontSize: '18px',
            fill: '#ff6666',
            fontStyle: 'italic',
            align: 'center'
        }).setOrigin(0.5);


        this.tweens.add({
            targets: [suddenDeathText, subtitleText],
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                suddenDeathText.destroy();
                subtitleText.destroy();
                this.gameEnded = false;

   
                this.tweens.add({
                    targets: [this.healthBar1, this.healthBar2],
                    tint: 0xff0000,
                    duration: 1000,
                    yoyo: true
                });

                this.timerText.setText('OVERTIME').setFill('#ff0000');


                this.overtimeDrainEvent = this.time.addEvent({
                    delay: 1000, // Every 1 second
                    callback: () => {
                        if (!this.gameEnded) {
                    
                            this.player1.health = Math.max(0, this.player1.health - 5);
                            this.player2.health = Math.max(0, this.player2.health - 5);
                            this.updateHealthBars();

                        
                            this.createDrainEffect(this.player1);
                            this.createDrainEffect(this.player2);

                        
                            if (this.player1.health <= 0 && this.player2.health <= 0) {
                                
                                if (this.overtimeDrainEvent) {
                                    this.overtimeDrainEvent.destroy();
                                    this.overtimeDrainEvent = null;
                                }

                  
                                this.player1.health = 1;
                                this.player2.health = 1;
                                this.updateHealthBars();

                 
                                const suddenDeathText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50,
                                    'SUDDEN DEATH!', {
                                    fontSize: '32px',
                                    fill: '#ff0000',
                                    fontStyle: 'bold'
                                }).setOrigin(0.5);

                                const subtitleText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 10,
                                    'First hit wins!', {
                                    fontSize: '20px',
                                    fill: '#fbbf24',
                                    fontStyle: 'bold'
                                }).setOrigin(0.5);

                                
                                this.tweens.add({
                                    targets: [suddenDeathText, subtitleText],
                                    alpha: 0.3,
                                    duration: 500,
                                    yoyo: true,
                                    repeat: 3,
                                    onComplete: () => {
                                        suddenDeathText.destroy();
                                        subtitleText.destroy();
                                        this.gameEnded = false; // Resume the game!
                                    }
                                });

                                
                                this.timerText.setText('SUDDEN DEATH').setFill('#ff0000');
                            } else if (this.player1.health <= 0) {
                                this.endBattle('knockout', this.player2);
                            } else if (this.player2.health <= 0) {
                                this.endBattle('knockout', this.player1);
                            }
                        }
                    },
                    repeat: -1 
                });
            }
        });
    }

    createDrainEffect(player) {

        for (let i = 0; i < 3; i++) {
            const particle = this.add.circle(
                player.x + Phaser.Math.Between(-15, 15),
                player.y + Phaser.Math.Between(-20, 20),
                2,
                0x8b0000,
                0.8
            );

            this.tweens.add({
                targets: particle,
                y: particle.y + 40,
                alpha: 0,
                duration: 1000,
                onComplete: () => particle.destroy()
            });
        }
    }

    updateHealthBars() {
        
        const health1Percent = Math.max(0, this.player1.health / this.player1.stats.health);
        this.healthBar1.scaleX = health1Percent;

        
        const health2Percent = Math.max(0, this.player2.health / this.player2.stats.health);
        this.healthBar2.scaleX = health2Percent;
    }

    endBattle(reason, winner = null) {
        if (this.gameEnded) return;

        this.gameEnded = true;


        if (this.battleTimerEvent) {
            this.battleTimerEvent.destroy();
            this.battleTimerEvent = null;
        }

        if (this.overtimeDrainEvent) {
            this.overtimeDrainEvent.destroy();
            this.overtimeDrainEvent = null;
        }

        if (reason === 'time') {
            if (this.player1.health > this.player2.health) {
                winner = this.player1;
            } else if (this.player2.health > this.player1.health) {
                winner = this.player2;
            } else {
              
                this.startSuddenDeath();
                return;
            }
        }

       
        this.updateTournamentData(winner);

       
        this.showVictoryMessage(winner);
    }

    updateTournamentData(winner) {
        const tournamentData = this.registry.get('tournamentData');
        const currentRound = tournamentData.bracket[tournamentData.currentRound - 1];
        const currentMatch = currentRound.matches[tournamentData.currentMatch];

   
        currentMatch.winner = winner.playerData;
        currentMatch.completed = true;

       
        const loser = winner === this.player1 ? this.player2 : this.player1;
        loser.playerData.eliminated = true;

        
        const remainingMatches = currentRound.matches.filter(match => !match.completed);
        if (remainingMatches.length > 0) {
            
            for (let i = 0; i < currentRound.matches.length; i++) {
                if (!currentRound.matches[i].completed) {
                    tournamentData.currentMatch = i;
                    break;
                }
            }
        } else {
         
            tournamentData.currentMatch = 0;
        }

        this.registry.set('tournamentData', tournamentData);
    }

    showVictoryMessage(winner) {
        const winnerName = winner.playerData.name;
        const loser = winner === this.player1 ? this.player2 : this.player1;
        const reason = this.battleTimer <= 0 ? 'TIME!' : 'KNOCKOUT!';

        this.children.removeAll();

        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;


        this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.8);

        this.add.text(centerX, centerY - 150, '🏆 WINNER! 🏆', {
            fontSize: '48px',
            fill: '#ffd93d',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centerX, centerY - 80, winnerName, {
            fontSize: '36px',
            fill: '#2ecc71',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centerX, centerY - 40, `defeats ${loser.playerData.name}`, {
            fontSize: '24px',
            fill: '#95a5a6'
        }).setOrigin(0.5);

        this.add.text(centerX, centerY - 10, reason, {
            fontSize: '20px',
            fill: '#e74c3c',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const isFinalMatch = this.isFinalMatch();
        const message = isFinalMatch ?
            `The Throne of Exhile belongs to ${winnerName}` :
            `${winnerName} proceeds to the next round`;

        this.add.text(centerX, centerY + 30, message, {
            fontSize: '20px',
            fill: '#fbbf24',
            fontStyle: 'italic'
        }).setOrigin(0.5);

  
        this.createContinueButtons(centerX, this.cameras.main.height - 120);

    
        if (window.audioManager) {
            window.audioManager.playSound('winnerAnnounce');
        }
    }

    isFinalMatch() {
        const tournamentData = this.registry.get('tournamentData');
        const currentRound = tournamentData.bracket[tournamentData.currentRound - 1];

       
        return tournamentData.currentRound === tournamentData.bracket.length &&
               currentRound && currentRound.matches.length === 1;
    }

    createContinueButtons(centerX, y) {
        const isFinalMatch = this.isFinalMatch();

        if (isFinalMatch) {
            
            const resultsButton = this.add.rectangle(centerX, y, 250, 60, 0xfbbf24)
                .setInteractive()
                .setStrokeStyle(3, 0xf59e0b);

            this.add.text(centerX, y, 'VIEW FINAL RESULTS', {
                fontSize: '18px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            resultsButton.on('pointerdown', () => {
                if (window.audioManager) {
                    window.audioManager.playSound('buttonClick');
                }
                this.cleanupAmbientAudio();
                this.scene.start('TournamentResultsScene');
            });
            resultsButton.on('pointerover', () => {
                if (window.audioManager) {
                    window.audioManager.playSound('buttonHover');
                }
                resultsButton.setFillStyle(0xf59e0b);
            });
            resultsButton.on('pointerout', () => {
                resultsButton.setFillStyle(0xfbbf24);
            });
        } else {
        
            const nextRoundButton = this.add.rectangle(centerX - 120, y, 200, 60, 0x10b981)
                .setInteractive()
                .setStrokeStyle(3, 0x059669);

            this.add.text(centerX - 120, y, 'NEXT ROUND', {
                fontSize: '18px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            
            const bracketButton = this.add.rectangle(centerX + 120, y, 200, 60, 0x8b5cf6)
                .setInteractive()
                .setStrokeStyle(3, 0xa855f7);

            this.add.text(centerX + 120, y, 'VIEW BRACKET', {
                fontSize: '18px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            nextRoundButton.on('pointerdown', () => {
                if (window.audioManager) {
                    window.audioManager.playSound('buttonClick');
                }
                this.proceedToNextRound();
            });
            nextRoundButton.on('pointerover', () => {
                if (window.audioManager) {
                    window.audioManager.playSound('buttonHover');
                }
                nextRoundButton.setFillStyle(0x059669);
            });
            nextRoundButton.on('pointerout', () => {
                nextRoundButton.setFillStyle(0x10b981);
            });

            bracketButton.on('pointerdown', () => {
                if (window.audioManager) {
                    window.audioManager.playSound('buttonClick');
                }
                this.viewBracket();
            });
            bracketButton.on('pointerover', () => {
                if (window.audioManager) {
                    window.audioManager.playSound('buttonHover');
                }
                bracketButton.setFillStyle(0xa855f7);
            });
            bracketButton.on('pointerout', () => {
                bracketButton.setFillStyle(0x8b5cf6);
            });
        }
    }

    proceedToNextRound() {
        const tournamentData = this.registry.get('tournamentData');

       
        const currentRound = tournamentData.bracket[tournamentData.currentRound - 1];
        const remainingMatches = currentRound.matches.filter(match => !match.completed);

        if (remainingMatches.length > 0) {
            
            for (let i = 0; i < currentRound.matches.length; i++) {
                if (!currentRound.matches[i].completed) {
                    tournamentData.currentMatch = i;
                    break;
                }
            }
            this.registry.set('tournamentData', tournamentData);
            this.cleanupAmbientAudio();
            this.scene.start('CharacterSelectionScene');
        } else {
            
            this.advanceToNextRound();
        }
    }

    advanceToNextRound() {
        const tournamentData = this.registry.get('tournamentData');


        const currentRound = tournamentData.bracket[tournamentData.currentRound - 1];
        const winners = currentRound.matches.map(match => match.winner);

        if (winners.length === 1) {
            
            this.scene.start('TournamentResultsScene');
            return;
        }


        tournamentData.currentRound++;
        tournamentData.currentMatch = 0;

        if (tournamentData.bracket[tournamentData.currentRound - 1]) {
            const nextRound = tournamentData.bracket[tournamentData.currentRound - 1];

            let winnerIndex = 0;
            for (let matchIndex = 0; matchIndex < nextRound.matches.length; matchIndex++) {
                const match = nextRound.matches[matchIndex];

                if (winnerIndex < winners.length) {
                    match.player1 = winners[winnerIndex];
                    winnerIndex++;
                }
                if (winnerIndex < winners.length) {
                    match.player2 = winners[winnerIndex];
                    winnerIndex++;
                }

                match.winner = null;
                match.completed = false;
            }
        }

        this.registry.set('tournamentData', tournamentData);
        this.cleanupAmbientAudio();
        this.scene.start('CharacterSelectionScene');
    }

    viewBracket() {

        this.cleanupAmbientAudio();
        this.scene.start('TournamentBracketScene');
    }

    updateWeaponSpawning(delta) {
        this.weaponSpawnTimer += delta;

        if (this.weaponSpawnTimer >= this.weaponSpawnInterval) {
            this.spawnRandomWeapon();
            this.weaponSpawnTimer = 0;
        }


        this.weapons = this.weapons.filter(weapon => {
            weapon.lifespan -= delta;
            if (weapon.lifespan <= 0) {
                weapon.sprite.destroy();
                return false;
            }
            return true;
        });
    }

    spawnRandomWeapon() {
  
        if (this.weapons.length > 0) return;

        const weaponTypes = ['sword', 'gun', 'potion', 'shield'];
        const randomType = Phaser.Utils.Array.GetRandom(weaponTypes);

    
        const spawnLocations = this.getValidSpawnLocations();
        const randomLocation = Phaser.Utils.Array.GetRandom(spawnLocations);

        this.createWeapon(randomType, randomLocation.x, randomLocation.y);
    }

    getValidSpawnLocations() {
        const locations = [];

        if (this.actualGroundLeft !== undefined && this.actualGroundRight !== undefined) {
      
            for (let x = this.actualGroundLeft + 50; x < this.actualGroundRight - 50; x += 80) {
                locations.push({ x: x, y: this.groundY });
            }
        } else if (this.platforms && this.platforms.length === 4) {

        } else {
   
            for (let x = this.arenaLeft + 100; x < this.arenaRight - 100; x += 100) {
                locations.push({ x: x, y: this.groundY });
            }
        }


        if (this.platforms) {
            this.platforms.forEach(platform => {
     
                const platformCenterX = platform.x + platform.width / 2;
                const platformY = platform.y;
                locations.push({ x: platformCenterX, y: platformY });

                if (platform.width > 150) {
                    locations.push({
                        x: platform.x + platform.width * 0.25,
                        y: platformY
                    });
                    locations.push({
                        x: platform.x + platform.width * 0.75,
                        y: platformY
                    });
                }
            });
        }

        return locations;
    }

    createWeapon(type, x, y) {
        const weapon = {
            type: type,
            x: x,
            y: y,
            lifespan: 5000, // 5 seconds lifespan
            sprite: null
        };


        switch (type) {
            case 'sword':
                weapon.sprite = this.add.graphics();
                weapon.sprite.lineStyle(4, 0xc0c0c0); // Blade
                weapon.sprite.lineBetween(0, -15, 0, -35); // Medium blade
                weapon.sprite.lineStyle(6, 0x8b4513); // Hilt
                weapon.sprite.lineBetween(0, -12, 0, -8); // Hilt
                weapon.sprite.fillStyle(0xffd700);
                weapon.sprite.fillCircle(0, -8, 3); // Pommel
     
                weapon.sprite.lineStyle(5, 0x8b4513);
                weapon.sprite.lineBetween(-8, -12, 8, -12);
                break;
            case 'gun':
                weapon.sprite = this.add.graphics();
   
                weapon.sprite.fillStyle(0x4a4a4a);
                weapon.sprite.fillRect(-12, -4, 20, 8); // Main body
                weapon.sprite.lineStyle(2, 0x2a2a2a);
                weapon.sprite.strokeRect(-12, -4, 20, 8);

                weapon.sprite.fillStyle(0x2a2a2a);
                weapon.sprite.fillRect(8, -2, 8, 4);
                weapon.sprite.lineStyle(1, 0x1a1a1a);
                weapon.sprite.strokeRect(8, -2, 8, 4);


                weapon.sprite.fillStyle(0x654321);
                weapon.sprite.fillRect(-12, 0, 6, 10);
                weapon.sprite.lineStyle(1, 0x4a3218);
                weapon.sprite.strokeRect(-12, 0, 6, 10);

                weapon.sprite.lineStyle(2, 0x2a2a2a);
                weapon.sprite.strokeEllipse(-6, 6, 6, 6);

   
                weapon.sprite.fillStyle(0x1a1a1a);
                weapon.sprite.fillRect(12, -6, 2, 4);
                break;
            case 'potion':
                weapon.sprite = this.add.text(x, y, '❤️', {
                    fontSize: '32px'
                }).setOrigin(0.5);
                break;
            case 'shield':
                weapon.sprite = this.add.graphics();
                weapon.sprite.fillStyle(0x4169E1); // Royal blue
                weapon.sprite.fillEllipse(0, -5, 24, 32); // Main shield body
                weapon.sprite.lineStyle(3, 0x1E90FF);
                weapon.sprite.strokeEllipse(0, -5, 24, 32);

                weapon.sprite.fillStyle(0xC0C0C0); // Silver
                weapon.sprite.fillCircle(0, -8, 6);
                weapon.sprite.lineStyle(2, 0x808080);
                weapon.sprite.strokeCircle(0, -8, 6);

                weapon.sprite.lineStyle(2, 0xFFD700); // Gold trim
                weapon.sprite.strokeEllipse(0, -5, 20, 28);
                break;
        }

        if (type !== 'potion') {
            weapon.sprite.setPosition(x, y - 100);
        } else {
            weapon.sprite.setPosition(x, y - 100);
        }

        this.tweens.add({
            targets: weapon.sprite,
            y: y - 10, 
            rotation: type !== 'potion' ? Math.PI * 2 : 0, 
            scaleX: { from: 0.3, to: 1.3 },
            scaleY: { from: 0.3, to: 1.3 },
            duration: 600,
            ease: 'Bounce.easeOut',
            onComplete: () => {
          
                this.tweens.add({
                    targets: weapon.sprite,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200,
                    ease: 'Back.easeOut'
                });
            }
        });

        this.weapons.push(weapon);
    }

    checkWeaponPickups() {
        this.weapons.forEach((weapon, index) => {
    
            const dist1 = Phaser.Math.Distance.Between(
                this.player1.x, this.player1.y,
                weapon.sprite.x, weapon.sprite.y
            );

            if (dist1 < 30) {
                this.pickupWeapon(this.player1, weapon, index);
                return;
            }
            const dist2 = Phaser.Math.Distance.Between(
                this.player2.x, this.player2.y,
                weapon.sprite.x, weapon.sprite.y
            );

            if (dist2 < 30) {
                this.pickupWeapon(this.player2, weapon, index);
                return;
            }
        });
    }

    pickupWeapon(player, weapon, weaponIndex) {

        if (weapon.type === 'potion') {
            this.usePotion(player);
  
            if (window.audioManager) {
                window.audioManager.playSound('healthPickup');
            }

  
            weapon.sprite.destroy();
            this.weapons.splice(weaponIndex, 1);
            return;
        }


        if (window.audioManager) {
            window.audioManager.playSound('weaponPickup');
        }
 
        if (player.weapon) {
            if (player.weapon.sprite) {
                player.weapon.sprite.destroy();
            }
        }

        player.weapon = {
            type: weapon.type,
            sprite: null
        };


        if (weapon.type === 'sword') {
            player.weapon.sprite = this.add.graphics();
            player.weapon.sprite.lineStyle(3, 0xc0c0c0);
            player.weapon.sprite.lineBetween(15, -10, 15, -25);
            player.weapon.sprite.lineStyle(5, 0x8b4513);
            player.weapon.sprite.lineBetween(15, -8, 15, -5);
            player.weapon.sprite.fillStyle(0xffd700);
            player.weapon.sprite.fillCircle(15, -5, 2);
            player.add(player.weapon.sprite);
        } else if (weapon.type === 'gun') {
            player.weapon.sprite = this.add.graphics();
      
            player.weapon.sprite.fillStyle(0x4a4a4a);
            player.weapon.sprite.fillRect(8, -3, 16, 6);
            player.weapon.sprite.lineStyle(1, 0x2a2a2a);
            player.weapon.sprite.strokeRect(8, -3, 16, 6);
    
            player.weapon.sprite.fillStyle(0x2a2a2a);
            player.weapon.sprite.fillRect(20, -2, 6, 4);

            player.weapon.sprite.fillStyle(0x654321);
            player.weapon.sprite.fillRect(8, 0, 4, 8);

            player.add(player.weapon.sprite);
        } else if (weapon.type === 'shield') {
            player.weapon.sprite = this.add.graphics();

        
            player.weapon.sprite.fillStyle(0x4169E1); // Royal blue
            player.weapon.sprite.fillEllipse(15, -2, 16, 20); // Same X as sword/gun
            player.weapon.sprite.lineStyle(2, 0x1E90FF);
            player.weapon.sprite.strokeEllipse(15, -2, 16, 20);

            player.weapon.sprite.fillStyle(0xC0C0C0); // Silver
            player.weapon.sprite.fillCircle(15, -4, 3);
            player.weapon.sprite.lineStyle(1, 0x808080);
            player.weapon.sprite.strokeCircle(15, -4, 3);

            player.weapon.sprite.lineStyle(1, 0xFFD700); // Gold trim
            player.weapon.sprite.strokeEllipse(15, -2, 14, 18);

            player.add(player.weapon.sprite);
        }

        weapon.sprite.destroy();
        this.weapons.splice(weaponIndex, 1);

        if (window.audioManager) {
            window.audioManager.playSound('buttonClick');
        }
    }

    usePotion(player) {

        const healAmount = 20;
        const maxHealth = player.stats.health;
        player.health = Math.min(player.health + healAmount, maxHealth);

        this.updateHealthBars();

        const healText = this.add.text(player.x, player.y - 40, `+${healAmount}`, {
            fontSize: '24px',
            fill: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);


        this.tweens.add({
            targets: healText,
            y: healText.y - 60,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => healText.destroy()
        });

        if (window.audioManager) {
            window.audioManager.playSound('buttonClick');
        }
    }

    fireBullet(player) {
        const bulletSpeed = 600;
        const direction = player.body.facingRight ? 1 : -1;

        const startX = player.x + (direction * 25);
        const startY = player.y - 5;

        const bullet = {
            sprite: this.add.circle(startX, startY, 3, 0x404040), 
            velocityX: direction * bulletSpeed,
            velocityY: 0,
            shooter: player,
            lifespan: 2000 
        };

        this.bullets.push(bullet);


        if (window.audioManager) {
            window.audioManager.playSound('gunShot');
        }

        const muzzleFlash = this.add.circle(startX, startY, 8, 0xffffff, 0.8);
        this.tweens.add({
            targets: muzzleFlash,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 100,
            onComplete: () => muzzleFlash.destroy()
        });
    }

    updateBullets(delta) {
        this.bullets = this.bullets.filter(bullet => {
   
            bullet.sprite.x += bullet.velocityX * (delta / 1000);
            bullet.sprite.y += bullet.velocityY * (delta / 1000);

         
            bullet.lifespan -= delta;

        
            if (bullet.sprite.x < this.arenaLeft ||
                bullet.sprite.x > this.arenaRight ||
                bullet.lifespan <= 0) {

                if (bullet.isSacrifice && !bullet.hit) {
                    this.applySacrificeMissPenalty(bullet.shooter);
                }

                bullet.sprite.destroy();
                return false;
            }

          
            if (this.platforms) {
                for (const platform of this.platforms) {
                    if (bullet.sprite.x >= platform.x &&
                        bullet.sprite.x <= platform.x + platform.width &&
                        bullet.sprite.y >= platform.y &&
                        bullet.sprite.y <= platform.y + platform.height) {

                
                        if (bullet.isSacrifice && !bullet.hit) {
                            this.applySacrificeMissPenalty(bullet.shooter);
                        }

                        this.createBulletImpact(bullet.sprite.x, bullet.sprite.y);
                        bullet.sprite.destroy();
                        return false;
                    }
                }
            }

            const target = bullet.shooter === this.player1 ? this.player2 : this.player1;
            const distance = Phaser.Math.Distance.Between(
                bullet.sprite.x, bullet.sprite.y,
                target.x, target.y
            );

            if (distance < 25) { 
   
                if (bullet.isSacrifice) {
       
                    bullet.hit = true;
                    bullet.shooter.sacrificeHit = true;
                    const baseDamage = this.calculateDamage(bullet.shooter);
                    const sacrificeDamage = baseDamage * 2;
                    this.dealDamage(target, sacrificeDamage, 'sacrifice', bullet.shooter);

                    this.cameras.main.shake(250, 0.03);
                } else {
                   
                    const damage = this.calculateDamage(bullet.shooter);
                    this.dealDamage(target, damage, 'gun', bullet.shooter);
                }

            
                this.createBulletImpact(bullet.sprite.x, bullet.sprite.y);

     
                bullet.sprite.destroy();
                return false;
            }

            return true;
        });
    }

    createBulletImpact(x, y) {

        for (let i = 0; i < 6; i++) {
            const spark = this.add.circle(
                x + Phaser.Math.Between(-5, 5),
                y + Phaser.Math.Between(-5, 5),
                2,
                0xffa500,
                0.8
            );

            this.tweens.add({
                targets: spark,
                x: spark.x + Phaser.Math.Between(-20, 20),
                y: spark.y + Phaser.Math.Between(-20, 20),
                alpha: 0,
                duration: 300,
                onComplete: () => spark.destroy()
            });
        }


        const impactFlash = this.add.circle(x, y, 15, 0xffffff, 0.6);
        this.tweens.add({
            targets: impactFlash,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 150,
            onComplete: () => impactFlash.destroy()
        });
    }

    updatePassiveAbilities(delta) {

        this.checkPassiveAbility(this.player1, delta);
        this.checkPassiveAbility(this.player2, delta);
    }

    checkPassiveAbility(player, delta) {
        if (!player || player.abilityTriggered) return;

        const healthPercent = (player.health / player.stats.health) * 100;

        if (healthPercent < 30 && healthPercent > 0) {
            player.abilityTriggered = true;

            if (player.playerData.statChoice === 'damage') {
        
                this.activateRageMode(player);
            } else if (player.playerData.statChoice === 'health') {
          
                this.activateSecondWind(player);
            }
        }
    }

    activateRageMode(player) {
        player.abilityActive = true;

     
        const rageEffect = this.time.addEvent({
            delay: 100,
            callback: () => {
                if (player.abilityActive && !this.gameEnded) {
                    const particle = this.add.circle(
                        player.x + Phaser.Math.Between(-20, 20),
                        player.y + Phaser.Math.Between(-20, 20),
                        3,
                        0xff0000,
                        0.8
                    );

                    this.tweens.add({
                        targets: particle,
                        y: particle.y - 30,
                        alpha: 0,
                        duration: 800,
                        onComplete: () => particle.destroy()
                    });
                }
            },
            repeat: -1
        });

        player.abilityEffect = rageEffect;

        const rageText = this.add.text(player.x, player.y - 80, 'RAGE MODE!', {
            fontSize: '24px',
            fill: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: rageText,
            y: rageText.y - 40,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => rageText.destroy()
        });

        if (window.audioManager) {
            window.audioManager.playSound('battleStart');
        }
    }

    activateSecondWind(player) {
        player.abilityActive = true;
        player.healingTimer = 3000; // 3 seconds of healing

        const healPerSecond = 20 / 3;
        const healInterval = this.time.addEvent({
            delay: 100, // Heal every 100ms for smooth effect
            callback: () => {
                if (player.healingTimer > 0 && player.health < player.stats.health) {
                    const healAmount = healPerSecond / 10; // Divide by 10 since we're calling every 100ms
                    player.health = Math.min(player.health + healAmount, player.stats.health);
                    this.updateHealthBars();

                    player.healingTimer -= 100;
                } else {
                    healInterval.destroy();
                }
            },
            repeat: 29 // 3 seconds = 30 * 100ms
        });

        const healEffect = this.time.addEvent({
            delay: 100,
            callback: () => {
                if (player.healingTimer > 0) {
                    const particle = this.add.circle(
                        player.x + Phaser.Math.Between(-20, 20),
                        player.y + Phaser.Math.Between(-20, 20),
                        3,
                        0x00ff00,
                        0.8
                    );

                    this.tweens.add({
                        targets: particle,
                        y: particle.y - 30,
                        alpha: 0,
                        duration: 800,
                        onComplete: () => particle.destroy()
                    });
                } else {
                    healEffect.destroy();
                }
            },
            repeat: 29
        });


        const windText = this.add.text(player.x, player.y - 80, 'SECOND WIND!', {
            fontSize: '24px',
            fill: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: windText,
            y: windText.y - 40,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => windText.destroy()
        });


        if (window.audioManager) {
            window.audioManager.playSound('healthPickup');
        }
    }

    preload() {
       
    }

    createEpicMedievalBackground() {

        const graphics = this.add.graphics();
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

      
        graphics.fillGradientStyle(0x4A90E2, 0x4A90E2, 0xFF6B35, 0xFF6B35, 1);
        graphics.fillRect(0, 0, width, height);


        graphics.fillStyle(0xF5F5DC, 0.3);
        graphics.fillEllipse(width * 0.2, height * 0.15, 80, 40);
        graphics.fillEllipse(width * 0.7, height * 0.2, 100, 50);
        graphics.fillEllipse(width * 0.9, height * 0.12, 60, 30);

        graphics.fillStyle(0x8B7D6B);
        graphics.fillRoundedRect(20, height * 0.05, width - 40, height * 0.9, 25);
        graphics.lineStyle(8, 0x5D4E37);
        graphics.strokeRoundedRect(20, height * 0.05, width - 40, height * 0.9, 25);


        graphics.fillStyle(0x9C8B7A);
        graphics.fillRoundedRect(60, height * 0.12, width - 120, height * 0.76, 15);
        graphics.lineStyle(4, 0x6B5B4A);
        graphics.strokeRoundedRect(60, height * 0.12, width - 120, height * 0.76, 15);


        for (let i = 0; i < 6; i++) {
            const colX = 100 + (i * (width - 200) / 5);
            const colY = height * 0.15;
            const columnHeight = this.groundY - colY; // Extend columns to ground level

   
            graphics.fillStyle(0x778899);
            graphics.fillRect(colX - 10, colY, 20, columnHeight);
            graphics.lineStyle(2, 0x556677);
            graphics.strokeRect(colX - 10, colY, 20, columnHeight);

            graphics.fillStyle(0x708090);
            graphics.fillRect(colX - 15, this.groundY - 20, 30, 20);

            graphics.fillStyle(0x708090);
            graphics.fillRect(colX - 18, colY - 15, 36, 15);
        }

        const floorY = this.groundY;


        graphics.fillStyle(0x8B8680);
        graphics.fillRect(0, floorY, width, height - floorY);

        const blockWidth = 40;
        const blockHeight = 20;
        for (let x = 0; x < width; x += blockWidth) {
            for (let y = floorY; y < height; y += blockHeight) {
                const offset = (Math.floor(y / blockHeight) % 2) * (blockWidth / 2);
                graphics.lineStyle(2, 0x696969);
                graphics.strokeRect(x + offset, y, blockWidth, blockHeight);
            }
        }



     
        graphics.fillStyle(0x8B0000);
        graphics.fillRect(centerX - 60, 40, 120, 100);
        graphics.lineStyle(4, 0x800000);
        graphics.strokeRect(centerX - 60, 40, 120, 100);

        graphics.lineStyle(3, 0xFFD700);
        graphics.strokeRect(centerX - 55, 45, 110, 90);

        const crownY = 110; 

        const crownTrophy = this.add.text(centerX, crownY, '🏆', {
            fontSize: '32px'
        }).setOrigin(0.5);


        graphics.fillStyle(0x8B0000);
        graphics.fillRect(centerX - 30, 125, 60, 40);
        graphics.lineStyle(2, 0x800000);
        graphics.strokeRect(centerX - 30, 125, 60, 40);

        this.createPodiumPlatforms();
    }

    createPodiumPlatforms() {
        const graphics = this.add.graphics();
        const arenaWidth = this.arenaRight - this.arenaLeft;

        const platformWidth = arenaWidth * 0.3; // 30% width each
        const middleGap = arenaWidth * 0.1; // 10% gap in middle
        const sideGap = arenaWidth * 0.05; // 5% gap on each side
        const leftPlatformX = this.arenaLeft + sideGap;
        const rightPlatformX = this.arenaRight - sideGap - platformWidth;
        const upperPlatformY = this.groundY - 120;
        const middlePlatformY = this.groundY - 200;

        
        graphics.setDepth(1);

        graphics.fillStyle(0xA0A0A0);
        graphics.fillRoundedRect(leftPlatformX, upperPlatformY, platformWidth, 25, 5);
        graphics.lineStyle(4, 0x505050);
        graphics.strokeRoundedRect(leftPlatformX, upperPlatformY, platformWidth, 25, 5);

    
        graphics.lineStyle(1, 0x5A5A5A);
        for (let i = 0; i < 3; i++) {
            const blockX = leftPlatformX + (i * platformWidth / 3);
            graphics.strokeRect(blockX, upperPlatformY, platformWidth / 3, 25);
        }
        graphics.fillStyle(0xA0A0A0);
        graphics.fillRoundedRect(rightPlatformX, upperPlatformY, platformWidth, 25, 5);
        graphics.lineStyle(4, 0x505050);
        graphics.strokeRoundedRect(rightPlatformX, upperPlatformY, platformWidth, 25, 5);

        graphics.lineStyle(1, 0x5A5A5A);
        for (let i = 0; i < 3; i++) {
            const blockX = rightPlatformX + (i * platformWidth / 3);
            graphics.strokeRect(blockX, upperPlatformY, platformWidth / 3, 25);
        }

        const middlePlatformWidth = arenaWidth * 0.25;
        const middlePlatformX = this.cameras.main.centerX - middlePlatformWidth / 2;
        graphics.fillStyle(0xA0A0A0);
        graphics.fillRoundedRect(middlePlatformX, middlePlatformY, middlePlatformWidth, 25, 5);
        graphics.lineStyle(4, 0x505050);
        graphics.strokeRoundedRect(middlePlatformX, middlePlatformY, middlePlatformWidth, 25, 5);

        // Stone block detail on middle platform
        graphics.lineStyle(1, 0x5A5A5A);
        for (let i = 0; i < 2; i++) {
            const blockX = middlePlatformX + (i * middlePlatformWidth / 2);
            graphics.strokeRect(blockX, middlePlatformY, middlePlatformWidth / 2, 25);
        }


        // Store platform positions for collision detection (adjusted for new height)
        this.platforms = [
            { x: leftPlatformX, y: upperPlatformY, width: platformWidth, height: 25 },
            { x: rightPlatformX, y: upperPlatformY, width: platformWidth, height: 25 },
            { x: middlePlatformX, y: middlePlatformY, width: middlePlatformWidth, height: 25 }
        ];

        // No hazards in default arena, but add invisible boundary walls to prevent falling off
        this.hazards = [];

        // Add invisible boundary walls (not hazards, just collision boundaries)
        this.arenaWalls = [
            { x: this.arenaLeft - 50, y: 0, width: 50, height: this.cameras.main.height }, // Left wall
            { x: this.arenaRight, y: 0, width: 50, height: this.cameras.main.height } // Right wall
        ];
    }

    createEmptyArena() {
        // Set arena bounds immediately (CRITICAL - must happen before character creation)
        this.arenaLeft = this.cameras.main.width * 0.1; // 10% from left
        this.arenaRight = this.cameras.main.width * 0.9; // 10% from right
        this.groundY = this.cameras.main.height; // No ground - players fall into void

        // Create simple background
        this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY,
            this.cameras.main.width, this.cameras.main.height, 0x87CEEB).setDepth(-100);

        // Add some clouds for atmosphere
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(50, 300);
            const cloud = this.add.ellipse(x, y, 80, 40, 0xffffff, 0.8);
            cloud.setDepth(-50);
        }

        // No platforms - completely empty
        this.platforms = [];

        // No hazards in empty arena
        this.hazards = [];
    }

    createGroundOnlyArena() {
        // Set arena bounds immediately (CRITICAL - must happen before character creation)
        this.arenaLeft = this.cameras.main.width * 0.1; // 10% from left
        this.arenaRight = this.cameras.main.width * 0.9; // 10% from right
        this.groundY = this.cameras.main.height * 0.75; // 75% down the screen

        // Create simple background
        this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY,
            this.cameras.main.width, this.cameras.main.height, 0x87CEEB).setDepth(-100);

        // Create smaller ground - only 70% of mid part
        const totalArenaWidth = this.arenaRight - this.arenaLeft;
        const actualGroundWidth = totalArenaWidth * 0.7; // 70% of the arena width
        const groundStartX = this.arenaLeft + (totalArenaWidth - actualGroundWidth) / 2; // Center the ground

        const ground = this.add.rectangle(
            groundStartX + actualGroundWidth / 2,
            this.groundY + 25,
            actualGroundWidth,
            50,
            0x8B4513
        );
        ground.setDepth(-20);


        const groundTexture = this.add.graphics();
        groundTexture.lineStyle(2, 0x654321);
        for (let i = 0; i < 7; i++) { // Reduced lines for smaller ground
            const x = groundStartX + (i * actualGroundWidth / 7);
            groundTexture.moveTo(x, this.groundY);
            groundTexture.lineTo(x, this.groundY + 50);
        }
        groundTexture.setDepth(-19);

        
        this.actualGroundLeft = groundStartX;
        this.actualGroundRight = groundStartX + actualGroundWidth;


        this.platforms = [];


        const fallDelayDistance = this.cameras.main.height * 0.15; // 15% of screen height fall delay
        const voidStartY = this.groundY + fallDelayDistance; // Start void hazards below ground level with delay

        this.hazards = [
   
            { type: 'void', x: 0, y: voidStartY, width: this.actualGroundLeft, height: this.cameras.main.height },
           
            { type: 'void', x: this.actualGroundRight, y: voidStartY, width: this.cameras.main.width - this.actualGroundRight, height: this.cameras.main.height },
         
            { type: 'void', x: 0, y: this.cameras.main.height + 100, width: this.cameras.main.width, height: 200 }
        ];


        this.arenaWalls = [];


        this.deathBoundary = this.cameras.main.height + 100;
    }

    createSpikeArena() {
        
        this.arenaLeft = this.cameras.main.width * 0.1; // 10% from left
        this.arenaRight = this.cameras.main.width * 0.9; // 10% from right
        this.groundY = this.cameras.main.height * 0.75; // 75% down the screen


        if (window.audioManager) {
            this.spikeTimer = this.time.addEvent({
                delay: 8000, // Every 8 seconds
                callback: () => {
                    window.audioManager.playSound('spikeDanger');
                },
                loop: true
            });
        }

        const bg = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY,
            this.cameras.main.width, this.cameras.main.height, 0x0D0D0D).setDepth(-100);

        const bricks = this.add.graphics();
        bricks.setDepth(-95);
        for (let y = 0; y < this.cameras.main.height; y += 40) {
            for (let x = 0; x < this.cameras.main.width; x += 60) {
                bricks.lineStyle(1, 0x333333, 0.5);
                bricks.strokeRect(x, y, 60, 40);
            }
        }

        const platformWidth = (this.arenaRight - this.arenaLeft) * 0.7; // 70% of arena width
        const platformStartX = this.arenaLeft + (this.arenaRight - this.arenaLeft - platformWidth) / 2; // Center it
        const ground = this.add.rectangle(
            platformStartX + platformWidth / 2,
            this.groundY + 25,
            platformWidth,
            50,
            0x2A2A2A
        );
        ground.setDepth(-20);

        const floorPattern = this.add.graphics();
        floorPattern.lineStyle(2, 0x1A1A1A);
        for (let x = platformStartX; x < platformStartX + platformWidth; x += 30) {
            floorPattern.moveTo(x, this.groundY);
            floorPattern.lineTo(x, this.groundY + 50);
        }
        floorPattern.setDepth(-19);

 
        this.actualGroundLeft = platformStartX;
        this.actualGroundRight = platformStartX + platformWidth;

        this.hazards = [];

        const topSpikeY = this.groundY - 200; // Only 200 pixels above ground (players jump ~400)

      
        const leftSpikeHeight = this.groundY - topSpikeY; // Height from ground to ceiling spikes
        const leftSpikes = this.add.graphics();
        leftSpikes.fillStyle(0x4A4A4A); // Steel grey for jail bars
        for (let y = topSpikeY; y < this.groundY; y += 35) {
            leftSpikes.fillTriangle(
                platformStartX - 25, y,
                platformStartX, y + 17,
                platformStartX - 25, y + 35
            );
        }
        leftSpikes.setDepth(-10);

        const rightSpikes = this.add.graphics();
        rightSpikes.fillStyle(0x4A4A4A); // Steel grey for jail bars
        for (let y = topSpikeY; y < this.groundY; y += 35) {
            rightSpikes.fillTriangle(
                platformStartX + platformWidth + 25, y,
                platformStartX + platformWidth, y + 17,
                platformStartX + platformWidth + 25, y + 35
            );
        }
        rightSpikes.setDepth(-10);

        const topSpikes = this.add.graphics();
        topSpikes.fillStyle(0x4A4A4A); // Steel grey
        for (let x = platformStartX - 25; x < platformStartX + platformWidth; x += 45) {
            topSpikes.fillTriangle(
                x, topSpikeY,
                x + 22, topSpikeY + 35,
                x + 45, topSpikeY
            );
        }
        topSpikes.setDepth(-10);

        const jailBars = this.add.graphics();
        jailBars.lineStyle(4, 0x333333);

        for (let y = topSpikeY + 40; y < this.groundY; y += 25) {
            jailBars.moveTo(this.arenaLeft + 5, y);
            jailBars.lineTo(this.arenaLeft + 15, y);
        }

        for (let y = topSpikeY + 40; y < this.groundY; y += 25) {
            jailBars.moveTo(this.arenaRight - 15, y);
            jailBars.lineTo(this.arenaRight - 5, y);
        }
        jailBars.setDepth(-9);

        const skullY = topSpikeY - 60;
        const skullX = this.cameras.main.centerX;

        const skull = this.add.graphics();
        skull.fillStyle(0xE8E8E8); // Bone white
        skull.fillCircle(skullX, skullY, 25); // Head
        skull.fillRect(skullX - 15, skullY + 10, 30, 20); // Jaw area

        skull.fillStyle(0x000000);
        skull.fillCircle(skullX - 8, skullY - 5, 6); // Left eye
        skull.fillCircle(skullX + 8, skullY - 5, 6); // Right eye

        skull.fillTriangle(skullX, skullY + 2, skullX - 4, skullY + 12, skullX + 4, skullY + 12);

        skull.fillStyle(0xE8E8E8);
        for (let i = -2; i <= 2; i++) {
            skull.fillRect(skullX + (i * 4) - 1, skullY + 18, 2, 8);
        }
        skull.setDepth(-5);


        this.hazards = [
            { type: 'spikes', x: platformStartX - 25, y: topSpikeY, width: 25, height: leftSpikeHeight }, // Left platform edge
            { type: 'spikes', x: platformStartX + platformWidth, y: topSpikeY, width: 25, height: leftSpikeHeight }, // Right platform edge
            { type: 'spikes', x: platformStartX - 25, y: topSpikeY, width: platformWidth + 50, height: 35 }, // Top ceiling over platform
            
            { type: 'void', x: this.arenaLeft, y: this.groundY + 60, width: platformStartX - this.arenaLeft, height: 200 }, // Left void
            { type: 'void', x: platformStartX + platformWidth, y: this.groundY + 60, width: this.arenaRight - (platformStartX + platformWidth), height: 200 } // Right void
        ];


        this.platforms = [];

        this.arenaWalls = [];
    }

    createLavaArena() {
        
        this.arenaLeft = this.cameras.main.width * 0.1; // 10% from left
        this.arenaRight = this.cameras.main.width * 0.9; // 10% from right
        this.groundY = this.cameras.main.height; // No ground - lava below

        if (window.audioManager && window.audioManager.sounds.lavaAmbient) {
            this.lavaAmbient = window.audioManager.sounds.lavaAmbient;
            this.lavaAmbient.start();
        }

        
        const bg = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY,
            this.cameras.main.width, this.cameras.main.height, 0x1A0000).setDepth(-100);

        const glow1 = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.height * 0.8,
            this.cameras.main.width, this.cameras.main.height * 0.4, 0x4D1A00).setDepth(-90).setAlpha(0.6);
        const glow2 = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.height * 0.9,
            this.cameras.main.width, this.cameras.main.height * 0.2, 0x660000).setDepth(-90).setAlpha(0.4);

        const smoke = this.add.graphics();
        smoke.setDepth(-85);
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(0, this.cameras.main.height * 0.7);
            smoke.fillStyle(0x330000, 0.3);
            smoke.fillCircle(x, y, Phaser.Math.Between(10, 30));
        }

     
        const lavaHeight = this.cameras.main.height * 0.3;

   
        const lava1 = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.height - lavaHeight / 2,
            this.cameras.main.width,
            lavaHeight,
            0xCC1100
        );
        lava1.setDepth(-20);

       
        this.lavaFlames = [];
        for (let i = 0; i < 10; i++) { // Reduced from 20 to 10 flames
            const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
            const baseY = this.cameras.main.height - lavaHeight;

      
            const flame = this.add.graphics();
            flame.x = x;
            flame.y = baseY;
            flame.setDepth(-15);


            this.drawFlame(flame, 0, 0, 8, 20); // Reduced size from 15,30 to 8,20

            this.tweens.add({
                targets: flame,
                y: baseY - Phaser.Math.Between(20, 40), // Reduced height from 40-80 to 20-40
                scaleX: { from: 1, to: 0.7 }, // Less dramatic scaling
                scaleY: { from: 1, to: 1.2 }, // Less dramatic scaling
                alpha: { from: 0.8, to: 0.1 }, // Start with lower alpha
                duration: Phaser.Math.Between(1200, 2000), // Slower animation
                ease: 'Sine.easeInOut', // Smoother easing
                repeat: -1,
                yoyo: false,
                delay: Phaser.Math.Between(0, 1500),
                onRepeat: () => {
                    flame.y = baseY;
                    flame.scaleX = 1;
                    flame.scaleY = 1;
                    flame.alpha = 0.8;
                    this.drawFlame(flame, 0, 0, Phaser.Math.Between(6, 10), Phaser.Math.Between(15, 25));
                }
            });

            this.lavaFlames.push(flame);
        }


        const bubbles = this.add.graphics();
        bubbles.setDepth(-16);
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(this.cameras.main.height - lavaHeight, this.cameras.main.height);
            bubbles.fillStyle(0xFF6600, 0.8);
            bubbles.fillCircle(x, y, Phaser.Math.Between(5, 15));
        }

        this.platforms = [];

        const arenaWidth = this.arenaRight - this.arenaLeft;
        const platformWidth = arenaWidth * 0.1; // Smaller platforms (10% width each)
        const platformY = this.cameras.main.height * 0.5; // Middle height

        const totalPlatformWidth = platformWidth * 4; // Total width of all platforms
        const totalGapWidth = arenaWidth * 0.85 - totalPlatformWidth; // More width for gaps between platforms
        const gapBetweenPlatforms = totalGapWidth / 3; // 3 huge gaps between 4 platforms

        const startX = this.arenaLeft + arenaWidth * 0.075; // Start closer to edge (smaller side margins)

        for (let i = 0; i < 4; i++) {
     
            const platformX = startX + (i * (platformWidth + gapBetweenPlatforms));

            const platformHeight = 20; // Reduced from 25 to 20
            const platform = this.add.rectangle(
                platformX + platformWidth / 2,
                platformY,
                platformWidth,
                platformHeight,
                0x2C1810
            );
            platform.setDepth(-10);

            const outline = this.add.graphics();
            outline.lineStyle(3, 0x660000);
            outline.strokeRect(platformX, platformY - platformHeight/2, platformWidth, platformHeight);
            outline.setDepth(-9);


            const cracks = this.add.graphics();
            cracks.lineStyle(1, 0x000000, 0.8);
            for (let j = 0; j < 3; j++) {
                const crackX = platformX + Math.random() * platformWidth;
                cracks.moveTo(crackX, platformY - platformHeight/2);
                cracks.lineTo(crackX + Math.random() * 20 - 10, platformY + platformHeight/2);
            }
            cracks.setDepth(-8);


            const glow = this.add.rectangle(
                platformX + platformWidth / 2,
                platformY + 15,
                platformWidth + 10,
                12,
                0xFF3300
            );
            glow.setDepth(-11).setAlpha(0.3);

     
            this.platforms.push({
                x: platformX,
                y: platformY - platformHeight/2,
                width: platformWidth,
                height: platformHeight
            });
        }


        this.hazards = [
            { type: 'lava', x: 0, y: this.cameras.main.height - lavaHeight, width: this.cameras.main.width, height: lavaHeight }
        ];


        this.arenaWalls = [];
    }

    checkArenaWallCollisions(player) {
        if (!this.arenaWalls || this.arenaWalls.length === 0) return;

        const playerLeft = player.body.x;
        const playerRight = player.body.x + player.body.width;
        const playerTop = player.body.y;
        const playerBottom = player.body.y + player.body.height;

        for (const wall of this.arenaWalls) {
            const wallLeft = wall.x;
            const wallRight = wall.x + wall.width;
            const wallTop = wall.y;
            const wallBottom = wall.y + wall.height;


            if (playerRight > wallLeft &&
                playerLeft < wallRight &&
                playerBottom > wallTop &&
                playerTop < wallBottom) {


                if (playerLeft < wallRight && wallLeft < this.arenaLeft) {

                    player.body.x = wallRight;
                    player.body.velocityX = Math.max(0, player.body.velocityX); // Stop leftward movement
                } else if (playerRight > wallLeft && wallLeft >= this.arenaRight) {
     
                    player.body.x = wallLeft - player.body.width;
                    player.body.velocityX = Math.min(0, player.body.velocityX); // Stop rightward movement
                }
            }
        }
    }

    drawFlame(graphics, x, y, width, height) {
        graphics.clear();


        const flameColors = [0xFF0000, 0xFF4500, 0xFF6600, 0xFFFF00];

        for (let i = 0; i < 4; i++) {
            const layerHeight = height * (1 - i * 0.2);
            const layerWidth = width * (1 - i * 0.15);

            graphics.fillStyle(flameColors[i], 0.8 - i * 0.1);

 
            graphics.beginPath();
            graphics.fillCircle(x, y, layerWidth / 2);
            graphics.fillTriangle(
                x - layerWidth / 3, y,
                x + layerWidth / 3, y,
                x, y - layerHeight
            );
        }
    }

    cleanupAmbientAudio() {

        if (this.lavaAmbient && this.lavaAmbient.stop) {
            this.lavaAmbient.stop();
            this.lavaAmbient = null;
        }

        if (this.spikeTimer) {
            this.spikeTimer.destroy();
            this.spikeTimer = null;
        }
    }
}
