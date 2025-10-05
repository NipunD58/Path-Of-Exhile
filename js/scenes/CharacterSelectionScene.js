class CharacterSelectionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectionScene' });
        this.playerSelections = {};
        this.readyPlayers = new Set();
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const tournamentData = this.registry.get('tournamentData');

        if (window.audioManager) {
            window.audioManager.stopMusic();
            window.audioManager.playMusic('battleMusic');
        }

        const currentMatch = this.getCurrentMatch();
        if (!currentMatch) {
            this.scene.start('TournamentBracketScene');
            return;
        }

        this.add.text(centerX, 50, 'FORGE YOUR DESTINY', {
            fontSize: '36px',
            fill: '#ff6b6b',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centerX, 90, `Round ${tournamentData.currentRound} - Match ${tournamentData.currentMatch + 1}`, {
            fontSize: '20px',
            fill: '#ffd93d'
        }).setOrigin(0.5);


        this.add.text(centerX, 140, `${currentMatch.player1.name} VS ${currentMatch.player2.name}`, {
            fontSize: '28px',
            fill: '#3498db',
            fontStyle: 'bold'
        }).setOrigin(0.5);

    
        const leftX = Math.max(250, centerX - 350);
        const rightX = Math.min(centerX + 350, this.cameras.main.width - 250);
        this.createPlayerSelectionArea(currentMatch.player1, leftX, 'left');
        this.createPlayerSelectionArea(currentMatch.player2, rightX, 'right');

        const buttonY = this.cameras.main.height - 100;
        this.startFightButton = this.add.rectangle(centerX, buttonY, 250, 70, 0x6b7280)
            .setInteractive()
            .setStrokeStyle(3, 0x9ca3af)
            .setAlpha(0.6);

        this.startFightText = this.add.text(centerX, buttonY, 'BEGIN THE CLASH', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.6);

        this.updateStartButton();
    }

    createPlayerSelectionArea(player, x, side) {
        const y = 350;

        this.add.text(x, y - 100, player.name, {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const choices = [
            {
                key: 'damage',
                label: 'Path of Power',
                desc1: 'High damage, low health',
                desc2: 'Rage Mode: +50% damage when HP < 30%',
                color: 0xe74c3c
            },
            {
                key: 'health',
                label: 'Path of Health',
                desc1: 'High health, low damage',
                desc2: 'Second Wind: Heal 20 HP when HP < 30%',
                color: 0x27ae60
            }
        ];

        choices.forEach((choice, index) => {
            const choiceY = y + (index * 90);

            const button = this.add.rectangle(x, choiceY, 380, 80, 0x374151)
                .setInteractive()
                .setStrokeStyle(3, choice.color)
                .setAlpha(0.5);

            this.add.text(x, choiceY - 15, choice.label, {
                fontSize: '18px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.add.text(x, choiceY + 8, choice.desc1, {
                fontSize: '13px',
                fill: '#ecf0f1'
            }).setOrigin(0.5);

            this.add.text(x, choiceY + 25, choice.desc2, {
                fontSize: '12px',
                fill: '#95a5a6',
                fontStyle: 'italic'
            }).setOrigin(0.5);

   
            button.choiceKey = choice.key;
            button.choiceColor = choice.color;

            button.on('pointerdown', () => this.selectChoice(player, choice.key, button, x));
            button.on('pointerover', () => {
                if (this.playerSelections[player.id] !== choice.key) {
                    button.setAlpha(0.7);
                }
            });
            button.on('pointerout', () => {
                if (this.playerSelections[player.id] !== choice.key) {
                    button.setAlpha(0.5);
                }
            });
        });


        this.add.text(x, y + 300, 'Choose your path, warrior...', {
            fontSize: '16px',
            fill: '#95a5a6'
        }).setOrigin(0.5).setName(`ready_${player.id}`);
    }

    selectChoice(player, choice, button, playerX) {

        this.children.list.forEach(child => {
            if (child.type === 'Rectangle' && child.x === playerX && child !== button && child.choiceKey) {
                child.setFillStyle(0x374151);
                child.setAlpha(0.5);
            }
        });

        if (window.audioManager) {
            window.audioManager.playSound('pathSelect');
        }

        this.playerSelections[player.id] = choice;
        player.statChoice = choice;
        button.setFillStyle(button.choiceColor);
        button.setAlpha(1);

     
        this.readyPlayers.add(player.id);

       
        const readyText = this.children.getByName(`ready_${player.id}`);
        if (readyText) {
            readyText.setText('PATH CHOSEN!').setFill('#2ecc71');
        }

        this.updateStartButton();
    }

    updateStartButton() {
        const currentMatch = this.getCurrentMatch();
        if (!currentMatch) return;

        const bothReady = this.readyPlayers.has(currentMatch.player1.id) &&
                         this.readyPlayers.has(currentMatch.player2.id);

        if (bothReady) {
   
            this.startFightButton.setFillStyle(0xe74c3c);
            this.startFightButton.setStrokeStyle(3, 0xc0392b);
            this.startFightButton.setAlpha(1);
            this.startFightText.setAlpha(1);

         
            this.startFightButton.removeAllListeners();

            this.startFightButton.on('pointerdown', () => this.startFight());
            this.startFightButton.on('pointerover', () => this.startFightButton.setFillStyle(0xc0392b));
            this.startFightButton.on('pointerout', () => this.startFightButton.setFillStyle(0xe74c3c));
        } else {
  
            this.startFightButton.setFillStyle(0x6b7280);
            this.startFightButton.setStrokeStyle(3, 0x9ca3af);
            this.startFightButton.setAlpha(0.6);
            this.startFightText.setAlpha(0.6);

            this.startFightButton.removeAllListeners();
        }
    }

    getCurrentMatch() {
        const tournamentData = this.registry.get('tournamentData');
        const currentRound = tournamentData.bracket[tournamentData.currentRound - 1];
        return currentRound ? currentRound.matches[tournamentData.currentMatch] : null;
    }

    startFight() {

        if (window.audioManager) {
            window.audioManager.playSound('battleStart');
        }

        this.scene.start('BattleScene');
    }
}