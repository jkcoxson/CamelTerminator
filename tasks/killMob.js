// Represents a chat job
// jkcoxson

const baseTask = require('./base');

module.exports = class chatTask extends baseTask {
    constructor(bot, task) {
        super(bot, task);
    }
};