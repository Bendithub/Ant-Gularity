export default class ResourceManager {
    constructor() {
        this.init();
        this.load();
    }

    init(preservePrestige = false) {
        this.ants = 0;       
        this.food = 10;      
        this.materials = 0;  
        this.pheromones = 0; 
        this.steel = 0;
        this.energy = 0;
        this.alcoves = 3;    
        this.stealth = 100;

        this.roles = { unassigned: 0, farmers: 0, explorers: 0, warriors: 0, scientists: 0 };
        this.buildings = { nurseries: 0, factories: 0, hiveMinds: 0 };

        this.technologies = {
            tunnels: { unlocked: false, cost: 50 },
            estomac: { unlocked: false, cost: 100 },
            chitine: { unlocked: false, cost: 250 },
            architecture: { unlocked: false, cost: 400 },
            interface: { unlocked: false, cost: 1000 },
            wifi: { unlocked: false, cost: 2000 },
            singularity: { unlocked: false, cost: 5000 }
        };

        if (!preservePrestige) {
            this.prestige = 0; 
            this.mutationPoints = 0;
            this.mutations = {
                storageLimit: false, 
                diet: false,         
                collection: false,   
                twins: false         
            };
        }
    }

    save() {
        const data = {
            ants: this.ants, food: this.food, materials: this.materials,
            pheromones: this.pheromones, steel: this.steel, energy: this.energy,
            alcoves: this.alcoves, stealth: this.stealth, prestige: this.prestige,
            roles: this.roles, buildings: this.buildings, technologies: this.technologies,
            mutationPoints: this.mutationPoints, mutations: this.mutations
        };
        localStorage.setItem('antSaveGame', JSON.stringify(data));
    }

    load() {
        const dataStr = localStorage.getItem('antSaveGame');
        if (dataStr) {
            try { Object.assign(this, JSON.parse(dataStr)); } catch(e) {}
            // Security fallback if mutations didn't exist in older saves
            if (!this.mutations) {
                this.mutationPoints = 0;
                this.mutations = { storageLimit: false, diet: false, collection: false, twins: false };
            }
        }
    }

    hardReset() {
        localStorage.removeItem('antSaveGame');
        this.init(false);
        this.save();
    }

    prestigeReset() {
        this.prestige += 1;
        this.mutationPoints += 1; // 1 Point d'ADN gagné !
        
        const savePrest = this.prestige;
        const savePts = this.mutationPoints;
        const saveMuts = { ...this.mutations };
        
        this.init(true);
        this.prestige = savePrest;
        this.mutationPoints = savePts;
        this.mutations = saveMuts;
        
        this.save();
    }

    getCaps() {
        const mult = this.mutations.storageLimit ? 2 : 1;
        return {
            food: (50 + (this.alcoves * 25)) * mult,
            materials: (50 + (this.alcoves * 25)) * mult
        };
    }

    buyMutation(mutId, cost) {
        if (this.mutations.hasOwnProperty(mutId) && !this.mutations[mutId] && this.mutationPoints >= cost) {
            this.mutationPoints -= cost;
            this.mutations[mutId] = true;
            this.save();
            return true;
        }
        return false;
    }

    buyBuilding(type) {
        if (type === 'nurseries' && this.food >= 50 && this.materials >= 50) {
            this.food -= 50;
            this.materials -= 50;
            this.buildings.nurseries += 1;
            return true;
        }
        if (type === 'factories' && this.materials >= 100) {
            this.materials -= 100;
            this.buildings.factories += 1;
            return true;
        }
        if (type === 'hiveMinds' && this.pheromones >= 500 && this.materials >= 200) {
            this.pheromones -= 500;
            this.materials -= 200;
            this.buildings.hiveMinds += 1;
            return true;
        }
        return false;
    }

    unlockTech(techId) {
        if (techId === 'singularity') return false; 
        const tech = this.technologies[techId];
        if (tech && !tech.unlocked && this.pheromones >= tech.cost) {
            this.pheromones -= tech.cost;
            tech.unlocked = true;
            if (techId === 'tunnels') this.alcoves += 3;
            return true;
        }
        return false;
    }

    spawnAnt() {
        if (this.food >= 2) {
            this.food -= 2;
            const amount = this.mutations.twins ? 2 : 1;
            this.ants += amount;
            this.roles.unassigned += amount;
            return true;
        }
        return false;
    }

    assignRole(role, amount) {
        if (this.roles.hasOwnProperty(role) && role !== 'unassigned') {
            if (amount > 0 && this.roles.unassigned >= amount) {
                this.roles.unassigned -= amount;
                this.roles[role] += amount;
                return true;
            } else if (amount < 0 && this.roles[role] >= Math.abs(amount)) {
                this.roles[role] += amount;
                this.roles.unassigned += Math.abs(amount);
                return true;
            }
        }
        return false;
    }

    getAntCount() { return this.ants; }
}
