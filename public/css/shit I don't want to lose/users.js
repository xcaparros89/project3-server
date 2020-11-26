const users = [];
const games = []
var shortid = require('shortid');

//Join user to chat
function userJoin(id, username, room, isBot){
    let ready = isBot? true : false;
    let newId = isBot? shortid.generate() : id;
    const user = {id:newId, username, room, ready};
    users.push(user);
    console.log(users)
    return user;
}

//Get current user
function getCurrentUser(id){
    return users.find(user => {
        console.log(user, id);
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

const setReady = (name) => {
    users.map((user) => {
      if (user.username === name) {
          user.ready = !user.ready;
      }
    });
  };

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    setReady,
}