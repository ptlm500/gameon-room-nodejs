// Copyright (c) 2016 IBM Corp. All rights reserved.
// Use of this source code is governed by the Apache License,
// Version 2.0, a copy of which can be found in the LICENSE file.

var ws = require("nodejs-websocket");
var winston = require('winston');
var register = require('./src/register.js');

//Ws functions
var sendUnknownType = require('./src/ws/sendUnknownType.js');
var prepareChatMessage = require('./src/ws/prepareChatMessage.js');
var prepareGoodbyeMessage = require('./src/ws/prepareGoodbyeMessage.js');
var sendInventory = require('./src/ws/sendInventory.js');
var sendExamine = require('./src/ws/sendExamine.js');
var parseGoCommand = require('./src/ws/parseGoCommand.js');
var sendUnknownCommand = require('./src/ws/sendUnknownCommand.js');

// User credentials
var gameonUID = (process.env.GAMEON_ID || '');
var gameonSecret = (process.env.GAMEON_SECRET || '');

// Room Details
// Your room's name
var theRoomName = (process.env.ROOM_NAME || 'room101');
var fullName = (process.env.FULL_NAME || 'Room 101');
var description = (process.env.DESCRIPTION || 'All the doors are locked... you must answer the /question to get the access key');
// The hostname of your CF application
var vcapApplication = (process.env.VCAP_APPLICATION || '{}');
var appUris = (vcapApplication.application_uris || ['localhost']);
var endpointip = appUris[0];
// Automatically retrieves the port of your CF
var port = (process.env.CF_INSTANCE_PORT || 3000);

var logger = new winston.Logger({
    level: 'debug',
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({
            filename: './access.log'
        })
    ]
});

var registration = {
    "fullName": fullName,
    "name": theRoomName,
    "description": description,
    "connectionDetails": {
        "type": "websocket",
        "target": "ws://" + endpointip,
    },
    "doors": {
        "n": "Plain steel door.",
        "s": "Plain steel door.",
        "e": "Plain steel door.",
        "w": "Plain steel door.",
    },
}

//Puzzle data
var keys = {
  "unlocked": false,
  "masterKey": "1991"
}

var activePuzzle = 0;

var answers = [1, 99, 1];

//Register the service if credentials are given
register(gameonUID, gameonSecret, registration, logger);

//Create websocket
var wsServer = ws.createServer(function(conn) {
    conn.on("text", function(incoming) {
        logger.debug("RECEIVED: " + incoming)
        var typeEnd = incoming.indexOf(',')
        var targetEnd = incoming.indexOf(',', typeEnd + 1)

        var messageType = incoming.substr(0, typeEnd)
        var target = incoming.substr(typeEnd + 1, targetEnd - typeEnd - 1)
        var objectStr = incoming.substr(targetEnd + 1)
        var object = {}
        try {
            object = JSON.parse(objectStr)
        } catch (err) {
            logger.error("Got improper json: " + objectStr)
        }

        logger.info("Parsed a message of type \"" + messageType + "\" sent to target \"" + target + "\".")

        //if (target != theRoomName)
        //  return

        if (messageType === "roomHello") {
            logger.debug("In roomHello")
            sayHello(conn, object.userId, object.username)
        } else if (messageType === "room") {
            if (object.content.indexOf('/') == 0) {
                parseCommand(conn, object.userId, object.username, object.content)
            } else {
                logger.info(object.username + " sent chat message \"" + object.content + "\"")
                broadcast(prepareChatMessage(conn, object.username, object.content));
            }
        } else if (messageType === "roomGoodbye") {
            logger.debug("Announcing that \"" + username + "\" has left the room.")
            broadcast(prepareGoodbyeMessage(conn, object.userId, object.username))
        } else {
            sendUnknownType(conn, object.userId, object.username, messageType, logger);
        }
    })
    conn.on("close", function(code, reason) {
        logger.debug("Connection closed.")
    })
}).listen(port);

// Install a special handler to make sure ctrl-c on the command line stops the container
process.on('SIGINT', function() {
    wsServer.close(function() {
        logger.info("The server is exiting");
        process.exit(0);
    });
});

function parseCommand(conn, target, username, content) {
    if (content.substr(1, 3) == "go ") {
        if (keys.unlocked) {
          parseGoCommand(conn, target, username, content, registration.doors, logger);
        } else {
          sendlockingError(conn, target, username, logger)
        }
    }
    /*else if (content.substr(1, 5) == "exits")
    {
      sendExits(conn, target, username)
    }
    else if (content.substr(1, 4) == "help")
    {
      sendHelp(conn, target, username)
    }
    else if (content.substr(1, 9) == "inventory")
    {
      sendInventory(conn, target, username, logger)
    }*/
    else if (content.substr(1, 6) == "answer") {
      checkAnswer(conn, target, username, content.substr(8))
    }
    else if (content.substr(1, 8) == "question") {
      printQuestion(conn, target, username, logger)
    }
    else if (content.substr(1, 4) == "lock") {
      lock(conn, target, username, logger)
    }
    else if (content.substr(1, 6) == "trykey") {
      tryKey(conn, target, username, logger, content.substr(8, 12))
    }
    else if (content.substr(1, 7) == "examine") {
        sendExamine(conn, target, username, logger);
    } else {
        sendUnknownCommand(conn, target, content, logger);
    }
}

