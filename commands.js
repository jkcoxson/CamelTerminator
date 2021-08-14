// Command Manager for Camel Terminator
let minecraftJs = require('./minecraft');
let settings = require('./config.json');
module.exports = class commandMan {
    constructor() {
        this.bot = null;
    }
    /**@type {minecraftJs} */
    bot;






    /**
     * Create the commands for a specific guild
     * @param {import('discord.js').Guild} guild 
     */
    createCommands(guild) {
        guild.commands.create({
            name: 'join',
            description: 'Join a specific Minecraft server',
            options: [
                {
                    name: 'server',
                    description: 'The server to join',
                    type: 'STRING',
                    required: true,
                    choices: this.serverList
                }
            ]
        });
        guild.commands.create({
            name: 'leave',
            description: 'Leave the current server, destroy the connection'
        });
        guild.commands.create({
            name: 'status',
            description: 'Get the bot\'s status'
        });
        guild.commands.create({
            name: 'inventory',
            description: 'Get what\'s in the bot\'s inventory'
        });
        guild.commands.create({
            name: 'drop',
            description: 'Drop an item from the bot\'s inventory',
            options: [
                {
                    name: 'item',
                    description: 'Item to drop',
                    type: 'STRING',
                    required: true
                }
            ]
        });
        guild.commands.create({
            name: 'stop',
            description: 'Stop doing whatever the bot is doing'
        });
        guild.commands.create({
            name: 'idle',
            description: 'Stop the current job, but still let the bot do background tasks'
        });
        guild.commands.create({
            name: 'follow',
            description: 'Blindly follow a player',
            options: [
                {
                    name: 'username',
                    description: 'Username of the player to follow',
                    type: 'STRING',
                    required: true,
                }
            ]
        });
        guild.commands.create({
            name: 'goto',
            description: 'Go to a specific spot in the world',
            options: [
                {
                    name: 'player',
                    description: 'Go to a player',
                    type: 'SUB_COMMAND',
                    options: [
                        {
                            name: 'username',
                            description: 'Username of the player',
                            type: 'STRING',
                            required: true
                        }
                    ]
                },
                {
                    name: 'coords',
                    description: 'Go to a specific coordinate',
                    type: 'SUB_COMMAND',
                    options: [
                        {
                            name: 'x',
                            description: 'X coordinate',
                            type: 'INTEGER',
                            required: true
                        },
                        {
                            name: 'y',
                            description: 'Y coordinate',
                            type: 'INTEGER',
                            required: true
                        },
                        {
                            name: 'z',
                            description: 'Z coordinate',
                            type: 'INTEGER',
                            required: true
                        }
                    ]
                }
            ]
        });
        guild.commands.create({
            name: 'fetch',
            description: 'Fetch an item or block from the surrounding area',
            options: [
                {
                    name: 'name',
                    description: 'Name of the item to fetch from a chest or the area',
                    required: true,
                    type: 'STRING'
                },
                {
                    name: 'count',
                    description: 'How many to fetch',
                    required: false,
                    type: 'INTEGER'
                }
            ]
        });
        guild.commands.create({
            name: 'food',
            description: 'Go kill animals for food around the area',
            options: [
                {
                    name: 'animal',
                    description: 'Which animal to kill for food (default all animals)',
                    required: false,
                    type: 'STRING',
                    choices: [
                        {
                            name: 'cow',
                            value: 'cow'
                        },
                        {
                            name: 'chicken',
                            value: 'chicken'
                        },
                        {
                            name: 'pig',
                            value: 'pig'
                        },
                        {
                            name: 'sheep',
                            value: 'sheep'
                        }
                    ]
                }
            ]
        });
        guild.commands.create({
            name: 'sleep',
            description: 'Go find a bed and sleep'
        });
        guild.commands.create({
            name: 'players',
            description: 'List all players that the bot can see'
        });
        guild.commands.create({
            name: 'destory',
            description: 'Kill a player',
            options: [
                {
                    name: 'player',
                    description: 'The username of the player to destroy',
                    required: true,
                    type: 'STRING'
                }
            ]
        });
        guild.commands.create({
            name: 'defend',
            description: 'Walk with and defend a player',
            options: [
                {
                    name: 'username',
                    description: 'Username of the player to defend',
                    type: 'STRING'
                }
            ]
        });

    }

    /**
     * 
     * @param {import('./command')} command 
     */
    run(command) {
        switch (command.commandName) {
            case 'join': {
                if (this.bot !== null) {
                    command.reply('I\'m already in a server');
                    return;
                }
                // Join the specified server or default if none specified
                if (command.args.length == 0) {
                    this.bot = new minecraftJs(undefined, undefined, command.interaction, this);
                } else {
                    let address = JSON.parse(command.args[0]).address;
                    let port = JSON.parse(command.args[0]).port;
                    this.bot = new minecraftJs(address, port, command.interaction, this);
                }
                command.reply('Yeeing myself over to the server now');
                break;
            }
            case 'leave': {
                command.reply('Cleaning up and leaving');
                this.bot.cleanUp();
                this.bot = null;
                break;
            }
            case 'status': {
                let toSend = '__Status__\n';
                if (this.bot.taskQueue.length > 0) {
                    toSend += 'Current Job: ' + this.bot.jobTitle + '\n';
                    toSend += 'Current Task: ' + this.bot.taskQueue[0].name + '\n';
                }
                toSend += 'Tasks in queue: ' + this.bot.taskQueue.length + '\n';
                toSend += 'Health: ' + this.bot.bot.health + '\n';
                toSend += 'Food: ' + this.bot.bot.food + '\n';
                toSend += 'Position: ' + Math.round(this.bot.bot.entity.position.x) + ', ' + Math.round(this.bot.bot.entity.position.y) + ', ' + Math.round(this.bot.bot.entity.position.z);
                command.reply(toSend);
                break;
            }
            case 'test': {
                this.bot.runTests();
                break;
            }
            case 'chat': {
                this.bot.bot.chat(command.args.join(' '));
                command.reply('Sent');
            }

        }
    }
    get serverList() {
        let toSend = [];
        settings.servers.forEach(server => {
            toSend.push({
                'name': server.name,
                'value': JSON.stringify(server)
            });
        });
        return (toSend);
    }
};