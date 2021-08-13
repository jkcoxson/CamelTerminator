// Represents a chat job
// jkcoxson

const baseTask = require('./base');

module.exports = class chatTask extends baseTask {
    /**
     * 
     * @param {import('../minecraft')} bot 
     * @param {Object} task 
     * @param {String} task.message
     * @param {Array<String>} task.targets
     */
    constructor(bot, task) {
        super(bot, task);
        this.message = task.message;
        this.targets = task.targets;
        this.bot = bot;
    }
    message;
    targets;
    bot;

    run(lastResults) {
        if (this.message == '{results}') {
            this.message = lastResults;
        }
        return new Promise((resolve) => {
            if (this.targets.length == 0) {
                this.bot.bot.chat(this.message);
            } else {
                this.targets.forEach(target => {
                    this.bot.bot.whisper(target, this.message);
                });
            }
            resolve();
        });
    }
};