function isWS(req){
	return req.protocol=='ws' || req.protocol=='wss' || req.protocol=='WS' || req.protocol=='WSS';
}
/*
 * Tất cả các action ở đây trừ index đều dùng cho WS, giá trị trả về phải là json.
*/
module.exports = {
   // TODO. App chat
   index: function (req, res){
		// noi tinh yeu bat dau, noi tinh yeu ket thuc :)
		if(req.session.passport.qapolosessionid){
			if(req.session.passport.qapolosessionid!=req.cookies.QAPOLOSESSIONID){
				req.session.passport.qapolosessionid = req.cookies.QAPOLOSESSIONID;
				req.logout();
				res.redirect('/');
			}
		}else{
			req.session.passport.qapolosessionid = req.cookies.QAPOLOSESSIONID;
		}
		if(!isWS(req)){
			res.view();
		}else{
			res.send({status: 404});
		}
   }
   
   ,test: function (req, res){
		console.log(req);
		res.json({status: 1});
   }
   
   /* TODO. Hành động gửi message
	* Ai gửi (user)
	* Gửi đến đâu (room)
	* Nội dung gửi (content)
   */
   ,send: function (req, res){
		var user = req.session.passport.user;
		var room = req.param('room');
		var text = req.param('text');
		var date = new Date();
		if(user){
			if(text){
				text = text.replace(/<script[^>]*>/gi,'').replace(/<\/script>/gi,'');
				console.log(text);
			}
			var zmessage = new Zchat.Zmessage(room, user, text);
			zmessage.broadcast();
			zmessage.saveToDB();
		}
		res.json({ app: 'chat', action: 'send'});
   }
   , readMessage: function(req, res){
		var user_id = req.session.passport.user;
		var room_id = req.param('room_id');
		var from = req.param('from');
		if(user_id){
			//?? check user can access message from this room
			var user = ZchatUtils.findUser(user_id);
			if(user){
				user.readMessage(res, room_id, from);
			}
		}
   }
   , getNumsNotify: function(req, res){
		var user_id = req.session.passport.user;
		if(user_id){
			var user = ZchatUtils.findUser(user_id);
			if(user){
				user.getNumsNotify(res);
			}
		}
   }
   , resetNotify: function(req, res){
		var user_id = req.session.passport.user;
		if(user_id){
			var user = ZchatUtils.findUser(user_id);
			if(user){
				user.resetNotify();
			}
		}
		res.json({status: 'xxx'});
   }
   , getRoom: function(req, res){
		var room_id = req.param('room_id');
		var room_data = null;
		if(room_id){
			room = ZchatUtils.findZoom(room_id);
		}
		if(room){
			data = room.noticeGetRoom();
		}
		res.json({room: data});
   }
   , getListRoom : function(req, res){
		var user_id = req.session.passport.user; 
		RoomModel.find()
		.where({ users: [user_id]})
		.exec(function(err, rooms) {
				if(rooms){
					var lstRoom = new Array();
					rooms.forEach(function(proom){
						var room = {};
						var room_name = proom.name;
						var room_id = proom.room_id;
						var user = null; // another user.
						for(var i=0;i<proom.users.length;i++){
							if(user_id!=proom.users[i]){
								user = proom.users[i];
							}
						}
						room.type = proom.type;
						room.room_name = room_name;
						room.room_id = proom.room_id;
						room.user_id = user;
						lstRoom.push(room);
					});
					return res.json({lstRoom: lstRoom});
				}else{
					return res.json({lstRoom: null});
				}
		});
   }
   , createRoom: function (req, res){
		var user_id = req.session.passport.user;
		var another_user_id = req.param('userid');
		var room_name = null;
		var room_id = null;
		var online = 'off';
		var type = null;
		var status = 1; // { status:  - room_created ,  - no_room_created ,  - user_not_found }, { online: on, off ; room_id: 123}, { online: on, off }
		
		if(another_user_id==user_id){ // room khong the co 1 nguoi 
			status = 'user_is_yourself';
			return res.json({status: status, online: online, room_id: room_id, another_user: another_user_id,   user: user_id, room_name: room_name, type: type});
		}else{
			var another_user = ZchatUtils.findUser(another_user_id);
			if(another_user){ // user da load len app
				online = 'on';
				var room_id = null;
				var user_2 = [user_id, another_user_id];
				var hash_2 = '';
				var room = null;
				room_name = another_user.name + '/' + ZchatUtils.findUser(user_id).name;
				// check room be created
				user_2.sort();
				hash_2 = user_2[0] + user_2[1];
				room = ZchatUtils.findZoomByHash(hash_2);
				if(room){
					status = 'old_room_created';
					room_id = room.room_id;
				}else{
					// create new room.
					status = 'new_room_created';
					room = ZchatUtils.createNewRoom(user_id, another_user_id);
					room_id = room.room_id;
				}
				// get another user status
				if(another_user.status==0){
					online = 'off';
				}
				return res.json({status: status, online: online, room_id: room_id, another_user: another_user_id, user: user_id, room_name: room_name, type: 0});
			}else{ // load user tu db
				status = 'user_not_found';
				UserModel.findOne({id:another_user_id}).done(function(err, puser){
					if(puser){
						status = 'new_room_created';
						// load user to app, 
						var user = new Zchat.Zuser(puser.id);
						user.status = 0;
						user.name = puser.first_name + ' ' + puser.last_name;
						user.email = puser.email;
						Zusers.push(user); 
						room_name = user.name;
						//create new room
						status = 'new_room_created';
						room = ZchatUtils.createNewRoom(user_id, another_user_id);
						room_id = room.room_id;
					}
					return res.json({status: status, online: online, room_id: room_id, another_user: another_user_id, user: user_id, room_name: room_name, type: 0});
				});
			}
		}
   }
   
   ,addUser: function(req, res){
		var user = req.session.passport.user;
		var room_id = req.param('room_id');
		var user_id = req.param('user_id');
		var data = null;
		if(room_id && user_id){
			var room = ZchatUtils.findZoom(room_id);
			if(room){
				if(room.isUserExist(user_id)){
					// nguoi dung da co
				}else{
					// nguoi dung chua co. Tao mot room moi dua tren room hien tai
					var user_new = ZchatUtils.findUser(user_id);
					if(user_new){
						var room_new = ZchatUtils.copyRoom(room, user_new);
						// thong bao co user moi duoc them vao room.
						data = room_new.noticeAddUserToRoom(room_id, user_id);
					}
				}
			}
		}
		res.json({addUser: data});
   }
   /* TODO. Hành động xem lại lịch sủ chát
	* Ai cần xem (user)
	* Xem nội dung của room nào (room)
	* Xem từ , đến
   */
   ,hist: function (req, res){
		var socket = ZchatUtils.findSocket(req.socket);
		res.json({ app: 'chat', action: 'send'});
   }
   
   ,changePageContent: function(req, res){
		var data = req.param('data');
		console.log(data);
		ZchatUtils.changePageContent(req.socket, data);
		return res.json({status: -1});
   }
};