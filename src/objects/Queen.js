export default class Queen extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        // En supposant que le sprite 'queen' a été généré ou chargé
        super(scene, x, y, 'queen');
        
        scene.add.existing(this);
        
        // Configuration de l'interactivité
        this.setInteractive({ useHandCursor: true });
        
        // On centre l'origine pour que le scaling se fasse par le milieu
        this.setOrigin(0.5);
        this.setScale(6); // Pixel art x6 pour être bien visible
        
        // Effet de "squish" organique au survol et au clic !
        this.on('pointerdown', this.onPulsate, this);
    }

    onPulsate() {
        // Évite le spam de tween si on clique trop vite
        if (this.scene.tweens.isTweening(this)) return;

        this.scene.tweens.add({
            targets: this,
            scaleX: 6.8,
            scaleY: 5.2,
            duration: 80,
            yoyo: true,
            onComplete: () => {
                // Notifie la scène qu'une ponte a été ordonnée
                this.emit('spawn_ant');
            }
        });
    }
}
