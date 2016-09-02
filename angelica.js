// Imports
var tmi  = require('tmi.js');                  // The bot uses the tmi-js library to connect to Twitch
var fs   = require('fs');                      // For getting passwords
var exec = require('child_process').spawnSync; // For interacting with the brain

// General configuration
var botDirectory = '/root/angelica';
var botName = 'Angelica_E';
var ignoreList = [
    'nightbot',
    'zamielbot',
    'sneewo',
    'zeldobot',
];

// Twitch configuration
var oauth = fs.readFileSync(botDirectory + '/passwords/Twitch.txt', 'utf8').trim();
var TwitchBot = new tmi.client({
    options: {
        debug: true,
    },
    connection: {
        reconnect: true,
    },
    identity: {
        username: botName,
        password: oauth,
    },
    channels: ['#zamiell'],
});
var channelUserList = {};

// Start the server
var datetime = new Date();
console.log('----- STARTING ANGELTICA @ ' + datetime + ' for 1 user! -----');
TwitchBot.connect();

// General purpose functions
function error(message) {
    var datetime = new Date();
    message = datetime + ' - ' + message;
    console.error(message);
    console.log(message);
}

// Catch chat messages
TwitchBot.on('chat', function(channel, user, message, self) {
    // Since user is an object containing various things, just make it equal to the username for simplicity
    user = user.username; // See: https://www.tmijs.org/docs/Events.md#chat

    // Ignore messages that we sent
    if (user.toLowerCase() === botName.toLowerCase()) {
        return;
    }

    // Ignore bot messages
    for (var i = 0; i < ignoreList.length; i++) {
        if (user.toLowerCase() === ignoreList[i]) {
            return;
        }
    }

    // Ignore people typing commands
    if (message.substring(0, 1) === '!') {
        return
    }

    // Remove whitespace from both sides of the string
    message = message.trim();

    // Log all messages
    var datetime = new Date();
    console.log(datetime + ' - TWITCH [' + channel + '] <' + user + '> ' + message);

    // Add the message to the brain
    var brain = channel.match(/#(.+)/)[1];
    var cmd = botDirectory + '/scripts/teach-brain.py';
    exec(cmd, [brain, message]);

    // Add the message to the brain backup
    //fs.appendFileSync(botDirectory + '/brains/' + brain + '-log.txt', message + '\n');

    // Randomly decide if the bot should respond
    botResponding = false;
    if (Math.random() < 0.05) { // 5% chance
        botResponding = true;
    } else if (message.toLowerCase().indexOf('angel') > -1 && Math.random() < 0.33) { // 33% chance if she's being talked to
        botResponding = true;
    } else if (message.toLowerCase().indexOf('angel') > -1 && user.toLowerCase() === 'zamiell') {
        botResponding = true;
    }
    if (botResponding === false) {
        return;
    }

    // Generate a response from the brain
    var cmd = botDirectory + '/scripts/get-response.py';
    exec(cmd, [brain, message]);

    // Read what the response was
    var response = fs.readFileSync(botDirectory + '/brains/' + brain + '-response.txt', 'utf8');

    // Replace any instances of Angelica with the name of the user that talked
    response = response.replace(/(angelica_e|angelica)/ig, user);

    // Replace any instance of "@username" with the name of the user that talked
    var m = response.match(/@([a-zA-Z0-9_]{4,25})/); // From: https://www.reddit.com/r/Twitch/comments/32w5b2/username_requirements/
    if (m) {
        var person = m[1];

        // Check to see if they are in the channel
        if (channelUserList[channel].indexOf(person) === -1) {
            response.replace(person, user);
        }
    }

    // Say the response
    TwitchBot.say(channel, response);
});

// Catch the list of names when we join a channel
TwitchBot.on('names', function(channel, users) {
    // Keep track of the people in this channel
    channelUserList[channel] = users;
});

// Catch when when someone joins a channel
TwitchBot.on('join', function(channel, username, self) {
    if (self) {
        return;
    }

    // Keep track of the people in this channel
    channelUserList[channel].push(username);
});

// Catch when someone leaves a channel
TwitchBot.on('part', function(channel, username, self) {
    if (self) {
        return;
    }

    // Keep track of the people in this channel
    var index = channelUserList[channel].indexOf(username);
    if (index > -1) {
        channelUserList[channel].splice(index, 1);
    } else {
        console.error('User "' + username + '" left channel "' + channel + '", but they were not in the channelUserList array.');
    }
});
