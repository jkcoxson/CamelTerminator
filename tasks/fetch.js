/* eslint-disable no-async-promise-executor */
// Represents a fetch job
// jkcoxson

const baseTask = require('./base');
const gotoCoords = require('./gotoCoords');
const breakBlockTask = require('./breakBlock');

module.exports = class fetchTask extends baseTask {
    constructor(bot, task) {
        super(bot, task);
    }
    run() {
        return new Promise((resolve, reject) => {
            this.fetchAPI(this.task.item, this.task.count).then(() => {
                resolve();
            }).catch(() => {
                reject();
            });
        });
    }
    fetchAPI(itemName, count) {
        return new Promise((resolve, reject) => {
            let itemsCollected = 0;

            // check inventory for items already collected
            this.bot.bot.inventory.items().forEach(item => {
                if (item.name == itemName) {
                    itemsCollected = item.count;
                }
            });
            if (itemsCollected >= count) resolve();


            this.fetchEntity(itemName, count).then(() => {
                console.log('finished looking for entity ' + itemName);
                this.fetchFromBreak(itemName, count).then(() => {
                    console.log('finished looking for block ' + itemName);
                    this.fetchCraft(itemName, count).then(() => {
                        setTimeout(() => {
                            console.log('finished crafting ' + itemName);
                            this.bot.bot.inventory.items().forEach(item => {
                                if (item.name == itemName) {
                                    itemsCollected = item.count;
                                }
                            });
                            console.log(itemName + ': ' + itemsCollected);
                            if (itemsCollected >= count) {
                                console.log('got enough, resolving');
                                resolve();
                            } else {
                                console.log('not enough, rejecting');
                                reject();
                            }
                        }, 1000);

                    });
                });
            });

        });

    }

    fetchEntity(itemName, count) {
        return new Promise(async (resolve) => {
            let toGet = [];
            for (const [, value] of Object.entries(this.bot.bot.entities)) {
                if (value.name == 'item') {
                    if (this.bot.mcData.items[value.metadata[7].itemId].name == itemName) {
                        if (toGet.length < count) {
                            toGet.push(value);
                        }
                    }

                }
            }
            if (toGet.length == 0) resolve();
            while (toGet.length > 0) {
                let gotoClass = new gotoCoords(this.bot, {
                    'break': false,
                    'place': false,
                    'x': toGet[0].position.x,
                    'y': toGet[0].position.y,
                    'z': toGet[0].position.z,
                    'distance': 1
                });
                await gotoClass.run().then(() => {
                    toGet.shift();
                    if (toGet.length == 0) {
                        resolve();
                    }
                });
            }
        });
    }
    fetchFromBreak(itemName, count) {
        return new Promise(async (resolve) => {
            let toFind = itemName;
            let hasTool = false;
            let found = false;
            this.specialItems.forEach(async si => {
                if (si.name == itemName) {
                    toFind = si.block;
                    found = true;

                    this.bot.bot.inventory.items().forEach(item => {
                        if (si.tools.includes(item.name)) {
                            hasTool = true;
                        }
                    });
                    if (si.tools.length == 0) {
                        hasTool = true;
                    }
                    if (!hasTool) {
                        let toFetch = [];
                        si.tools.forEach(tool => {
                            toFetch.push(tool);
                        });
                        while (toFetch.length > 0) {
                            await this.fetchAPI(toFetch[0], 1).then(() => {
                                toFetch.shift();
                                console.log(toFetch.length);
                                this.bot.bot.inventory.items().forEach(item => {
                                    if (si.tools.includes(item.name)) {
                                        hasTool = true;
                                    }
                                });
                                if (toFetch.length == 0) {
                                    if (!hasTool) resolve();
                                    this.bot.bot.inventory.items().forEach(item => {
                                        if (si.tools.includes(item.name)) {
                                            this.bot.bot.equip(item);
                                        }
                                    });
                                    this.fetchAPI(itemName, count).then(() => {
                                        resolve();
                                    }).catch(() => {
                                        resolve();
                                    });
                                }
                            }).catch(() => toFetch.shift());
                        }
                    }
                }
            });
            if (hasTool || found == false) {
                let blockID;
                try {
                    blockID = this.bot.mcData.blocksByName[toFind].id;
                } catch {
                    resolve();
                }
                if (!blockID) resolve();
                let toGet = this.bot.bot.findBlocks({
                    matching: blockID,
                    count: count,
                    maxDistance: 256
                });
                if (toGet.length == 0) resolve();
                while (toGet.length > 0) {
                    let breakTask = new breakBlockTask(this.bot, {
                        'break': true,
                        'place': true,
                        'x': toGet[0].x,
                        'y': toGet[0].y,
                        'z': toGet[0].z
                    });
                    await breakTask.run().then(() => {
                        this.fetchEntity(itemName, 1).then(() => {
                            toGet.shift();
                            if (toGet.length == 0) {
                                resolve();
                            }
                        });


                    });
                }
            }

        });
    }
    fetchCraft(itemName, count) {
        return new Promise((resolve) => {
            resolve();
        });
    }

    specialItems = [
        {
            'name': 'diamond',
            'tools': [
                'iron_pickaxe',
                'diamond_pickaxe',
                'netherite_pickaxe'
            ],
            'block': 'diamond_ore'
        }
    ]
    recipies = [
        {
            'name': 'iron_pickaxe',
            'items': [
                {
                    'name': 'iron_ingot',
                    'count': 3
                },
                {
                    'name': 'stick',
                    'count': 2
                }
            ]
        }
    ]
};