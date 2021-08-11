// Camel Terminator - All hail Camels o7
// jkcoxson

const Discord = require('discord.js');
const settings = require('./config.json');
const commandManJs = require('./commands');
const command = require('./command');

console.log('#######################');
console.log('### CamelTerminator ###');
console.log('###    jkcoxson     ###');
console.log('#######################\n');

let client = new Discord.Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MEMBERS]
});

const commandMan = new commandManJs(client);

client.login(settings.token).then(() => {
    console.log('Logged in as ' + client.user.username);
});

client.on('messageCreate', message => {
    if (message.author == client.user) return;
    if (message.content == 'o7') {
        message.channel.send('o7');
    }
});

client.on('ready', () => {
    client.guilds.cache.forEach(guild => {
        commandMan.createCommands(guild);
    });
});

client.on('interactionCreate', interaction => {
    if (!settings.discord.includes(interaction.member.user.id)) {
        interaction.reply('You aren\'t an authorized user');
    }
    commandMan.run(
        new command({
            source: 'discord',
            CommandInteraction: interaction
        })
    );

});


