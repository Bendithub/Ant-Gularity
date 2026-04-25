import ResourceManager from './ResourceManager.js';

export default class GameManager {
    constructor() {
        this.resources = new ResourceManager();
        this.tickRate = 1000;
        this.lastTick = 0;
        this.tickCount = 0;
        this.lastRates = { ants: 0, food: 0, materials: 0, pheromones: 0, steel: 0, energy: 0 };
    }

    update(time, delta) {
        this.lastTick += delta;
        if (this.lastTick >= this.tickRate) {
            const result = this.processTick();
            this.lastTick -= this.tickRate;
            return { ticked: true, ...result };
        }
        return { ticked: false };
    }

    processTick() {
        const res = this.resources;
        
        // Snapshot avant tick
        const startAnts = res.ants;
        const startFood = res.food;
        const startMats = res.materials;
        const startPhero = res.pheromones;
        const startSteel = res.steel;
        const startEnergy = res.energy;

        let eventTriggered = false;
        let foodSurplus = false;
        let matSurplus = false;
        
        // Modificateurs de Tech
        let farmerMult = res.technologies.chitine.unlocked ? 2 : 1;
        let explorerMult = res.technologies.architecture.unlocked ? 2 : 1;
        let consumptionReduction = res.technologies.estomac.unlocked ? 0.8 : 1.0;
        
        // Modificateurs de Mutations (Persistantes)
        if (res.mutations.diet) consumptionReduction *= 0.5;
        if (res.mutations.collection) explorerMult *= 2;

        const scientistMult = res.technologies.interface.unlocked ? 3 : 1;
        const factoryPhero = res.buildings.factories * 5;
        const hiveEnergy = res.technologies.wifi.unlocked ? res.buildings.hiveMinds * 2 : 0;

        // Auto-Ponte via les Nurseries
        let eggsHatched = 0;
        for (let i = 0; i < res.buildings.nurseries; i++) {
            if (res.spawnAnt()) {
                eggsHatched++;
            }
        }

        // 1. Production
        res.food += res.roles.farmers * farmerMult;
        res.materials += res.roles.explorers * explorerMult;
        res.pheromones += (res.roles.scientists * scientistMult) + factoryPhero;

        // Effets Tier 3 Wifi
        if (res.technologies.wifi.unlocked) {
            let steelMult = res.mutations.collection ? 2 : 1;
            res.steel += (res.roles.explorers * 1) * steelMult;
            res.energy += hiveEnergy;
        }

        // Assainissement des décimales
        res.food = Math.floor(res.food);
        res.materials = Math.floor(res.materials);
        res.pheromones = Math.floor(res.pheromones);
        res.steel = Math.floor(res.steel);
        res.energy = Math.floor(res.energy);

        // Auto-save toutes les 5 secondes (5 ticks)
        this.tickCount = (this.tickCount || 0) + 1;
        if (this.tickCount >= 5) {
            res.save();
            this.tickCount = 0;
        }

        // Limites (caps)
        const caps = res.getCaps();
        if (res.food > caps.food) { res.food = caps.food; foodSurplus = true; }
        if (res.materials > caps.materials) { res.materials = caps.materials; matSurplus = true; }

        // 2. Consommation
        let consumption = (Math.max(0, res.ants - 1) * 0.1) * consumptionReduction;
        consumption = Math.ceil(consumption);
        res.food -= consumption;

        // 3. Famine
        if (res.food < 0) {
            const starved = Math.min(res.ants, Math.abs(res.food));
            res.ants -= starved;
            res.food = 0;
            
            let remainingToKill = starved;
            if (res.roles.unassigned >= remainingToKill) {
                res.roles.unassigned -= remainingToKill;
            } else {
                remainingToKill -= res.roles.unassigned;
                res.roles.unassigned = 0;
                const roleKeys = Object.keys(res.roles).filter(k => k !== 'unassigned');
                for (let k of roleKeys) {
                    if (remainingToKill <= 0) break;
                    const took = Math.min(res.roles[k], remainingToKill);
                    res.roles[k] -= took;
                    remainingToKill -= took;
                }
            }
        }

        // 4. Discrétion et Industrialisation
        let stealthDamage = res.buildings.factories * 1 + res.buildings.hiveMinds * 2;
        let stealthRegen = res.roles.warriors * 5; // Augmented to better compensate
        
        res.stealth += stealthRegen;
        res.stealth -= stealthDamage;
        
        if (res.stealth > 100) {
            res.stealth = 100;
        } else if (res.stealth <= 0) {
            this.triggerHumanAttack(res);
            eventTriggered = true;
            res.stealth = 100;
        }

        this.lastRates = {
            ants: res.ants - startAnts,
            food: res.food - startFood,
            materials: res.materials - startMats,
            pheromones: res.pheromones - startPhero,
            steel: res.steel - startSteel,
            energy: res.energy - startEnergy
        };

        return { event: eventTriggered ? 'human_attack' : null, foodSurplus, matSurplus, rates: this.lastRates };
    }

    triggerHumanAttack(res) {
        res.ants = Math.floor(res.ants * 0.5);
        res.food = Math.floor(res.food * 0.3);
        
        res.roles = {
            unassigned: res.ants,
            farmers: 0,
            explorers: 0,
            warriors: 0,
            scientists: 0
        };
    }
}
