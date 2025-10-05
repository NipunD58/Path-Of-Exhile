
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#0f172a',
    scene: [
        MainMenuScene,
        TournamentBracketScene,
        InstructionsScene,
        CharacterSelectionScene,
        BattleScene,
        TournamentResultsScene
    ],
    scale: {
        mode: Phaser.Scale.NONE,
        width: 1280,
        height: 720
    }
};


const tournamentData = {
    playerCount: 0,
    players: [],
    bracket: [],
    currentRound: 1,
    currentMatch: 0
};

function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}


window.onload = () => {
    try {

        if (typeof MainMenuScene === 'undefined') {
            console.error('Scene classes not loaded yet');
            setTimeout(() => window.onload(), 100);
            return;
        }

        const game = new Phaser.Game(config);
        game.registry.set('tournamentData', tournamentData);

 
        game.events.once('ready', () => {
            hideLoadingOverlay();
            
        });

    } catch (error) {
        console.error('Game failed to start:', error);
        hideLoadingOverlay();
    }
};