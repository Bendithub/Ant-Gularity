import GameScene from './scenes/GameScene.js';

window.onload = () => {
    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: 800,
        height: 600,
        backgroundColor: '#2b1b1a',
        pixelArt: true, // Très important pour le style "Crisp"
        scene: [GameScene]
    };

    const game = new Phaser.Game(config);
};