function checkAnswer(conn, target, username, userAnswer) {
  logger.info("Checking answer for " + activePuzzle)

  if (userAnswer == answers[activePuzzle]) {
    correctAnswer(conn, target, username)
  } else {
    incorrectAnswer(conn, target, username, userAnswer)
  }
}

function correctAnswer(conn, target, username) {
  var sendTarget = target
  var sendMessageType = "player"
  var messageObject = {
    type: "event",
    bookmark: 2223,
    content: {
    }
  }

  messageObject.content[target] = "Correct! Remember that number."
  activePuzzle ++

  var messageToSend = sendMessageType + "," +
            sendTarget + "," +
            JSON.stringify(messageObject)

  conn.sendText(messageToSend)
}

function incorrectAnswer(conn, target, username, userAnswer) {
  var sendTarget = target
  var sendMessageType = "player"
  var messageObject = {
    type: "event",
    bookmark: 2223,
    content: {
    }
  }

  messageObject.content[target] = "Sorry, that was not the right answer."

  var messageToSend = sendMessageType + "," +
            sendTarget + "," +
            JSON.stringify(messageObject)

  conn.sendText(messageToSend)
}

function printQuestion(conn, target, username, logger) {
  logger.info("Printing question " + activePuzzle)

  var sendTarget = target
  var sendMessageType = "player"
  var messageObject = {
    type: "event",
    bookmark: 2223,
    content: {
    }
  }

  switch (activePuzzle) {
    case 0:
      messageObject.content[target] = "A man on his way to St Ives has seven wives. Each wife has seven sisters. Each sister has seven sacks. Each sack has seven cats and each cat has seven kittens. Man, wives, sisters, sacks, cats, kittens- how many are going to St. Ives?"
      break;
    case 1:
      messageObject.content[target] = "The man is curious about death and asks a prophet “How old will I be when I die? The prophet replies: “Kittens over bad luck squared” At what age will the man die?"
      break;
    case 2:
      messageObject.content[target] = "Which number do a unicorn an ace and a dromedary camel have in common?"
      break;
    default:
      logger.info("Couldn't find question")
      break;
  }

  var messageToSend = sendMessageType + "," +
            sendTarget + "," +
            JSON.stringify(messageObject)

  conn.sendText(messageToSend)
}

function lock(conn, target, username, logger) {
  logger.info("Locking the doors...")
  var sendTarget = target
  var sendMessageType = "player"
  var messageObject = {
    type: "event",
    bookmark: 2223,
    content: {
    }
  }

  if (keys.unlocked) {
    keys.unlocked = false
    messageObject.content[target] = "Locking the doors. I hope you have the key handy..."
  } else {
    messageObject.content[target] = "The doors are already locked..."
  }

  var messageToSend = sendMessageType + "," +
            sendTarget + "," +
            JSON.stringify(messageObject)

  conn.sendText(messageToSend)
}

function sendlockingError(conn, target, username, logger) {
  logger.info("Player \"" + target + "\" is trying the door")
  var sendTarget = target
  var sendMessageType = "player"
  var messageObject = {
    type: "event",
    bookmark: 2223,
    content: {
    }
  }

  messageObject.content[target] = "The doors are locked. Have you not worked out the key yet?"

  var messageToSend = sendMessageType + "," +
            sendTarget + "," +
            JSON.stringify(messageObject)

  conn.sendText(messageToSend)
}

function tryKey(conn, target, username, logger, testKey) {
  logger.info("Trying key \"" + testKey + "\"")
  var sendTarget = target
  var sendMessageType = "player"
  var messageObject = {
    type: "event",
    bookmark: 2223,
    content: {
    }
  }

  if (keys.unlocked) {
    messageObject.content[target] = "You have already unlocked the door!"
  } else if (testKey === keys.masterKey) {
    messageObject.content[target] = "Congratulations, door unlocked!"
    keys.unlocked = true
  } else {
    messageObject.content[target] = "Your pass key was not correct... try again"
  }

  var messageToSend = sendMessageType + "," +
            sendTarget + "," +
            JSON.stringify(messageObject)

  conn.sendText(messageToSend)
}

function sayHello(conn, target, username) {
    logger.info("Saying hello to \"" + target + "\"")
    var responseObject = {
        "type": "location",
        "name": theRoomName,
        "fullName": fullName,
        "description": description,
    }

    var sendMessageType = "player"
    var sendTarget = target

    var messageText = sendMessageType + "," +
        sendTarget + "," +
        JSON.stringify(responseObject)

    conn.sendText(messageText)

    logger.debug("And announcing that \"" + username + "\" has arrived.")
    var broadcastMessageType = "player"
    var broadcastMessageTarget = "*"
    var broadcastMessageObject = {
        type: "event",
        content: {
            "*": username + " enters the room."
        },
        bookmark: 51
    }
    var broadcastMessage = broadcastMessageType + "," +
        broadcastMessageTarget + "," +
        JSON.stringify(broadcastMessageObject)

    broadcast(broadcastMessage)
}

function broadcast(message) {
    wsServer.connections.forEach(function(conn) {
        conn.sendText(message)
    })
}

process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log("UNCAUGHT EXCEPTION! " + err)
})

logger.info("The WebSocket server is listening...")
