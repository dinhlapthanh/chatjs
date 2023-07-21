var express = require('express');
var app = express();
let server = require('http').Server(app);
const io = require("socket.io")(server, {
   cors: {
     
   },
});
server.listen(3004, ()=>{
   console.log("server connnet listen 3004");
});

var array_user_socket = {};

/*add user */
function save_user(userId, socketId){
   /*array_user_socket */
   array_user_socket[userId] = {"socket_id":socketId, "uid_user":userId};
};

/*remove user */
function remove_user(uid_user){
   delete array_user_socket[uid_user];
   return uid_user;
};

/*get user */
function get_socket_id (userId) {
   if(!array_user_socket.hasOwnProperty(userId)) return "";
   return array_user_socket[userId].socket_id;
}

/*connect socket */
io.on('connection', (socket) => {
   console.log('have user connected');

   /*take user_id and socket_id form user */
   socket.on("addUser", (userId) =>{

      /*save user_id & socket id to array array_user_socket */
      let socket_id = socket.id;
      save_user(userId, socket.id);
      socket.uid_user = userId;
      console.log(array_user_socket); 

      /*send user id & socket id to socket client */
      io.to(socket.id).emit("getUser", {userId , socket_id});
   })
   
   socket.on("friend_notyfi_message_seen", (message) =>{
      let uid_user = message.uid_user;
      let uid_user_friend = message.uid_user_friend;

      /*get socket id from uid_user_friend */
      let socket_id_friend = get_socket_id(uid_user_friend);

      /*send socket id to socket client */
      if(socket_id_friend != "") io.to(socket_id_friend).emit("friend_notyfi_message_seen", uid_user);
   })

   socket.on("get_friend_socket_id", (uid_user_friend) =>{

      /*get socket id from uid_user_friend */
      let socket_id_friend = get_socket_id(uid_user_friend);

      /*send socket id to socket client */
      if(socket_id_friend != "") io.to(socket.id).emit("socket_id_friend", socket_id_friend);
   })

   /*socket sent messgae if friend not see message  */
   socket.on("sent_message_to_friend", (message) =>{
      let uid_user = message.uid_user;
      let id_message = message.id_message;
      /*get socket id from uid_user_friend */
      let socket_id_friend = get_socket_id(uid_user);
      
      /*send socket id to socket client */
      if(socket_id_friend != "") io.to(socket_id_friend).emit("sent_received_to_user", id_message);
   })

   /*socket sent messgae if friend have seen message  */
   socket.on("msg_received", (message) =>{
      let uid_user = message.uid_user;
      let id_message = message.id_message;
      /*get socket id from uid_user_friend */
      let socket_id_friend = get_socket_id(uid_user);
      
      /*send socket id to socket client */
      if(socket_id_friend != "") io.to(socket_id_friend).emit("sent_msg_seen", id_message);
   })

   /*check user disconnect and emit user online client*/
   socket.on("disconnect", () => {
      remove_user(socket.uid_user);
   });

   /*event user send a message to friend */
   socket.on("socket_message_send", ({uid_user, uid_friend, message, id_message, username, file, location, status_message,}) => {

      /*get socket id from uid_friend */
      let uid_socket_friend = get_socket_id(uid_friend);
      if(uid_socket_friend != ""){

         /*Notify friend a message come */
         io.to(uid_socket_friend).emit("socket_message_come", {uid_user, message, uid_friend, id_message, username, file, location, status_message});
      }

   });

   /*socket on sending message and emit get sending client */
   socket.on("typing", (data)=>{
      let uid_user_friend = data.uid_user_friend;
      let uid_user = data.uid_user;
      let uid_socket_friend = get_socket_id(uid_user_friend);
      let msg = "đang soạn tin nhắn ...";
      if(uid_socket_friend != "") io.to(uid_socket_friend).emit("get_typing", {msg ,uid_user});
   })

   /*socket on stopsending message and emit get sending client */
   socket.on("stop_typing", (data)=>{
      let uid_user_friend = data.uid_user_friend;
      let uid_user = data.uid_user;
      let uid_socket_friend = get_socket_id(uid_user_friend);
      let msg = "";
      if(uid_socket_friend != "") io.to(uid_socket_friend).emit("get_typing", {msg, uid_user});
   })

   /*socket on sending message and emit get sending client */
   socket.on("friend_status", (str_uid_user_friend)=>{

      /*get friend list status */
      let array_friend = str_uid_user_friend.split(",");
      let array_friend_status = [];
      for(let i = 0; i < array_friend.length; i++){
         let uid_user_friend = array_friend[i];
    
         /*check uid_user in user_socket */
         let user_status = "0";
         if(array_user_socket.hasOwnProperty(uid_user_friend)) user_status = "1";

         /*new array_friend_status item */
         array_friend_status[i] = {"uid_user":uid_user_friend,"status":user_status};
        
      }
      io.to(socket.id).emit("friend_list_status", JSON.stringify(array_friend_status));
   })
});
