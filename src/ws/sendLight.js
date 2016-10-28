var sendLight = function(conn, target, username, logger)
{
  logger.debug("Target \"" + target + "\" asked for light.")
  var sendTarget = target
  var sendMessageType = "player"
  var messageObject = {
    type: "event",
    bookmark: 2223,
    content: {
    }
  }

  messageObject.content[target] = "You find a light switch, what are the chances and turn it on. \n The room fills with a bright yellow light."

  var messageToSend = sendMessageType + "," +
            sendTarget + "," +
            JSON.stringify(messageObject)

  conn.sendText(messageToSend);

  return true;
}

module.exports = sendLight;
