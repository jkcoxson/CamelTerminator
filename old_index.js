// jkcoxson

let settings = require('./config.json');
let Discord = require('discord.js');
let botJs = require('./old_bot');
/**@type {botJs} */
let bot;
let client = new Discord.Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MEMBERS]
});

client.login(settings.token);





client.on('ready', () => {
    bot = new botJs();
    client.guilds.cache.forEach(guild => {
        guild.commands.create(
            {
                'name': 'join',
                'description': 'Tell me what server to join',
                'options': [
                    {
                        'name': 'address',
                        'description': 'Address of the server to join',
                        'required': true,
                        'type': 'STRING'
                    },
                    {
                        'name': 'port',
                        'description': 'Port of the server to join',
                        'required': true,
                        'type': 'INTEGER'
                    }
                ]
            }
        );
        guild.commands.create({
            'name': 'abort',
            'description': 'Abort the mission'
        });
        guild.commands.create({
            'name': 'goto',
            'description': 'Go to a player or coordinate',
            'options': [
                {
                    'name': 'player',
                    'type': 'SUB_COMMAND',
                    'description': 'The username of the player to go to',
                    'options': [
                        {
                            'name': 'username',
                            'type': 'STRING',
                            'required': true,
                            'description': 'The username of the player to go to'
                        }
                    ]
                },
                {
                    'name': 'coord',
                    'type': 'SUB_COMMAND',
                    'description': 'The coordinate of the player to go to',
                    'options': [
                        {
                            'name': 'x',
                            'type': 'INTEGER',
                            'required': true,
                            'description': 'Coord to go to'
                        },
                        {
                            'name': 'y',
                            'type': 'INTEGER',
                            'required': true,
                            'description': 'Coord to go to'
                        },
                        {
                            'name': 'z',
                            'type': 'INTEGER',
                            'required': true,
                            'description': 'Coord to go to'
                        }
                    ]
                }
            ]
        });
        guild.commands.create({
            'name': 'follow',
            'description': 'Follow a player around',
            'options': [
                {
                    'name': 'username',
                    'type': 'STRING',
                    'required': true,
                    'description': 'Username of the player'
                }
            ]
        });
        guild.commands.create({
            'name': 'destroy',
            'description': 'Destroy a player from off the face of the earth',
            'options': [
                {
                    'name': 'username',
                    'type': 'STRING',
                    'required': true,
                    'description': 'Username of the player'
                }
            ]
        });
    });
});


client.on('interactionCreate', interaction => {
    if (!interaction.isCommand()) return;
    switch (interaction.command.name) {
        case ('join'):
            bot.joinServer(interaction.options.get('address').value, interaction.options.get('port').value.toString(), interaction);
            interaction.reply('Yeeting myself over to the server');
            break;
        case ('abort'):
            if (bot.connected) {
                bot.leaveServer();
                interaction.reply('Mission aborted, we\'ll get em next time bois');
                bot = null;
                bot = new botJs();
            } else {
                interaction.reply('We aren\'t infiltrating any server yet');
            }
            break;
        case ('goto'):
            if (interaction.options.getSubcommand() == 'player') {
                bot.goToPlayer(interaction.options.get('username').value, interaction);
            }
            if (interaction.options.getSubcommand() == 'coord') {
                bot.goToCoords(parseInt(interaction.options.get('x').value), parseInt(interaction.options.get('y').value), parseInt(interaction.options.get('z').value), interaction);
            }
            break;
        case ('follow'):
            bot.followPlayer(interaction.options.get('username').value, interaction);
            break;
        case ('destroy'):
            bot.killPlayer(interaction.options.get('username').value, interaction);
            break;
    }
});

client.on('messageCreate', message => {
    if (message.author.bot) return;
    if (message.content == 'o7') {
        message.channel.send('o7');
    }
});

