// The Minecraft bot as an object
// jkcoxson

const settings = require('./config.json');

let mineflayer = require('mineflayer');
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const { GoalNear, GoalFollow, GoalInvert } = require('mineflayer-pathfinder').goals;
const mineflayerViewer = require('prismarine-viewer').mineflayer;
const armorManager = require('mineflayer-armor-manager');
const autoeat = require('mineflayer-auto-eat');
const toolPlugin = require('mineflayer-tool').plugin;
const pvp = require('mineflayer-pvp').plugin;
const bloodhound = require('mineflayer-bloodhound')(mineflayer);
/**@type {import('minecraft-data')} */
let mcData;

/**@type {import('./commands')} */
let commandMan;

// Import all task types
const chatTask = require('./tasks/chat');
const destroyPlayerTask = require('./tasks/destroyPlayer');
const fetchTask = require('./tasks/fetch');
const followTask = require('./tasks/follow');
const gotoCoordsTask = require('./tasks/gotoCoords');
const killMobTask = require('./tasks/killMob');



const command = require('./command');

module.exports = class minecraftBot {
    constructor(address, port, interaction, leCommandMan) {
        let add = settings.default.address;
        let por = settings.default.port;
        this.viewed = false;
        this.taskQueue = [];
        commandMan = leCommandMan;
        this.channel = interaction.channel;
        this.interaction = interaction;
        if (address !== undefined) {
            add = address;
        }
        if (port !== undefined) {
            por = port;
        }
        this.displayMission = 'None';
        this.bot = mineflayer.createBot({
            host: add,
            port: por,
            username: settings.username,
            password: settings.password,
            auth: settings.auth,
            version: settings.version
        });

        this.bot.loadPlugin(pathfinder);
        this.bot.loadPlugin(armorManager);
        this.bot.loadPlugin(autoeat);
        this.bot.loadPlugin(toolPlugin);
        this.bot.loadPlugin(pvp);
        this.bot.loadPlugin(bloodhound);

        this.bot.on('spawn', () => {
            // 1.17 hack until lib is updated
            this.bot.inventory.requiresConfirmation = false;
            if (!this.viewed) {
                mcData = require('minecraft-data')(this.bot.version);
                this.mcData = require('minecraft-data')(this.bot.version);
                this.defaultMove = new Movements(this.bot, mcData);
                mineflayerViewer(this.bot, { port: 3000, firstPerson: true });
                this.viewed = true;
                console.log('Just spawned in the server');
            }

        });
        this.bot.on('chat', (username, message) => {
            if (message.startsWith('~')) {
                if (!settings.minecraft.includes(username)) return;
                commandMan.run(new command({
                    bot: this.bot,
                    message: message,
                    source: 'minecraft',
                    username: username
                }));
            }
        });
        this.bot.on('kicked', reason => {
            console.log('Kicked: ' + reason);
        });
        this.bot.on('goal_reached', () => {
            if (!this.displayMission.startsWith('Going to ')) return;
            this.bot.chat('I have arrived at the target, waiting further instructions');
            this.displayMission == 'None';
        });
        this.bot.on('diggingCompleted', () => {
            this.equipBestWeapon();
        });
        this.bot.on('entityHurt', entity => {
            if (entity.username == this.bot.player.username) {
                if (this.bot.food > 17) return;
                if (this.bot.health > 13) return;
                let foodItem = this.findFood(this.bot.inventory.items());
                if (foodItem == null) {
                    this.equipBestWeapon();
                    return;
                }
                this.bot.equip(foodItem);
                this.bot.consume().catch(() => { }).then(() => {
                    this.equipBestWeapon();
                });
            }
        });
        this.bot.on('onCorrelateAttack', (attacker, victim) => {
            // Don't just stand around and die stupid, retaliate
            if (victim.username !== this.bot.username) return;
            if (this.bot.health > 5) {
                this.bot.pvp.attack(attacker);
            } else {
                this.bot.pvp.stop();
                this.bot.pathfinder.setGoal(new GoalInvert(new GoalFollow(attacker, 20)), true);
            }
            if (attacker.displayName == this.bot.username) {
                this.equipBestWeapon();
            }
        });
    }
    /**@type {import('mineflayer').Bot} The Mineflayer bot instance */
    bot;
    /**@type {import('discord.js').Channel} The channel that the bot was requested from */
    channel;
    /**@type {import('discord.js').CommandInteraction} Request command interaction*/
    interaction;
    /**@type {Boolean} Has the bot been originally set up yet */
    viewed;
    // TODO remove this
    displayMission;
    // Nobody knows what this does
    defaultMove;
    /**@type {import('minecraft-data')} */
    mcData;

    /**@type {Array<import('./tasks/base')>} */
    taskQueue;
    jobTitle;
    lastResults;
    taskTitle;



    // Run the test JSON to make sure the bot is working
    // todo make GitHub do this
    runTests() {
        this.taskQueue = [];
        let testJSON = require('./testJobs.json');
        this.jobTitle = testJSON.name;
        testJSON.tasks.forEach(element => {
            this.addTask(element);
        });
    }


    /**
     * Add a task from a JSON
     * @param {Object} task Task JSON object
     * @param {String} task.name
     * @param {String} task.type
     */
    addTask(task) {
        /**@type {import('./tasks/base')} */
        let toPush = this.getTaskClass(task.type);
        console.log(toPush);
        this.taskQueue.push(new toPush(this, task));
        if (this.taskQueue.length == 1) this.runTasks();
    }

    async runTasks() {
        while (this.taskQueue.length > 0) {
            this.taskTitle = this.taskQueue[0].name;
            await this.taskQueue[0].run().then((results) => {
                this.lastResults = results;
                this.taskQueue.shift();
            });
        }
    }

    cleanUp() {
        try {
            this.bot.viewer.close();
            this.bot.end();
        } catch { () => { }; }
        this.bot.removeAllListeners();
        this.bot = null;
    }

    followPlayer(username) {
        const target = this.bot.players[username] ? this.bot.players[username].entity : null;
        if (!target) {
            return ('I\'m not seeing that target');
        }
        this.bot.pathfinder.setMovements(this.defaultMove);
        this.bot.pathfinder.setGoal(new GoalFollow(target, 1), true);
        this.displayMission = 'Follow ' + username;
        return ('I\'m on the move towards the target');
    }

    goToPlayer(username) {
        this.displayMission = 'Going to ' + username;
        const target = this.bot.players[username] ? this.bot.players[username].entity : null;
        if (!target) {
            return ('I\'m not seeing that target');
        }
        const p = target.position;
        this.bot.pathfinder.setMovements(this.defaultMove);
        this.bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1));
        return ('I\'m on the move towards the target');
    }


    destroyPlayer(username) {
        this.displayMission = 'Utterly Destroy ' + username;
        const player = this.bot.players[username];
        if (!player) {
            return ('I\'m not seeing that target');
        }
        this.bot.pvp.attack(player.entity);
        this.equipBestWeapon();
        return ('I\'m in pursuit of the player, prepare for destruction');
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
            case ('enchanted_golden_apple'):
                return (100);
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

    get playerList() {
        let toSend = [];
        for (let key in this.bot.players) {
            let playPos = this.bot.players[key.toString()].entity?.position;
            let botPos = this.bot.player.entity.position;
            if (playPos?.xyDistanceTo(botPos) < 160) {
                toSend.push(key.toString());
            }
        }
        if (toSend.length == 0) toSend.push('null');
        return (toSend);
    }

    /**
     * Get the class corosponding to the name
     * @param {String} name Name in the job
     * @returns {import('./tasks/base')} A task that will be added to the list
     */
    getTaskClass(name) {
        switch (name) {
            case 'chat': {
                return (chatTask);
            }
            case 'destroyPlayer': {
                return (destroyPlayerTask);
            }
            case 'fetch': {
                return (fetchTask);
            }
            case 'follow': {
                return (followTask);
            }
            case 'gotoCoords': {
                return (gotoCoordsTask);
            }
            case 'killMob': {
                return (killMobTask);
            }

        }
    }

};