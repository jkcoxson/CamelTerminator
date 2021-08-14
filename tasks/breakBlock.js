// Represents a break block job
// jkcoxson



const baseTask = require('./base');
const goToTask = require('./gotoBlock');
const Vec3 = require('vec3').Vec3;


module.exports = class breakBlockTask extends baseTask {
    /**
     * 
     * @param {import('../minecraft')} bot 
     * @param {Object} task 
     * @param {Boolean} task.break
     * @param {Boolean} task.place
     * @param {Number} task.x
     * @param {Number} task.y
     * @param {Number} task.z
     */
    constructor(bot, task) {
        super(bot, task);
        this.x = task.x;
        this.y = task.y;
        this.z = task.z;
        this.bot = bot;
    }
    x;
    y;
    z;
    run() {
        return new Promise((resolve) => {
            let goto = new goToTask(this.bot, {
                'break': true,
                'place': true,
                'x': this.x,
                'y': this.y,
                'z': this.z
            });
            goto.run().then(() => {
                this.bot.bot.lookAt(new Vec3(this.x, this.y, this.z)).then(() => {
                    this.bot.bot.dig(this.bot.bot.blockAt(new Vec3(this.x, this.y, this.z))).then(() => {
                        resolve();
                    });
                });

            });
        });
    }
};