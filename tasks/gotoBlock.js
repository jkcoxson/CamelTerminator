// Represents a chat job
// jkcoxson

const { GoalGetToBlock } = require('mineflayer-pathfinder').goals;

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

        return new Promise((resolve) => {
            this.bot.bot.pathfinder.setMovements(this.bot.defaultMove);
            this.bot.bot.pathfinder.setGoal(new GoalGetToBlock(this.x, this.y, this.z));
            let that = this;
            const goalReached = function () {
                if (Math.abs(that.bot.bot.entity.position.x - that.x) < 1 && Math.abs(that.bot.bot.entity.position.z - that.z) < 1) {
                    that.bot.bot.removeListener('goal_reached', goalReached);
                    that.bot.bot.pathfinder.movements.canDig = true;
                    that.bot.bot.pathfinder.movements.scafoldingBlocks = [
                        that.bot.mcData.blocksByName.dirt.id,
                        that.bot.mcData.blocksByName.cobblestone.id
                    ];
                    that.bot.bot.pathfinder.setGoal(null);
                    that.bot.bot.pathfinder.stop();
                    resolve();
                }
            };
            this.bot.bot.on('goal_reached', goalReached);
        });
    }
};