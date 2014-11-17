Zsockets = new Array();
ZsocketsGuest = new Array();
Zusers = new Array();
Zrooms = new Array();
/* setting up auto load. Load rooms, Users
*/
autoload = function autoload(){
	if(typeof UserModel != 'undefined' && typeof RoomModel != 'undefined' && typeof ZchatUtils != 'undefined' && typeof Zchat !='undefined'){
		var users_id = new Array();
		clearInterval(izzi_loader);
		RoomModel.find().done(function(err,rooms){
			var room = null;
			for(i=0;i<rooms.length;i++){ 
				var users = rooms[i].users;
				for(j=0;j<users.length;j++){
					if(users_id.indexOf(users[j])<0){
						// push user to users list to load
						users_id.push(users[j]);
					}
				}
			}
			// load user.
			UserModel.find()
			.where({ id:  users_id})
			.exec(function(err, users) {
				if(users){
					for(i=0;i<users.length;i++){ 
						var user = new Zchat.Zuser(users[i].id);
						user.status = 0;
						user.numsNotify = users[i].total_new_message;
						user.name = users[i].first_name + ' ' + users[i].last_name;
						user.email = users[i].email;
						Zusers.push(user);
					}
				}
				console.log('Load users: OK');
				// load room
				for(i=0;i<rooms.length;i++){ 
					var users = rooms[i].users;
					var room_key = ZchatUtils.findUser(rooms[i].create_by);
					var room_id = rooms[i].room_id;
					var room = new Zchat.Zroom(room_id, room_key);
					for(j=0;j<users.length;j++){
						if(rooms[i].create_by!=users[j]){
							room.users.push(ZchatUtils.findUser(users[j]));
						}
					}
					room.name = rooms[i].name;
					room.type = rooms[i].type;
					room.create_by = rooms[i].create_by;
					room.saveHash();
					Zrooms.push(room);
				}
				console.log('Load rooms: OK');
				console.log('Users:' + Zusers.length + ', Rooms:' + Zrooms.length);
			});
		});
	}
}
izzi_loader = setInterval(autoload, 1000);
module.exports.utils = function(){
	this.NUM_MSG = 20;
	this.changeOnline = function(){
		/* bo code load online
		var users_online = new Array();
		for(i=0;i<Zusers.length;i++){
			if(Zusers[i].status==1){
				console.log('#online' + i);
				var user = {};
				user.id = Zusers[i].user_id;
				user.name = Zusers[i].name;
				users_online.push(user);
			}
		}
		for(i=0;i<Zsockets.length;i++){
			Zsockets[i].socket.emit('chat/online', {users: users_online});
		}
		*/
	}
	this.findUser = function(pUser_id){
		var user = null;
		Zusers.forEach(function(Zuser){
			if(Zuser.user_id==pUser_id){
				user = Zuser;
			}
		});
		// find in DB.
		if(!user){
			UserModel.findOne({id: pUser_id},function(err,puser){
				if(puser){
					var user = puser;
					// create Zuser for app.
					user = new Zchat.Zuser(puser.id);
					user.name = puser.first_name + ' ' + puser.last_name;
					user.email = puser.email;
					user.online = 0;
					Zusers.push(user);
				}
			});
		}
		return user; // ref
	};
	this.findSocket = function(pSocket){ 
		var socket = null;
		Zsockets.forEach(function(Zsocket){
			if(Zsocket.socket==pSocket){
				socket = Zsocket;
			}
		});
		return socket; // ref
	}
	this.findSocket_idx = function(pSocket){
		var idx = -1;
		var ZsocketsLength = Zsockets.length;
		for(i=0;i<ZsocketsLength;i++){
			if(Zsockets[i].socket==pSocket){
				idx = i;
			}
		}
		return idx;
	}
	this.findZoom = function(pRoom_id){
		var room = null;
		Zrooms.forEach(function(Zroom){
			if(Zroom.room_id==pRoom_id){
				room = Zroom;
			}
		});
		return room; // ref
	}
	
	this.findZoomByHash = function(pRoomHash){
		var room = null;
		Zrooms.forEach(function(Zroom){
			if(Zroom.hash==pRoomHash){
				room = Zroom;
			}
		});
		return room; // ref
	}
	
	this.createNewRoom = function(userid1, userid2){
		var user1 = ZchatUtils.findUser(userid1);
		var user2 = ZchatUtils.findUser(userid2);
		var room_id = 'r' + (new Date()).getTime();
		var room_new =  new Zchat.Zroom(room_id, user1);
		if(user2){
			room_new.users.push(user2);
			room_new.name = user2.name.split(' ')[0] + ' - ' + user1.name.split(' ')[0];
		}
		room_new.saveHash();
		Zrooms.push(room_new);
		// save room_new to db
		room_new.saveToDB();
		return room_new;
	}
	this.copyRoom = function(room, user){
		var room_new = null;
		if(room.isUserExist(user.user_id)){
			// user da co trong room. khong lam gi ca
		}else{
			// user chua co trong room
			if(room.users.length==2){
				// room hien tai chi co 2 user -> tao moi room
				room_new = this.createNewRoom(null, null);
				room.copyTo(room_new);
				room_new.users.push(user);
				Zrooms.push(room_new);
			}else{
				// room hien tai co > 2 user, giu nguyen room hien tai
				room_new = room;
				room_new.users.push(user);
			}
		}
		room_new.saveHash();
		return room_new;
	}
	this.removeSocket = function(pSocket){
		var socket = this.findSocket(pSocket);
		if(socket){
			socket.remove();
		}
	}
	
	this.getUserName = function(user_id){
		var user = this.findUser(user_id);
		if(user){
			return user.name;
		}
	}
	this.getRoomName = function(room_id){
		var room = this.findZoom(room_id);
		if(room){
			return room.name;
		}
		return null;
	}
	
	this.changePageContent = function(psocket, data){
		var socket = ZchatUtils.findSocket(psocket);
		var func_code = socket.func_code;
		var code_1 = socket.code_1;
		for(var i=0;i<Zsockets.length;i++){
			if(socket!=Zsockets[i]){
				// chi gui lai cho nhung sockets khac
				if(Zsockets[i].func_code == func_code && Zsockets[i].code_1==code_1){
					// chi gui cho nhung socket dang trong cung chuc nang.
					Zsockets[i].socket.emit('chat/updatePageContent', {func_code: func_code, code_1: code_1, data: data});
				}
			}
		}
	}
	this.saveMessage = function(pMessage){
	}
	
	this.saveUser = function(pUser){
	}
	
	this.saveRoom = function(pRoom){
	}
	this.__getTime = function(){
		return new Date().getTime();
	}
	this.getLastParam = function(str){
		str = str.toString();
		var words = str.split('/');
		console.log('words'); console.log(words);
		if(words){
			if(words[words.length-1]!="") return words[words.length-1];
			if(words[words.length-1]=="") return words[words.length-2];
		}
		return null;
	}
	this.sameElements = function(c, d,referenceCheck) {
     return c.equals(d,referenceCheck);  //call .equals of Array.prototype.
	}
}

