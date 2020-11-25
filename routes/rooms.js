const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const User = require("../models/user");
const Room = require("../models/room");

router.post(
    "/addRoom",
    async (req, res, next) => {
      const { id, creator } = req.body;
      try {
          await Room.create({ room:id, users:[creator], creator });
          const allRooms = await Room.find();
          res.status(200).json(allRooms);
        } catch (error) {
            next(error);
        }
    }
  );
  
  router.post(
    "/addUser",
    async (req, res, next) => {
      const { id, user } = req.body;
      try {
          //se ha de poner una validacion para si es el octavo impedir que pueda entrar más gente y si ya hay 8 impedir que entre él
          await Room.findOneAndUpdate({room:id}, { $push:{ users: user } })
          console.log(await Room.findOne({room:id}), id)
          const allRooms = await Room.find();
          res.status(200).json(allRooms);
        } catch (error) {
            next(error);
        }
    }
  );

  router.post(
    "/removeUser",
    async (req, res, next) => {
      const { id, user } = req.body;
      try {
          //se ha de poner una validacion para si es el octavo impedir que pueda entrar más gente y si ya hay 8 impedir que entre él
          const thisRoom = await Room.findOneAndUpdate({room:id}, { $pull:{ users: user } }, {new:true})
          console.log(await Room.findOne({room:id}), id)
          if(thisRoom.users.length === 0){
            await Room.findOneAndDelete({room:id})
          }
          const allRooms = await Room.find();
          res.status(200).json(allRooms);
        } catch (error) {
            next(error);
        }
    }
  );


  router.get(
    "/getAllRooms",
    async (req, res, next) => {
        try {
        // revisa si el usuario existe en la BD
            const allRooms = await Room.find();
            res.status(200).json(allRooms);
            return;
        } catch (error) {
        next(error);
        }
    }
  )


module.exports = router;