var sendRegistration = function(conn, target, username,content, rooms, logger)
{
  logger.debug("Target \"" + target + "\" asked to register a room.")
  var sendTarget = target
  var sendMessageType = "player"
  var messageObject = {
    type: "event",
    bookmark: 2223,
    content: {
    }
  }

  var roomName = content.split(" ")[1];
  if(rooms.indexOf(roomName) > -1){
      rooms.push(roomName);
       messageObject.content[target] = "Thank you for registering the room "+ roomName;
  }else{
       messageObject.content[target] = "You have already registered the room "+ roomName;
  }

  var messageToSend = sendMessageType + "," +
            sendTarget + "," +
            JSON.stringify(messageObject);

  conn.sendText(messageToSend);

  return rooms;
}

module.exports = sendRegistration;
