// Represents a killMob job
// jkcoxson

const baseTask = require('./base');

module.exports = class chatTask extends baseTask {
    constructor(bot, task) {
        super(bot, task);
    }
    run() {
        return new Promise((resolve, reject) => {
            let found = false;
            // eslint-disable-next-line no-unused-vars
            for (const [key, value] of Object.entries(this.bot.bot.entities)) {
                if (value.name == this.task.mob) {
                    found = value;
                }
            }
            if (found == false) {
                reject();
            }
            this.bot.bot.pvp.attack(found);
            let that = this;
            /**
             * 
             * @param {import('prismarine-entity').Entity} entity 
             */
            let onDead = function (entity) {
                if (entity.name == found.name) {
                    if (entity.position.distanceTo(that.bot.bot.entity.position) > 10) return;
                    that.bot.bot.removeListener('entityDead', onDead);
                    resolve();
                }
            };
            this.bot.bot.on('entityDead', onDead);
        });
    }
};