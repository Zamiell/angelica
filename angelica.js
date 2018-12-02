// Imports
const twitch = require('twitch-js');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').spawnSync;
const winston = require('winston'); // A logging library

// Import the environment variables defined in the ".env" file
require('dotenv').config();

// General configuration
const botDirectory = '/root/angelica';
const channelUserList = [
    '#zamiell',
    '#thalen22',
    '#stoneagemarcus',
    '#lexicalpedant',
];
const ignoreList = [
    'nightbot',
    'zamielbot',
    'sneewo',
    'zeldobot',
    'lexicalbot',
    'mikuia',
    'stoneage_bot',
];
const incubationList = [
    '#stoneagemarcus',
];

// Set up logging
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'ddd MMM DD HH:mm:ss YYYY',
                }),
                winston.format.printf(info => `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`),
            ),
        }),
    ],
});

// Twitch configuration
const TwitchBot = new twitch.client({ // eslint-disable-line new-cap
    options: {
        debug: true,
    },
    connection: {
        reconnect: true,
    },
    identity: {
        username: process.env.TWITCH_USERNAME,
        password: process.env.TWITCH_OAUTH,
    },
    channels: channelUserList,
});

// Welcome message
logger.info('+--------------------+');
logger.info('| Angelica starting. |');
logger.info('+--------------------+');

// Start the server
TwitchBot.connect();

// Catch chat messages
TwitchBot.on('chat', (channel, user, rawMessage, self) => {
    // Local variables
    const username = user.username; // See: https://www.tmijs.org/docs/Events.md#chat

    // Ignore messages that we sent
    if (username.toLowerCase() === process.env.TWITCH_USERNAME.toLowerCase()) {
        return;
    }

    // Ignore messages from other bots
    for (let i = 0; i < ignoreList.length; i++) {
        if (username.toLowerCase() === ignoreList[i]) {
            return;
        }
    }

    // Ignore people typing commands
    if (rawMessage.substring(0, 1) === '!') {
        return;
    }

    // Remove whitespace from both sides of the string
    const message = rawMessage.trim();

    // Log all messages
    logger.info(`[${channel}] <${username}> ${message}`);

    // Add the message to the brain
    const brain = channel.match(/#(.+)/)[1];
    const teachBrainPath = path.join(botDirectory, 'scripts', 'teach-brain.py');
    exec(teachBrainPath, [brain, message]);

    // Return if we are in incubation mode
    if (incubationList.indexOf(channel) !== -1) {
        return;
    }

    // Randomly decide if the bot should respond
    let botResponding = false;
    if (Math.random() < 0.025) { // 2.5% chance
        botResponding = true;
    } else if (message.toLowerCase().indexOf('angelica') > -1 && Math.random() < 0.25) { // 25% chance if she's being talked to
        botResponding = true;
    } else if (message.toLowerCase().indexOf('angelica') > -1 && user.toLowerCase() === 'zamiell') {
        botResponding = true;
    }
    if (botResponding === false) {
        return;
    }

    // Generate a response from the brain
    const getResponseScriptPath = path.join(botDirectory, 'scripts', 'get-response.py');
    exec(getResponseScriptPath, [brain, message]);

    // Read what the response was
    const responseOutputPath = path.join(botDirectory, 'brains', `${brain}-response.txt`);
    let response = fs.readFileSync(responseOutputPath, 'utf8');

    // Replace any instances of Angelica with the name of the user that talked
    response = response.replace(/(angelica_e|angelica)/ig, user);

    // Replace any instance of "@username" with the name of the user that talked
    const m = response.match(/@([a-zA-Z0-9_]{4,25})/); // From: https://www.reddit.com/r/Twitch/comments/32w5b2/username_requirements/
    if (m) {
        const person = m[1];

        // Check to see if they are in the channel
        if (channelUserList[channel].indexOf(person) === -1) {
            response.replace(person, user);
        }
    }

    // Say the response
    TwitchBot.say(channel, response);
});

// Catch the list of names when we join a channel
TwitchBot.on('names', (channel, users) => {
    // Keep track of the people in this channel
    channelUserList[channel] = users;
});

// Catch when when someone joins a channel
TwitchBot.on('join', (channel, username, self) => {
    if (self) {
        return;
    }

    // Keep track of the people in this channel
    channelUserList[channel].push(username);
});

// Catch when someone leaves a channel
TwitchBot.on('part', (channel, username, self) => {
    if (self) {
        return;
    }

    // Keep track of the people in this channel
    const index = channelUserList[channel].indexOf(username);
    if (index > -1) {
        channelUserList[channel].splice(index, 1);
    } else {
        logger.error(`User "${username}" left channel "${channel}", but they were not in the channelUserList array.`);
    }
});
