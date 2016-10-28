var sendExamine = function(conn, target, username, content, isLampOn, logger)
{
  logger.debug("Target \"" + target + "\" asked for examination.")
  var sendTarget = target
  var sendMessageType = "player"
  var messageObject = {
    type: "event",
    bookmark: 2223,
    content: {
    }
  }

  if(content.includes('magic lamp')){
      messageObject.content[target] = "Wow a magic lamp! I wonder if there is a genie inside?"
  } else if(content.includes('wall') && isLampOn){
      messageObject.content[target] = "Now we have some light, you can see that the glowing writing say the following 'Welcome to Aladdin's cave, home of the magic genie. To summon the genie from the lamp you must command /rub lamp'"
  } else if(content.includes('wall') && !isLampOn){
      messageObject.content[target] = "You can see what looks like glowing text on the wall, but it is far to dark to read what it say. If only we had a light?"
  }else {
       messageObject.content[target] = "We having nothing here to really examine."
  }

  var messageToSend = sendMessageType + "," +
            sendTarget + "," +
            JSON.stringify(messageObject)

  conn.sendText(messageToSend)
}

module.exports = sendExamine;
