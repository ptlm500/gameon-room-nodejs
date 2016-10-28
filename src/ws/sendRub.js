var sendRub = function(conn, target, username, content, logger)
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

  if(content.includes('lamp')){
      messageObject.content[target] = "You rub the magic lamp, and it starts to glow. All of a sudden a huge genie erupts out of the lamp. " +
       "In a deep booming voice he announces to the room 'Who dares rub my lamp!! I am the almighty genie and do not wish to aid travellers, who wake me from my sleep. Leave now and never return'";
  } else {
       messageObject.content[target] = "I'm not rubbing that!!"
  }

  var messageToSend = sendMessageType + "," +
            sendTarget + "," +
            JSON.stringify(messageObject)

  conn.sendText(messageToSend);
}

module.exports = sendRub;
