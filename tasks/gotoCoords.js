// Represents a chat job
// jkcoxson

const { GoalNear } = require('mineflayer-pathfinder').goals;

const baseTask = require('./base');

module.exports = class chatTask extends baseTask {
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
        this.breakBlock = task.break;
        this.place = task.place;
        this.x = task.x;
        this.y = task.y;
        this.z = task.z;
        this.bot = bot;
    }
    x;
    y;
    z;
    run() {
        this.bot.bot.pathfinder.movements.canDig = this.breakBlock;
        if (!this.place) {
            this.bot.bot.pathfinder.movements.scafoldingBlocks = [];
        }
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            this.bot.bot.pathfinder.setMovements(this.bot.defaultMove);
            let loop = true;
            while (loop) {
                await this.bot.bot.pathfinder.goto(new GoalNear(this.x, this.y, this.z, 1), () => {
                    if (Math.abs(this.bot.bot.entity.position.x - this.x) < 1 && Math.abs(this.bot.bot.entity.position.z - this.z) < 1) {
                        this.bot.bot.pathfinder.movements.canDig = true;
                        this.bot.bot.pathfinder.movements.scafoldingBlocks = [
                            this.bot.mcData.blocksByName.dirt.id,
                            this.bot.mcData.blocksByName.cobblestone.id
                        ];
                        resolve();
                    }
                }).catch(() => {
                    reject();
                });
            }

        });
    }
};