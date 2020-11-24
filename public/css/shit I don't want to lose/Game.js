import React, { Component, useEffect, useState } from "react";
import { withAuth } from "../lib/AuthProvider";
import { io } from "socket.io-client";
import { Link, useHistory } from "react-router-dom";
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import './Game.css'
import {startingBoard, startingDeck, shuffle, orientationToString, findEmptyStartingPos} from '../utils/gameAct'
const socket = io("http://localhost:4000", {
  transports: ["websocket", "polling"],
});
const Game = (props) => {
  const history = useHistory();
    const [room, setRoom] = useState({name:props.user.username, id:props.match.params.id, users:[], messages:[]})
    const [ready, setReady] = useState(false);
    const [creator, setCreator] = useState('');
    const [start, setStart] = useState(false);
    const robots = ['x', 'y', 'z', 'a', 's', 'd', 'f', 'j']
    const [players, setPlayers] = useState([]);
    const [board, setBoard] = useState( [
      ['o','o','o','o','o','o','o','o','o','o','o','o'],
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
    ]);
    const [yourActions, setYourActions] = useState({actions:[['nothing',0],['nothing',0],['nothing',0],['nothing',0],['nothing',0]], deck:shuffle(startingDeck), handCards:[], cardPicked:''})
    const [id, setId] = useState('');

    useEffect(() => {
        if(props.history.location.state){ setCreator(props.history.location.state.creator)};
        socket.emit("join", { username: props.user.username, room: props.match.params.id});
        socket.on('roomUsers', ({users, id, username}) =>{setRoom(prevState=>({...prevState, users})); if(id && username === props.user.username)setId(id)});
        socket.on('message',message=>{
            setRoom(prevState=>({...prevState, messages:[...prevState.messages, message]}))
            //Scroll down
            //const chatMessages = document.querySelector('.chat-messages')
            //if(chatMessages){chatMessages.scrollTop = chatMessages.scrollHeight};
          });
          socket.on('bye', ({id})=>{if(id===socket.id){history.push({pathname: `/allRooms`})}})
          socket.on('addUserActions', async ({id, actions, players, board})=>{// has de fer que pilli tota la info dels players per socket pq els socket sempre ignoren el state
            players = players.map(player=>{
              if(player.id === id){
                return {...player, actions}
              } else{ return player}
            });
            let areAllTheActions =players.every(player=>{
              return player.actions[0][0]!=='nothing'
            });
            if(areAllTheActions){
              let newPlayers = players;
              let newBoard = board;
              handleActions(0, 0, newPlayers, newBoard, false);
            }
            setPlayers(players);
          });
        
          socket.on('doActions',({newIPlayer, newIAction, newBoard, newPlayers, isTwo, creator})=>{
            handleActions(newIPlayer, newIAction, newPlayers, newBoard, isTwo, creator)
          } )

          socket.on('startCountdown', ({emiterId})=>{
            //anar treient a la gent que se li ha fet el settimeout
            // if(socket.id !== emiterId){
            //   console.log(id, 'startCountdown', emiterId)
            //   setTimeout(()=>endTurn(), 3000);
            // }
            setTimeout(()=>console.log(socket.id, 'startCounjtdown', emiterId), 3000);
          })


        socket.on('startGame', ({users})=>{
            users.forEach((player, index)=>{
            let startingPos = [[7,2],[7,4],[7,6],[7,8]][index];
            setBoard(prevBoard=>{
              let newBoard = JSON.parse(JSON.stringify(prevBoard));
              newBoard[startingPos[0]].splice(startingPos[1], 1, player.robot);
              return newBoard
            })
              setPlayers(prevState=>[...prevState, {name:player.robot, id:player.id, orientation:'up', pos:[startingPos[0], startingPos[1]], actions:[['nothing',0],['nothing',0],['nothing',0],['nothing',0],['nothing',0]]}])
            });
          setStart(true)
        
        })
        return () => {
            socket.close();
        }
    }, [])

    let handleActions = (iPlayer, iAction, newPlayers, newBoard, isTwo) =>{
      let newHandle
      const [action, number] = newPlayers[iPlayer].actions[iAction][0]!=='repeat'? newPlayers[iPlayer].actions[iAction] : iAction === 0 || newPlayers[iPlayer].actions[iAction-1][0] ==='repeat' ? ['nothing', 0] : newPlayers[iPlayer].actions[iAction-1];

      if(action === 'move'){
        newHandle = handleMove(number, iPlayer, newPlayers, newBoard)
      } else if(action === 'turn'){
        newHandle = handleRotate(number, iPlayer, newPlayers, newBoard)
       } else{
          newHandle = {newPlayers, newBoard};
       }

      if(socket.id === newPlayers[0].id){
      let newIPlayer = iPlayer;
      let newIAction = iAction;
      let newIsTwo = number === 2 && isTwo === false ? true : false;

        if(newIsTwo){
          console.log('is two')
        } else if(iPlayer === newPlayers.length-1 && iAction === 4){
          return
        } else if (iPlayer === newPlayers.length-1){
          newIPlayer = 0;
          newIAction += 1;        
        } else{
          newIPlayer +=1;
        }

        newPlayers=newHandle.newPlayers; newBoard=newHandle.newBoard;
        setTimeout(()=>socket.emit('sendActions', {room:room.id, newIPlayer, newIAction, newPlayers, newBoard , isTwo:newIsTwo}), 500);
    }
  }

    let handleMove = (num, index, handlePlayers, handleBoard) =>{
      let newNum = num === -1? -1 : 1;
      num=Math.abs(num);
      const {orientation, pos} = handlePlayers[index];
      let y = pos[0];
      let x = pos[1];
      newNum = orientation === 'up' || orientation === 'right'? newNum : -newNum;
      let newY = y;
      let newX = x;
      orientation === 'up' || orientation === 'down' ?  newY -=newNum : newX+=newNum;
      if(handleBoard[newY][newX]===' '){
        handleBoard[y].splice(x, 1, ' '); 
        handleBoard[newY].splice(newX, 1, 'r');
        handlePlayers.splice(index, 1, {...handlePlayers[index], pos:[newY, newX]}); 
      } else if(handleBoard[newY][newX]==='pit'){
        let startingPos = findEmptyStartingPos(handleBoard)
        handleBoard[y].splice(x, 1, ' '); 
        handleBoard[startingPos[0]].splice(startingPos[1], 1, 'r');
        handlePlayers.splice(index, 1, {...handlePlayers[index], pos:[startingPos[0],startingPos[1]]});
      } else if(handleBoard[newY][newX]==='r'){
        let evenNewerY = y=== newY? y : y<newY? newY+1 : newY-1;
        let evenNewerX = x=== newX? x : x<newX? newX+1 : newX-1;
        if(handleBoard[evenNewerY][evenNewerX] !== 'o'){
          let indexOther = handlePlayers.find(robot=>robot.pos[0] === newY && robot.pos[1] === newX)
          handleBoard[y].splice(x, 1, ' '); 
          handleBoard[newY].splice(newX, 1, 'r'); 
          handlePlayers.splice(index, 1, {...handlePlayers[index], pos:[newY, newX]}); 
          if(handleBoard[evenNewerY][evenNewerX] === ' '){
            handlePlayers.splice(indexOther, 1, {...handlePlayers[indexOther], pos:[evenNewerY,evenNewerX]}); 
            handleBoard[evenNewerY].splice(evenNewerX, 1, 'r');
          } else {
            let startingPos = findEmptyStartingPos(handleBoard);
            handlePlayers.splice(indexOther, 1, {...handlePlayers[indexOther], pos:[startingPos[0], startingPos[1]]}); 
            handleBoard[startingPos[0]].splice(startingPos[1], 1, 'r');
          }
        }
      }
      setBoard(handleBoard);
      setPlayers(handlePlayers)
      return {newPlayers:handlePlayers, newBoard:handleBoard};
    }

    let handleRotate = (number, index, handlePlayers, handleBoard)=>{
      let newNum = number === 2? 1 : number;
      const {orientation} = handlePlayers[index];
      const numPos = orientation === 'up' ? 0 : orientation === 'left' ? -1 :  orientation === 'right' ? 1 : 2;
      const newPos = orientationToString(numPos + newNum)
      let newPlayer = {...handlePlayers[index], orientation:newPos}
      handlePlayers.splice(index, 1, newPlayer);
      setPlayers(handlePlayers)
      console.log(handlePlayers, 'handleRotate');
      return {newPlayers:handlePlayers, newBoard:handleBoard};
    }

    let sendMessage = (e)=>{
    e.preventDefault();
    let msg = e.target.elements.msg.value;
    msg = msg.trim(); 
  if (!msg){
    return false;
  }
    //Emit message to server
    socket.emit('chatMessage', msg);
    //Clea message
    e.target.elements.msg.value = ' ';
    e.target.elements.msg.focus(); //return the focus to the input
    }

    const changeReady = () => {
        socket.emit('ready', { user:props.user.username, room:room.id });
        setReady(!ready);
    }

    const startGame = () => {
        let newUsers = JSON.parse(JSON.stringify(room.users));
        newUsers.map((user, i)=>user.robot = robots[i]);// AIXO ES POT TREURE, CREC
        socket.emit('prepareGame', {room: room.id, users:newUsers} );
    }

    const addBot = (num) =>{
      socket.emit("join", { username: `Bot-${num}`, room: props.match.params.id, isBot:true});
    }

    const kickOut = (user) =>{
      socket.emit('kickOut', {userId: user, room: props.match.params.id, isBot:true})
    }

    const endTurn = () =>{
      console.log(yourActions.actions, yourActions.handCards, 'endTurn')
      let newActions =  yourActions.actions;
      let newHandCards = yourActions.handCards;
      yourActions.actions.map((action, iAct)=>{
         if(action[0] === 'nothing'){
          let ihandCard;
          while(!ihandCard || yourActions.handCards[ihandCard][0] === 'nothing'){ihandCard = Math.floor(Math.random() * 8)};
          newHandCards = newHandCards.map((card, index)=>index === ihandCard ? ['nothing', 0] : [...card])
          newActions = newActions.map((card, index)=>index === iAct ? [...yourActions.handCards[ihandCard]]: card)
        }
      })
      setYourActions(prevState=>({...prevState, handCards:newHandCards, actions:newActions}))
          socket.emit('endTurn', {room: room.id, id:socket.id, actions: newActions, players, board} );
          socket.emit('emitCountdown', {room: room.id, id})
    }


    const startTurn = () =>{
      socket.emit('emitStartTurn', {room: props.match.params.id, })
    }


    let draw = async() => {
      let newDeck = await yourActions.deck.length? JSON.parse(JSON.stringify(yourActions.deck)) : shuffle(JSON.parse(JSON.stringify(startingDeck)));
      let handCards = newDeck.splice(0, 8); 
      setYourActions({...yourActions, deck:newDeck, handCards})
    }

    let clickCard = (fromWhere, iCard) => {
      let newYou = JSON.parse(JSON.stringify(yourActions));
      if(newYou.cardPicked.length){
        if(newYou.cardPicked[0] === 'handCards' && fromWhere === 'handCards')
        {
          newYou = {...newYou, cardPicked:[fromWhere, iCard]}
        } else{
          let newActions = newYou.actions;
          let newHandCards = newYou.handCards;
          if(newYou.cardPicked[0] === 'actions' && fromWhere === 'actions'){
            newActions = newActions.map((action, index)=>{
              if(index === iCard){return newActions[newYou.cardPicked[1]] }
              else if(index === newYou.cardPicked[1]){return newActions[iCard]}
              else {return action}
            })
          } else if(newYou.cardPicked[0] === 'handCards'){
            newHandCards = newHandCards.map((card, index)=>index===newYou.cardPicked[1]?newYou[fromWhere][iCard] : card);
            newActions.splice(iCard, 1, newYou[newYou.cardPicked[0]][newYou.cardPicked[1]])
          } else{    
            newHandCards = newHandCards.map((card, index)=>index===iCard? newYou[newYou.cardPicked[0]][newYou.cardPicked[1]] : card);      
            newActions.splice(newYou.cardPicked[1], 1, newYou[fromWhere][iCard])
          }
          newYou = {...newYou, actions:newActions, handCards:newHandCards, cardPicked:''}
          }
      }else {
        newYou = {...newYou, cardPicked:[fromWhere, iCard]}
      }
      socket.emit('addOneAct', {newYou, id:socked.id})
      setYourActions(newYou)
    }
  

  return (
    <div>
      <p>{creator? creator:'creator'}</p>
      <p>{id} aqui</p>
      <div className="chat-container">
        <header className="chat-header">
          <h1>
            <i className="fas fa-smile"></i> ChatCord
          </h1>
          <Link to='/allRooms'>
            <button className='btn'>Leave Room</button>
          </Link>
        </header>
        <main className="chat-main">
          <div className="chat-sidebar">
            <h3>
              <i className="fas fa-comments"></i> Room Name: {room.name}
            </h3>
            <h2 id="room-name"></h2>
            <h3>
              <i className="fas fa-users"></i> Users
            </h3>
            <ul id="users">
              {robots.map((robot, index)=> typeof room.users[index] === 'undefined'? <li key={index}><button onClick={()=>addBot(index)} >Add bot</button></li> : <li key={index}>{room.users[index].username}{creator &&<button onClick={()=>kickOut(room.users[index].id)}>Kick out</button>}</li>)}
            </ul>
          </div>
          <div className="chat-messages">
              {room.messages.map((message, index)=>{
                  return (
                  <div key={index} className='message'><p className="meta">{message.username} <span>{message.time}</span></p>
                    <p className="text">{message.text}</p></div>)})}
          </div>
        </main>
        <div className="chat-form-container">
          <form id="chat-form" onSubmit={(e)=>sendMessage(e)}>
            <input
              id="msg"
              type="text"
              placeholder="Enter Message"
              required
              autoComplete="off"
            />
            <button type='submit' className="btn">
              <i className="fas fa-paper-plane"></i> Send
            </button>
          </form>
          <button onClick={changeReady}>{(ready) ? 'Ready' : 'Not ready'}</button>
            {room.users.every(user => user.ready === true) && creator &&<button onClick={startGame}>Play</button>}
        </div>
      </div>
      {start && (
        <div>
        <Container>
          {board.map((row, index)=>{
            return(
              <Row  key={index} className={'r'+index}>
                {row.map((col,index)=>{
                  return (<Col key={index} className={'c'+index}>{col}</Col>)
                })}
              </Row>
            )
          })}
        </Container>
        <div>
          <div style={{display:'flex', justifyContent:'center'}}>
            <p>{yourActions.name}:</p>
            {yourActions.actions.map((card, iCard)=>{
              return (<p onClick={()=>clickCard('actions', iCard)} key={iCard}>{'|'+card[1]+' '+card[0]+'|'}</p>)
            })}
          </div>
          <div style={{display:'flex', justifyContent:'center'}}>
            {yourActions.handCards.map((card, iCard)=>{
              return (<p onClick={()=>clickCard('handCards', iCard)} key={iCard}>{'|'+card[1]+' '+card[0]+'|'}</p>)
            })}
          </div>
          <button onClick={()=>draw()}>Draw</button>
          <button onClick={()=>endTurn()}>End Turn</button>
        </div>
        </div>
      )}
    </div>
  );
};

export default withAuth(Game);
