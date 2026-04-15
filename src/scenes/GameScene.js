import Queen from '../objects/Queen.js';
import GameManager from '../core/GameManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x8B0000, 1); 
        graphics.fillRect(4, 4, 8, 8);
        graphics.fillStyle(0x600000, 1); 
        graphics.fillRect(10, 6, 4, 4);
        graphics.fillStyle(0x400000, 1); 
        graphics.fillRect(0, 3, 6, 10);
        graphics.generateTexture('queen', 16, 16);
    }

    create() {
        this.gameManager = new GameManager();
        this.resources = this.gameManager.resources;

        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        this.queen = new Queen(this, centerX, centerY);
        
        this.logNotification("La partie commence. La chaleur est clémente.", "#aaaaff");

        // UI Mutations
        const modalMut = document.getElementById('modal-mutations');
        if (document.getElementById('btn-open-mutations')) {
            document.getElementById('btn-open-mutations').onclick = () => modalMut.style.display = 'block';
        }
        if (document.getElementById('btn-close-mutations')) {
            document.getElementById('btn-close-mutations').onclick = () => modalMut.style.display = 'none';
        }

        document.querySelectorAll('.btn-mutation').forEach(btn => {
            btn.onclick = (e) => {
                const mutId = e.currentTarget.dataset.mut;
                const cost = parseInt(e.currentTarget.dataset.cost);
                if (this.resources.buyMutation(mutId, cost)) {
                    this.updateDashboard();
                    this.logNotification("Code Génétique Altéré: Mutation Acquise !", "#00ff00");
                }
            };
        });

        // Hard Reset Logic
        let resetClicks = 0;
        const btnReset = document.getElementById('btn-hard-reset');
        if (btnReset) {
            btnReset.onclick = () => {
                resetClicks++;
                if (resetClicks >= 2) {
                    this.resources.hardReset();
                    window.location.reload();
                } else {
                    btnReset.innerText = "Êtes-vous sûr ? (Recliquez)";
                    btnReset.style.backgroundColor = "#ff0000";
                    btnReset.style.color = "#ffffff";
                    setTimeout(() => {
                        resetClicks = 0;
                        btnReset.innerText = "Réinitialisation Complète";
                        btnReset.style.backgroundColor = "#3b1111";
                        btnReset.style.color = "#ffaaaa";
                    }, 3000);
                }
            };
        }

        // UI HTML Logique des Rôles (Boutons +/-)
        document.querySelectorAll('.btn-role').forEach(btn => {
            btn.onclick = (e) => {
                const role = e.target.dataset.role;
                const val = parseInt(e.target.dataset.val);
                if (this.resources.assignRole(role, val)) {
                    this.updateDashboard();
                }
            };
        });

        // Arbre technologique
        document.querySelectorAll('.btn-tech').forEach(btn => {
            btn.onclick = (e) => {
                const techId = e.currentTarget.dataset.tech;
                
                if (techId === 'singularity') {
                    if (this.resources.pheromones >= 5000 && this.resources.steel >= 100 && this.resources.energy >= 100) {
                        this.cameras.main.flash(2000, 255, 255, 255);
                        this.logNotification("🧬 L'ESPRIT FUSIONNE AVEC LA MATRICE... TRANSCENDANCE EN COURS... 🧬", "#ff00ff");
                        setTimeout(() => {
                            this.resources.prestigeReset();
                            window.location.reload();
                        }, 2500);
                    } else {
                        this.showFloatingText("Ressources manquantes !", this.queen.x, this.queen.y - 80, '#ff0000');
                    }
                    return;
                }

                if (this.resources.unlockTech(techId)) {
                    this.updateDashboard();
                    this.logNotification("Nouvelle Technologie Déverrouillée !", "#d8b2d8");
                }
            };
        });

        // Bâtiments
        document.querySelectorAll('.btn-build').forEach(btn => {
            btn.onclick = (e) => {
                const buildType = e.currentTarget.dataset.build;
                if (this.resources.buyBuilding(buildType)) {
                    this.updateDashboard();
                    this.logNotification("Nouveau Bâtiment Opérationnel !", "#aaaaff");
                } else {
                    this.showFloatingText("Ressources...", this.queen.x, this.queen.y - 80, '#ff0000');
                }
            };
        });

        // Reine (Clic)
        this.queen.on('spawn_ant', () => {
            if (this.resources.ants >= this.resources.alcoves * 5) {
                this.showFloatingText("Réseau Plein !", this.queen.x, this.queen.y - 60, '#ffaa00');
            } else if (this.resources.spawnAnt()) {
                this.updateDashboard();
                this.showFloatingText("-2🍎 | +1🐜", this.queen.x, this.queen.y - 60, '#00ff00');
            } else {
                this.showFloatingText("Faim...", this.queen.x, this.queen.y - 60, '#ff0000');
            }
        });

        this.updateDashboard();
    }

    update(time, delta) {
        const tickResult = this.gameManager.update(time, delta);
        if (tickResult.ticked) {
            this.updateDashboard();
            
            // Check surplus
            if (tickResult.foodSurplus && (!this.lastFoodSur || time - this.lastFoodSur > 6000)) {
                this.logNotification("Les greniers débordent ! Vous perdez des 🍎.", "#ffaa00");
                this.lastFoodSur = time;
            }
            if (tickResult.matSurplus && (!this.lastMatSur || time - this.lastMatSur > 6000)) {
                this.logNotification("Entrepôts pleins. Les exploratrices s'arrêtent.", "#ffaa00");
                this.lastMatSur = time;
            }

            // Check attaques
            if (tickResult.event === 'human_attack') {
                this.showFloatingText("MASCCCCCACRE !", this.cameras.main.centerX, this.cameras.main.centerY - 50, '#ff0000', 40);
                this.cameras.main.flash(800, 255, 0, 0);
                this.logNotification("L'Humain vous a repéré. Panique Générale.", "#ff0000");
            }
        }
    }

    updateDashboard() {
        const caps = this.resources.getCaps();
        const rates = this.gameManager.lastRates;
        
        const presElem = document.getElementById('prestige-display');
        if (presElem && this.resources.prestige > 0) {
            presElem.innerText = `[Niveau de Singularité : ${this.resources.prestige}]`; // Le bonus prod a été retiré logiquement
        }

        const formatRate = (id, val) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (val > 0) { el.innerText = `(+${val}/s)`; el.className = 'rate pos'; }
            else if (val < 0) { el.innerText = `(${val}/s)`; el.className = 'rate neg'; }
            else { el.innerText = `(0/s)`; el.className = 'rate neu'; }
        };

        document.getElementById('r-ants').innerText = this.resources.ants;
        formatRate('rt-ants', rates.ants);
        document.getElementById('r-alcoves').innerText = this.resources.alcoves;
        
        document.getElementById('r-food').innerText = Math.floor(this.resources.food);
        document.getElementById('c-food').innerText = caps.food;
        formatRate('rt-food', rates.food);
        
        document.getElementById('r-mat').innerText = Math.floor(this.resources.materials);
        document.getElementById('c-mat').innerText = caps.materials;
        formatRate('rt-mat', rates.materials);
        
        const phe = document.getElementById('r-phero');
        if (phe) { phe.innerText = Math.floor(this.resources.pheromones); formatRate('rt-phero', rates.pheromones); }
        
        const stl = document.getElementById('r-steel');
        if (stl) { stl.innerText = Math.floor(this.resources.steel); formatRate('rt-steel', rates.steel); }
        
        const nrg = document.getElementById('r-energy');
        if (nrg) { nrg.innerText = Math.floor(this.resources.energy); formatRate('rt-energy', rates.energy); }

        document.getElementById('role-unassigned').innerText = this.resources.roles.unassigned;
        document.getElementById('role-farmers').innerText = this.resources.roles.farmers;
        document.getElementById('role-explorers').innerText = this.resources.roles.explorers;
        document.getElementById('role-warriors').innerText = this.resources.roles.warriors;
        document.getElementById('role-scientists').innerText = this.resources.roles.scientists;

        // Affichage des Boutons +10/-10
        const display10 = this.resources.ants >= 100 ? 'flex' : 'none';
        document.querySelectorAll('.btn-role-10').forEach(btn => {
            btn.style.display = display10;
        });

        // Technologies UI
        const techs = this.resources.technologies;
        Object.keys(techs).forEach(techId => {
            const btn = document.getElementById('tech-' + techId);
            if (!btn) return;
            if (techs[techId].unlocked) {
                btn.classList.add('unlocked');
                btn.disabled = true;
                btn.innerHTML = btn.innerHTML.split('<br>')[0] + '<br><span class="cost">Déverrouillé</span>';
            } else if (this.resources.pheromones < techs[techId].cost) {
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        });

        // Batiments UI
        const nur = document.getElementById('b-nurseries');
        if (nur) nur.innerText = this.resources.buildings.nurseries;
        const fac = document.getElementById('b-factories');
        if (fac) fac.innerText = this.resources.buildings.factories;
        const hv = document.getElementById('b-hives');
        if (hv) hv.innerText = this.resources.buildings.hiveMinds;

        // Stealth UI
        const st_elem = document.getElementById('r-stealth');
        if (st_elem) {
            const stealth = this.resources.stealth;
            st_elem.innerText = stealth;
            const fill = document.getElementById('stealth-fill');
            fill.style.width = stealth + '%';
            fill.style.backgroundColor = stealth > 60 ? '#00ff00' : (stealth > 30 ? '#ffaa00' : '#ff0000');
        }

        // Mutations UI
        const btnOpenMut = document.getElementById('btn-open-mutations');
        if (btnOpenMut && this.resources.prestige > 0) {
            btnOpenMut.style.display = 'block';
            document.getElementById('r-dna').innerText = this.resources.mutationPoints;
            
            const muts = this.resources.mutations;
            document.querySelectorAll('.btn-mutation').forEach(btn => {
                const mutId = btn.dataset.mut;
                const cost = parseInt(btn.dataset.cost);
                if (muts[mutId]) {
                    btn.classList.add('unlocked');
                    btn.disabled = true;
                    btn.innerHTML = btn.innerHTML.split('<br>')[0] + '<br><span class="cost">Acquis ✅</span>';
                } else if (this.resources.mutationPoints < cost) {
                    btn.disabled = true;
                } else {
                    btn.disabled = false;
                }
            });
        }
    }

    logNotification(msg, color='#fff') {
        const feed = document.getElementById('feed-log');
        if (!feed) return;
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.style.borderLeftColor = color;
        const time = new Date().toLocaleTimeString('fr-FR', {hour12: false});
        entry.innerHTML = `<span style="color:#aaa; font-size:9px;">[${time}]</span> <span style="color:${color}">${msg}</span>`;
        feed.prepend(entry);
        
        while (feed.children.length > 20) {
            feed.removeChild(feed.lastChild);
        }
    }

    showFloatingText(msg, x, y, color, size=18) {
        const floatText = this.add.text(x, y, msg, {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: size + 'px',
            fill: color,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatText,
            y: y - 50,
            alpha: 0,
            duration: 900,
            ease: 'Power1',
            onComplete: () => floatText.destroy()
        });
    }
}
