var sendRooms = function(conn, target, username, rooms, logger)
{
  logger.debug("Target \"" + target + "\" asked to see all the registered rooms.")
  var sendTarget = target
  var sendMessageType = "player"
  var messageObject = {
    type: "event",
    bookmark: 2223,
    content: {
    }
  }
  var i;

  var roomString = "";
  for(i=0; i < rooms.length; i++){
      "'"+rooms[i] + "'\n";
  }
  messageObject.content[target] = "Here are all the rooms you must visit to complete the quest, make sure you go to each room and retrieve it's secret\n"+ roomString;


  var messageToSend = sendMessageType + "," +
            sendTarget + "," +
            JSON.stringify(messageObject);

  conn.sendText(messageToSend);
}

module.exports = sendRooms;