/** các class Zuser, Zroom, Zsocket, Zmessage cho ứng dụng CHAT
 * Một Zuser có thể có nhiều Zsocket
 * Một Zroom có thể có nhiều người
 * Zsocket khi chưa authenticate thì có this.user = null; dùng cho Guest.
*/
module.exports.Zuser = function(user_id){
	this.sockets = new Array();
	this.user_id = user_id;
	this.status = 1; // 1 - online, 0 - offline
	this.zooms = new Array();
	this.name = null;
	this.email = null;
	this.avatar_id = null;
	this.numsNotify = null;
	this.remove = function(){
		var user_idx = Zusers.indexOf(this);
		// remove user
		Zusers.remove(user_idx);
	}
	this.changeStatus = function(status){
		this.status = status;
	}
	this.updateInfo = function(){
		UserModel.findOne({ id: this.user_id }, function(err, user) {
			this.email = user.email;
			this.name = user.first_name + ' ' + user.last_name;
		});
	}
	this.getNumsNotify = function(res){
		var nums = 0;
		console.log('nums notify:' + this.numsNotify)
		if(this.numsNotify){
			nums = this.numsNotify;
		}
		res.json({nums: nums});
	}
	this.resetNotify = function(){
		var user_id = this.user_id;
		var xthis = this;
		// update DB. set user.total_new_message to 0
		console.log('reset notify user_id:' + user_id);
		UserModel.update({ id: user_id },{total_new_message:0},function(err, user){
			if(user){
				xthis.numsNotify = 0;
				// not update read message here. message will be mark read until it be read.
				for(var i=0;i<xthis.sockets.length;i++){
							xthis.sockets[i].socket.emit('chat/resetNotify', {status: 1});
				}
				if(false)
				ChatUnreadModel.update(
					{user: user_id},
					{status: '0'},
					function(err, unreads){
						for(var i=0;i<xthis.sockets.length;i++){
							xthis.sockets[i].socket.emit('chat/resetNotify', {status: 1});
						}
						console.log('xthis.numsNotify = 0;');
						
					});
			}
		});
	}
	this.readMessage = function(res, room_id, from){
		var data = new Array();
		var data_room = {};
		if(from==0){
			// send room info too
			var room = ZchatUtils.findZoom(room_id);
			data_room.room_name = room.name;
			data_room.users = new Array();
			if(room){
				var users = room.users;
				users.forEach(function(user){
					var a_user = {user_id: user.user_id, user_name: user.name};
					data_room.users.push(a_user);
				});
			}
			// mark room be read; 1111
			xthis = this;
			ChatUnreadModel.update(
					{user: xthis.user_id, room:room_id},
					{status: '0'},
					function(err, unreads){
					}
			);
		}
		MessageModel.find()
		.where({ to:  room_id}) // who send?
		.skip(from)
		.limit(ZchatUtils.NUM_MSG)
		.sort('create_date desc')
		.exec(function(err, messages) {
			if(messages){
				for(i=0;i<messages.length;i++){
					var msg = {};
					var from = messages[i].from;
					var from_name = ZchatUtils.getUserName(from);
					msg.text = messages[i].content;
					msg.date = messages[i].create_date;
					msg.room_id = messages[i].to;
					msg.user_name = from_name;
					msg.user = from;
					data.push(msg);
				}
			}
			res.json({ messages: data, room: data_room});
		});
	}
}
/*
	room_id: string
	user_key: object
*/
module.exports.Zroom =  function(room_id, user_key){
	this.users = new Array(); 
	if(user_key){
		this.users.push(user_key);
	}
	this.type = 0; // 0 - 2 user, 1 - group
	this.room_id = room_id;
	this.hash = null;
	this.name = null;
	this.create_by = user_key;
	this.saveHash = function(){
		// recompute hash value and save it
		var users_id = new Array();
		var hash = '';
		for(var i=0;i<this.users.length;i++){
			users_id.push(this.users[i].user_id);
		}
		users_id.sort();
		for(var i=0;i<users_id.length;i++){
			hash = hash + users_id[i];
		}
		if(hash=='') {
			this.hash = null;
		}else{
			this.hash = hash;
		}
	}
	this.isRoomOne = function(){
		if(this.type==0) return true;
		return false;
	}
	this.isUserExist = function(user_id){
		var isExist = false;
		for(var i=0;i<this.users.length;i++){
			if(this.users[i].user_id==user_id){
				isExist = true;
			}
		}
		return isExist;
	}
	this.copyTo = function(room){
		// copy user
		for(var i=0;i<this.users.length;i++){
			room.users.push(this.users[i]);
		}
	}
	this.noticeAddUserToRoom = function(old_room_id, user_new_id){
		var users = new Array();
		var new_room_id = this.room_id;
		for(var i=0;i<this.users.length;i++){
			users.push(this.users[i].user_id);
		}
		var data = {old_room_id: old_room_id, new_room_id: new_room_id, users: users,new_user_id: user_new_id}
		return data;
	}
	this.noticeGetRoom = function(){
		var users = new Array();
		var new_room_id = this.room_id;
		for(var i=0;i<this.users.length;i++){
			users.push(this.users[i].user_id);
		}
		var data = {room_id: this.room_id, users: users};
		return data;
	}
	this.saveToDB = function(){
		var users_id = new Array();
		this.users.forEach(function(puser){
			users_id.push(puser.user_id);
		});
		var xthis = this; // temp object of this.
		RoomModel.findOne({ hash: xthis.hash }, function(err, proom) {
				// save room to db because it's not created before
				if(!proom){
					RoomModel.create({
						room_id: xthis.room_id,
						users: users_id,
						hash: xthis.hash,
						name: xthis.name,
						create_date: (new Date()),
						create_by: xthis.users[0].user_id,
						type: xthis.type
					}).done(function(err, pzoom) {
						console.log('error:' + err + ', zoom:' + pzoom);
					});
				}
		});
	}
}
/*
	socket: Object {Socket}
	Zuser: Object 
*/
module.exports.Zsocket = function(socket, Zuser){
	this.socket = socket;
	this.user = Zuser;
	this.func_code = "home";
	this.code_1 = null;
	this.code_2 = null;
	this.remove = function(){
		var socket_idx = Zsockets.indexOf(this);
		// remove socket from Zsockets
		Zsockets.remove(socket_idx);
		if(this.user){
			// remove socket from user
			var socket_idx = this.user.sockets.indexOf(this);
			this.user.sockets.remove(socket_idx);
			// change user status to offline when don't have any sockets open.
			if(this.user.sockets.length==0){
				this.user.changeStatus(0); // user offline
				ZchatUtils.changeOnline();
			}
		}
	}
	this.updateFuncCode = function(){
		var list_article_by_subject = 'list_article_by_subject'
		var list_question_by_subject = 'list_question_by_subject'
		var list_subject = 'list_subject';
		var question = 'question_detail';
		var article = 'article_detail';
		var referer = this.socket.manager.handshaken[socket.id].headers.referer;
		if(referer){
			var subject = /\/subject/;
			var subject_article = /\/subject\/detail\/article\/[0-9,a-z]+\// ;
			var subject_question = /\/subject\/detail\/question\/[0-9,a-z]+\// ;
			
			var question_detail = /\/question\/detail\/[0-9,a-z]+\// ;
			var article_detail = /\/article\/detail\/[0-9,a-z]+\// ;
			
			var str = null;
			// Danh sach article theo chu de
			str = referer.match(subject_article);
			if(str){
				this.func_code = list_article_by_subject;
				this.code_1 = ZchatUtils.getLastParam(str);
				return;
			}else{
				str = referer.match(subject);
				if(str){
					this.func_code = list_subject;
					return;
				}
			}
			
			
			// danh sach Question theo chu de
			str = referer.match(subject_question);
			if(str){
				this.func_code = list_question_by_subject;
				this.code_1 = ZchatUtils.getLastParam(str);
				return;
			}else{
				str = referer.match(subject);
				if(str){
					this.func_code = list_subject;
					return;
				}
			}
			
			
			// chi tiet bai viet
			str = referer.match(article_detail);
			if(str){
				this.func_code = article;
				this.code_1 = ZchatUtils.getLastParam(str);
				return;
			}
			
			
			// chi tiet cau hoi
			str = referer.match(question_detail);
			if(str){
				this.func_code = question;
				this.code_1 = ZchatUtils.getLastParam(str);
				return;
			}
			
		}
	}
	
}

