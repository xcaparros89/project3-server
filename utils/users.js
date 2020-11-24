let startingBoard = [

    ['pit','o',' ',' ',' ',' ',' ',' ',' ',' ','o','pit'],
      ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
      ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
      ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
      ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
      ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
      ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
      ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
      ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
      ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
      ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
      ['pit','pit','pit','pit','pit','pit','pit','pit','pit','pit','pit','pit'],
    ]
let startingDeck = [['move', 1], ['move', 1], ['move', 1], ['move', 2], ['move', 2], ['move', 2], ['turn', 1], ['turn', 1], ['turn', 1], ['turn', -1], ['turn', -1], ['turn', -1],['turn', 2], ['repeat', 'x'], ['repeat', 'x'], ['move', -1]] 
//let startingDeck = [['repeat', 'x'], ['repeat', 'x'], ['repeat', 'x'], ['repeat', 'x'], ['repeat', 'x'], ['repeat', 'x'], ['repeat', 'x'], ['repeat', 'x'], ['move', 2],['move', 2], ['move', 1], ['move', 1],['move', 1], ['move', 1], ['move', 1],['move', 1], ['move', 1], ['move', 1],]

const users = [];
const games = {};
var shortid = require('shortid');

//Join user to chat
function userJoin(id, username, room, isBot){
    let ready = isBot? true : false;
    let newId = isBot? shortid.generate() : id;
    const user = {id:newId, username, room, ready};
    users.push(user);
    return user;
}

//Get current user
function getCurrentUser(id){
    return users.find(user => {
        return user.id === id
    });
}

//User leaves chat
function  userLeave(id){
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) return users.splice(index, 1)[0];
}

// Get room users
function getRoomUsers(room){
    return users.filter(user=>user.room === room)
}

// Set ready
const setReady = (name, robotChosen) => {
    users.map((user) => {
      if (user.username === name) {
          if(user.ready){
            user.robot = '';
            user.ready = false;
          }else{
              user.robot = robotChosen;
              user.ready = true;
          }
      }
    });
  };

//Prepare game

const prepareGame = (room, players) =>{
    let newPlayers = [];
    let newBoard =  JSON.parse(JSON.stringify(startingBoard));
    players.forEach((player, index)=>{
        let startingPos = [[7,2],[7,4],[7,6],[7,8]][index];
        newBoard[startingPos[0]].splice(startingPos[1], 1, player.robot);
        newPlayers.push({name:player.robot, id:player.id, orientation:'up', pos:startingPos, deck:shuffle(JSON.parse(JSON.stringify(startingDeck))), handCards:[]})
    });
    games[room] = {room, players:newPlayers, board:newBoard, turn:0};
    return prepareTurn(room)
}

//Prepare turn

const prepareTurn = (room, newPlayers=false, newBoard=false) => {
    games[room].players.map((player, iPlayer)=>{
        player.actions = [['nothing',0],['nothing',0],['nothing',0],['nothing',0],['nothing',0]]
        //tot lu que canvies durant el torn no es guarda
        const [newDeck, handCards] = draw(player.deck);
        player.deck = newDeck;
        player.handCards = handCards;
        if(newPlayers){
            player.orientation = newPlayers[iPlayer].orientation;
            player.pos = newPlayers[iPlayer].pos; 
        }
    })
    if(newBoard){games[room].board = newBoard};
    games[room].players = turnOrder(games[room].players)
    return games[room];
}

//Turn order

const turnOrder = (players)=>{
    players.map(player=>{
        const [y, x] = player.pos;
        player.distance = Math.abs(x-4) + Math.abs(y-9)
    })
    players.sort((a,b)=> a.distance - b.distance);
    return players
}


//Add action

const addOneAct = (room, newYou, id) => {
    games[room].players.map((player, index)=>{
        if(player.id===id){
            let EvenNewerYou = {...games[room].players[index], actions:newYou.actions, handCards:newYou.handCards }
            games[room].players.splice(index, 1, EvenNewerYou);
        }
    })
    return games[room];
}

//Prepare end turn
const prepareEndTurn = (room) => {
    let newPlayers = games[room].players.map((player, index)=>{
        if(player.actions.every(action=>{ action[0] !== 'nothing'})){
            return player
        } else {
            let newActions = player.actions;
            let newHandCards = player.handCards;
            player.actions.map((action, iAct)=>{
                if(action[0] === 'nothing'){
                    let ihandCard;
                    while(!ihandCard || player.handCards[ihandCard][0] === 'nothing'){ihandCard = Math.floor(Math.random() * 8)};
                    newHandCards = newHandCards.map((card, index)=>index === ihandCard ? ['nothing', 0] : [...card])
                    newActions = newActions.map((card, index)=>index === iAct ? [...player.handCards[ihandCard]]: [...card])
                }
            })
            return {...player, actions:newActions, handCards:newHandCards}
        }
    })
    return games[room] = {...games[room], players:newPlayers};
}


//Shuffle

const shuffle = (array) =>{
    let newArray = JSON.parse(JSON.stringify(array))
    for (let i = newArray.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

//Draw
let draw = (deck) => {
    let newDeck = deck.length? deck : shuffle(JSON.parse(JSON.stringify(startingDeck)));
    let handCards = newDeck.splice(0, 8); 
    return [newDeck, handCards]
}

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    setReady,
    prepareGame,
    prepareTurn,
    addOneAct,
    prepareEndTurn
}