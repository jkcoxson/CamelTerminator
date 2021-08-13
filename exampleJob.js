// Example jobs that can be inserted into CamelTerminator
// jkcoxson



// CamelTerminator takes in 'jobs' that are made of 'tasks'
// Each job is composed of a JSON

[
    {
        'name': 'Example Job', // a name for the job so that it can be called from a command
        'defend': true, // should the bot defend itself if attacked for run from creepers/skeles (default true)
        'tasks': [
            {
                'name': 'Say yeet', // name of the task so you know what it's working on
                'type': 'chat', // The type of task this is. Each task has different options
                'message': 'Yeet!',
                'targets': [] // People to tell the message, if array is empty sends to all players
            },
            {
                'name': '100 pls',
                'type': 'gotoCoords', // Go to a specific coordinate
                'break': true, // should the bot break blocks while path finding (default true)
                'place': true, // should the bot place blocks while path finding (default true)
                'x': 100,
                'y': 100,
                'z': 100
            },
            {
                'name':'Sir, this is a Wendy\'s',
                'type': 'killMob', // Searches the loaded chunks for a specific mob
                'mob': 'cow', // Minecraft mob name
                'silentFail': false // If the mob can't be found, send a message and stop (default false)
            },
            {
                'name': 'I\' rich!!',
                'type': 'fetch', // Attempt to find an item in the surrounding area
                'item': 'diamond', // Minecraft's name for the item
                'count': '3', // Just enough for a pickaxe
                'silentFail': false
            }
        ]
    }
];