/*
	zuser: string
	zroom: string
	text: string
*/
module.exports.Zmessage = function Zmessage(Zroom_id, Zuser_id, text){
	this.message_id = 'm_' + (new Date()).getTime();
	this.from = Zuser_id;
	this.to = Zroom_id;
	this.text = text;
	this.time = new Date();
	this.user_unread = new Array();
	this.broadcast = function(){
		var from_name = ZchatUtils.findUser(this.from).name;
		var room = ZchatUtils.findZoom(this.to);
		if(room){
			for(var i=0;i<room.users.length;i++){
				if(room.users[i].status==1){
					for(var j=0;j<room.users[i].sockets.length;j++){
						room.users[i].sockets[j].socket.emit('chat/msg',{
							from: this.from, 
							from_name: from_name, 
							room: this.to, 
							text: text, 
							date: this.time
						});
					}
				}else{
					// user offline.
					this.user_unread.push(room.users[i]);
				}
			}
		}
	}
	this.saveToDB = function(){
		MessageModel.create({
			message_id: this.message_id,
			from: this.from,
			to: this.to,
			create_date: this.time,
			content: this.text
		}).done(function(err, pmessage) {
			if(err){
				console.log('error when save message to DB');
			}
		});
		var user_unread = this.user_unread;
		var user_unread_length = this.user_unread.length;
		var i_iter = 0;
		for(i_iter;i_iter<this.user_unread.length;i_iter++){
			console.log('inter:' + i_iter);
			ChatUnreadModel.create({
				user: this.user_unread[i_iter].user_id,
				room: this.to,
				status: '1',
				room_name: ZchatUtils.findZoom(this.to).name,
				message: this.message_id
			}).done(function(err, punread) {
				console.log('error:' + err + ', punread length:' + user_unread_length + ',i_iter:' + i_iter);
				if(i_iter==user_unread_length){ console.log('call i_iter==length');
					// ensure all unread to be save. compute Notify again for users unread.
					var j_inter = 0;
					for(j_inter;j_inter<user_unread_length;j_inter++){
						console.log('j_inter_for:' + j_inter);
						ChatUnreadModel.find()
						.where({user: user_unread[j_inter].user_id})
						.where({status: '1'})
						.exec(function(err, unreads){
							if(unreads){
								var lst_distinct_room_unreads = new Array();
								for(var j=0;j<unreads.length;j++){
									if(lst_distinct_room_unreads.indexOf(unreads[j].room)<0){
										lst_distinct_room_unreads.push(unreads[j].room);
									}
								}
								// lst_distinct_room_unreads.length be Nums of notify of user. Update DB
								console.log('j_inter_callback:' + j_inter);
								console.log('save total new:' + lst_distinct_room_unreads.length + ' for user_id:' + user_unread[j_inter-1].user_id);
								UserModel.update(
									{ _id: user_unread[j_inter-1].user_id},
									{ total_new_message: lst_distinct_room_unreads.length},
									
									function(err, users){
										console.log('err:' + err);
										console.log(users[0]);
								});
							}
						});
					}
				}
			});
			
		}
	}
}

