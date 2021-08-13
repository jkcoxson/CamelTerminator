// Represents a task
// jkcoxson

const { EventEmitter } = require('events');

module.exports = class baseTask extends EventEmitter {
    constructor(bot, task) {
        super();
        this.name = task.name;
    }
    /**@type {String} */
    name;
    /**@type {Boolean} */
    defend;
    /**@type {Boolean} */
    place;
    /**@type {Boolean} */
    breakBlock;
    /**@type {import('../minecraft')} */
    bot;

};