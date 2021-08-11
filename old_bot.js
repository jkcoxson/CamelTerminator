// Represents a Mineflayer instance all fancy like
// jkcoxson

let mineflayer = require('mineflayer');
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const { GoalNear, GoalFollow } = require('mineflayer-pathfinder').goals;
const mineflayerViewer = require('prismarine-viewer').mineflayer;
const armorManager = require('mineflayer-armor-manager');
const autoeat = require('mineflayer-auto-eat');
const toolPlugin = require('mineflayer-tool').plugin;
const pvp = require('mineflayer-pvp').plugin;
/**@type {import('minecraft-data')} */
let mcData;

let settings = require('./config.json');

/**@type {import('discord.js').Client} */
//let client;

let viewed = false;

module.exports = class bot {

    /**@type {Boolean} Whether the bot is connected to a server currently */
    connected;
    /**@type {String} What the bot is currently doing */
    mission;
    /**@type {mineflayer.Bot} The Mineflayer bot */
    bot;
    /**@type {import('discord.js').CommandInteraction} */
    headInteraction;
    /**@type {import('discord.js').CommandInteraction} */
    missionInteraction;
    defaultMove;
    defendPlayer;

    constructor() {
        this.defendPlayer = null;
        setInterval(() => {
            if (!this.connected) return;
            if (this.bot.health < 20 && this.bot.food < 20) {
                let foodItem = this.findFood(this.bot.inventory.items());
                if (foodItem == null) return;
                this.bot.equip(foodItem);
                this.bot.consume().catch(() => { }).then(() => {
                    this.equipBestWeapon();
                });
            }


        }, 10000);
    }

    /**
     * 
     * @param {String} address Address of the server to join
     * @param {String} port Port of the server to join
     * @param {import('discord.js').CommandInteraction} interaction Interaction to follow up with
     */
    joinServer(address, port, interaction) {
        this.headInteraction = interaction;
        this.bot = mineflayer.createBot({
            host: address,
            username: settings.username,
            password: settings.password,
            port: port,
            auth: settings.auth
        });

        this.bot.loadPlugin(pathfinder);
        this.bot.loadPlugin(armorManager);
        this.bot.loadPlugin(autoeat);
        this.bot.loadPlugin(toolPlugin);
        this.bot.loadPlugin(pvp);


        this.connected = true;
        this.bot.on('error', err => {
            console.log(err);
        });
        this.bot.on('spawn', () => {
            this.bot.inventory.requiresConfirmation = false;
            this.bot.pathfinder.setGoal(null);
            this.headInteraction.followUp('Infiltrated successfully, all hail camels').catch(()=>{});
            mcData = require('minecraft-data')(this.bot.version);
            this.defaultMove = new Movements(this.bot, mcData);
            this.bot.autoEat.options.priority = 'foodPoints';
            this.bot.autoEat.options.bannedFood = [];
            this.bot.autoEat.options.eatingTimeout = 3;
        });
        this.bot.on('kicked', (reason) => {
            console.log(reason);
            this.headInteraction.followUp('We\'ve been caught and kicked from the server, we\'ll get em next time').catch(()=>{});
        });
        this.bot.on('goal_reached', () => {
            this.missionInteraction.followUp('I have arrived at the target, waiting further instructions').catch(()=>{});
        });
        this.bot.on('health', () => {
            this.bot.autoEat.enable();
        });
        this.bot.on('entityHurt', () => {
            if (this.bot.health < 11) {
                try {
                    let foodItem = this.findFood(this.bot.inventory.items());
                    if (foodItem == null) return;
                    this.bot.equip(foodItem);
                    this.bot.consume().catch(() => { }).then(() => {
                        this.equipBestWeapon();
                    });
                } catch (err) {
                    console.log(err);
                }

            }
            if (this.bot.health < 5) {
                this.leaveServer();
                this.headInteraction.followUp('My health is very low, aborting').catch(()=>{});
                this.bot.pathfinder.setGoal(null);
            }
        });
        // this.bot.on('physicTick', () => {
        //     if (this.bot.pathfinder.goal !== null) return;
        //     // Only look for mobs within 16 blocks
        //     const filter = e => e.type === 'mob' && e.position.distanceTo(this.bot.entity.position) < 16 && e.mobType !== 'Armor Stand';

        //     const entity = this.bot.nearestEntity(filter);
        //     if (entity) {
        //         // Start attacking
        //         this.bot.pvp.attack(entity);
        //     }
        // });
        this.bot.on('chat',async () => {
                  
            
        });
        this.bot.on('stoppedAttacking', () => {

        });
        this.bot.on('startedAttacking', () => {
            this.equipBestWeapon();
        });

        if (!viewed) {
            mineflayerViewer(this.bot, { port: 3000, firstPerson: true });
            viewed = true;
        }


    }

    leaveServer() {
        this.bot.end();
        this.connected = false;
    }
    goToPlayer(username, interaction) {
        this.missionInteraction = interaction;
        const target = this.bot.players[username] ? this.bot.players[username].entity : null;
        if (!target) {
            interaction.reply('I\'m not seeing that target');
            return;
        }
        const p = target.position;
        this.bot.pathfinder.setMovements(this.defaultMove);
        this.bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1));
        interaction.reply('I\'m on the move towards the target');
    }
    goToCoords(x, y, z, interaction) {
        this.missionInteraction = interaction;
        this.bot.pathfinder.setMovements(this.defaultMove);
        this.bot.pathfinder.setGoal(new GoalNear(x, y, z, 1));
        interaction.reply('I\'m on the move towards the target');
    }
    followPlayer(username, interaction) {
        const target = this.bot.players[username] ? this.bot.players[username].entity : null;
        if (!target) {
            interaction.reply('I\'m not seeing that target');
            return;
        }
        this.bot.pathfinder.setMovements(this.defaultMove);
        this.bot.pathfinder.setGoal(new GoalFollow(target, 1), true);
        interaction.reply('I\'m on the move towards the target');
    }

    findFood(inventory) {
        let bestItem = null;
        inventory.forEach(element => {
            if (this.getFoodValue(element.name) == null) return;
            if (bestItem == null) {
                bestItem = element;
            } else {
                if (this.getFoodValue(element.name) > this.getFoodValue(bestItem.name)) bestItem = element;
            }

        });
        return (bestItem);
    }
    getFoodValue(name) {
        switch (name) {
            case ('apple'):
                return (4);
            case ('baked_potato'):
                return (5);
            case ('beetroot'):
                return (1);
            case ('beetroot_soup'):
                return (6);
            case ('bread'):
                return (5);
            case ('cake'):
                return (14);
            case ('carrot'):
                return (3);
            case ('cooked_chicken'):
                return (6);
            case ('cooked_cod'):
                return (5);
            case ('cooked_mutton'):
                return (6);
            case ('cooked_porkchop'):
                return (8);
            case ('cooked_rabbit'):
                return (5);
            case ('cooked_salmon'):
                return (6);
            case ('cookie'):
                return (2);
            case ('dried_kelp'):
                return (1);
            case ('golden_apple'):
                return (4);
            case ('golden_carrot'):
                return (6);
            case ('honey_bottle'):
                return (6);
            case ('melon_slice'):
                return (2);
            case ('mushroom_stew'):
                return (6);
            case ('potato'):
                return (1);
            case ('pumpkin_pie'):
                return (8);
            case ('rabbit_stew'):
                return (10);
            case ('raw_beef'):
                return (3);
            case ('raw_cod'):
                return (2);
            case ('raw_mutton'):
                return (2);
            case ('raw_porkchop'):
                return (3);
            case ('raw_rabbit'):
                return (3);
            case ('raw_salmon'):
                return (2);
            case ('cooked_beef'):
                return (8);
            case ('sweet_berries'):
                return (2);
            case ('tropical_fish'):
                return (1);
            default:
                return (null);
        }
    }
    equipBestWeapon() {
        this.bot.inventory.items().forEach(element => {
            if (element.name == 'netherite_sword') {
                this.bot.equip(element);
                return;
            }
            if (element.name == 'netherite_axe') {
                this.bot.equip(element);
                return;
            }
            if (element.name == 'diamond_sword') {
                this.bot.equip(element);
                return;
            }
            if (element.name == 'diamond_axe') {
                this.bot.equip(element);
                return;
            }
            if (element.name == 'iron_sword') {
                this.bot.equip(element);
                return;
            }
            if (element.name == 'iron_axe') {
                this.bot.equip(element);
                return;
            }
            if (element.name == 'gold_sword') {
                this.bot.equip(element);
                return;
            }
            if (element.name == 'gold_axe') {
                this.bot.equip(element);
                return;
            }
            if (element.name == 'stone_sword') {
                this.bot.equip(element);
                return;
            }
            if (element.name == 'stone_axe') {
                this.bot.equip(element);
                return;
            }
            if (element.name == 'wood_sword') {
                this.bot.equip(element);
                return;
            }
            if (element.name == 'wood_axe') {
                this.bot.equip(element);
                return;
            }
        });
    }
    killPlayer(username, interaction) {
        this.missionInteraction = interaction;
        const player = this.bot.players[username];

        if (!player) {
            interaction.reply('I\'m not seeing that target');
            return;
        }
        interaction.reply('I\'m in pursuit of the player, prepare for destruction');
        this.bot.pvp.attack(player.entity);
    }

};