// extends array remove
Array.prototype.remove = function(idx){
	var len = this.length;
	if(idx==len-1){
		this.pop(); return;
	}
	if(idx>=0 && idx<=len-2){
		for(var i=idx;i<=len-2;i++){
			this[i] = this[i+1];
		}
		this.pop();
	}
}

/* copy code. i don't know
*/
Object.defineProperty(Boolean.prototype, "equals", {
        enumerable: false,
        configurable: true,
        value: function (c) {
            return this == c; //For booleans simply return the equality
        }
    });

Object.defineProperty(Number.prototype, "equals", {
        enumerable: false,
        configurable: true,
        value: function (c) {
            if (Number.prototype.equals.NaN == true && isNaN(this) && c != c) return true; //let NaN equals NaN if flag set
            return this == c; // else do a normal compare
        }
    });

Number.prototype.equals.NaN = false; //Set to true to return true for NaN == NaN

Object.defineProperty(String.prototype, "equals", {
        enumerable: false,
        configurable: true,
        value: Boolean.prototype.equals //the same (now we covered the primitives)
    });

Object.defineProperty(Object.prototype, "equals", {
        enumerable: false,
        configurable: true,
        value: function (c, reference) {
            if (true === reference) //If its a check by reference
                return this === c; //return the result of comparing the reference
            if (typeof this != typeof c) { 
                return false; //if the types don't match (Object equals primitive) immediately return
            }
            var d = [Object.keys(this), Object.keys(c)],//create an array with the keys of the objects, which get compared
                f = d[0].length; //store length of keys of the first obj (we need it later)
            if (f !== d[1].length) {//If the Objects differ in the length of their keys
                return false; //immediately return
            }
            for (var e = 0; e < f; e++) { //iterate over the keys of the first object
                if (d[0][e] != d[1][e] || !this[d[0][e]].equals(c[d[1][e]])) {
                    return false; //if either the key name does not match or the value does not match, return false. a call of .equal on 2 primitives simply compares them as e.g Number.prototype.equal gets called
                }
            }
            return true; //everything is equal, return true
        }
    });
