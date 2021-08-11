// Represents a command, cool story bro
// jkcoxson

module.exports = class command {
    /**
     * @param {Object} options 
     * @param {String} options.source 'discord' | 'minecraft'
     * @param {import('discord.js').CommandInteraction} options.CommandInteraction Command interaction
     * @param {import('mineflayer').Bot} options.bot Bot to chat back to
     * @param {String} options.username Username of the Minecraft player
     * @param {String} options.message The message of the command
     */
    constructor(options) {
        this.source = options.source;
        if (this.source == 'discord') {
            this.interaction = options.CommandInteraction;
            this.commandName = options.CommandInteraction.commandName;
            this.args = [];
            options.CommandInteraction.options.data.forEach(option => {
                this.args.push(option.value);
            });
        }
        if (this.source == 'minecraft') {
            this.bot = options.bot;
            this.username = options.username;
            this.message = options.message;
            this.args = options.message.split(' ');
            this.commandName = this.args.shift();
            // only replace the first ~
            this.commandName = this.commandName.replace('~', '');
        }


    }
    /**@type {String} */
    source;
    /**@type {import('discord.js').CommandInteraction} */
    interaction;
    /**@type {import('mineflayer').Bot} */
    bot;
    /**@type {String} */
    username;
    /**@type {String} */
    message;
    /**@type {String} */
    commandName;
    /**@type {Array<String>} */
    args;

    reply(message) {
        if (this.source == 'discord') this.interaction.reply(message).catch(() => { });
        if (this.source == 'minecraft') {
            let messageSplit = message.split('\n');
            let that = this;
            messageSplit.forEach((msg, index) => {
                setTimeout(function () {
                    that.bot.whisper(that.username, msg);
                }, index * 800);
            });

        }
    }


};
