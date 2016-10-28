var sendUnknownCommand = function(conn, target, content, logger) {
  logger.info("Unknown command from user: " + content)
  var responseObject = {
          type: "event",
          "content": {
          }
        }

    responseObject.content[target] = "Call this a command, try again!!"
        var sendMessageType = "player"
        var sendTarget = target

        var messageText = sendMessageType + "," +
                  sendTarget + "," +
                  JSON.stringify(responseObject)

    conn.sendText(messageText)
}

module.exports = sendUnknownCommand;