Object.defineProperty(Array.prototype, "equals", {
        enumerable: false,
        configurable: true,
        value: function (c,reference) {

            var d = this.length;
            if (d != c.length) {
                return false;
            }
            var f = Array.prototype.equals.sort(this.concat());
            c = Array.prototype.equals.sort(c.concat(),f)

            if (reference){
                for (var e = 0; e < d; e++) {
                    if (f[e] != c[e] && !(Array.prototype.equals.NaN && f[e] != f[e] && c[e] != c[e])) {
                        return false;
                    }
                }                
            } else {
                for (var e = 0; e < d; e++) {
                    if (!f[e].equals(c[e])) {
                        return false;
                    }
                }
            }
            return true;

        }
    });

Array.prototype.equals.NaN = false; //Set to true to allow [NaN].equals([NaN]) //true
Object.defineProperty(Array.prototype.equals,"sort",{
  enumerable:false,
  value:function sort (curr,prev) {
         var weight = {
            "[object Undefined]":6,         
            "[object Object]":5,
            "[object Null]":4,
            "[object String]":3,
            "[object Number]":2,
            "[object Boolean]":1
        }
        if (prev) { //mark the objects
            for (var i = prev.length,j,t;i>0;i--) {
                t = typeof (j = prev[i]);
                if (j != null && t === "object") {
                     j._pos = i;   
                } else if (t !== "object" && t != "undefined" ) break;
            }
        }

        curr.sort (sorter);

        if (prev) {
            for (var k = prev.length,l,t;k>0;k--) {
                t = typeof (l = prev[k]);
                if (t === "object" && l != null) {
                    delete l._pos;
                } else if (t !== "object" && t != "undefined" ) break;
            }
        }
        return curr;

        function sorter (a,b) {

             var tStr = Object.prototype.toString
             var types = [tStr.call(a),tStr.call(b)]
             var ret = [0,0];
             if (types[0] === types[1] && types[0] === "[object Object]") {
                 if (prev) return a._pos - b._pos
                 else {
                     return a === b ? 0 : 1;
                 }
             } else if (types [0] !== types [1]){
                     return weight[types[0]] - weight[types[1]]
             }
            return a>b?1:a<b?-1:0;
        }

    }

});
