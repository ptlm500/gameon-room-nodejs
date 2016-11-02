var sendRules = function(conn, target, username, logger)
{
  logger.debug("Target \"" + target + "\" asked for rules.")
  var sendTarget = target
  var sendMessageType = "player"
  var messageObject = {
    type: "event",
    bookmark: 2223,
    content: {
    }
  }

  messageObject.content[target] = "Welcome to the South Bank Microservice Hackday 2016! \n "+
  "The aim of the day is to create new rooms for the game on environment, while making these rooms we hope you learn something new about microservices or your choosen langauge. "+
  "We would like you to register your rooms to the hackday using this room and the /register command. This will add your room to the list of availible rooms and ultimately to the hackday quest."+
  "\n\n So what is the hackday quest?\n Well at the start of the day we are going to give each team in the event a secret word which they will need to hide in their room. They can choose what you will need to do to retrieve this."+
  " The aim of the game will be to enter all the rooms created at the hackday and gather all the secret words together to create the winning phrase, this phase can be entered into this room using the /completeTheQuest command." +
  " To find a list of all the availible rooms use the /rooms command. \n\n Good Luck and happy questing!!"

  var messageToSend = sendMessageType + "," +
            sendTarget + "," +
            JSON.stringify(messageObject)

  conn.sendText(messageToSend)
}

module.exports = sendRules;
