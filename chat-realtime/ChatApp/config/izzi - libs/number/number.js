/*Array extend. remove element by index
*/
Array.prototype.remove = function(idx){
	var len = this.length;
	if(idx==len-1){
		this.pop(); return;
	}
	if(idx>=0 && idx<=len-2){
		for(i=idx;i<=len-2;i++){
			this[i] = this[i+1];
		}
		this.pop();
	}
}

Zsockets = new Array();
Zusers = new Array();

/*Timer
*/
var izzi_interval = null;
izzi_timer = function izzi_timer(){
	var date = new Date();
	var second = date.getSeconds();
	console.log(second);
	if(second<30){
		clearInterval(izzi_interval);
		izzi_interval = setInterval(izzi_timer, 2000);
	}
	if(second>30){
		clearInterval(izzi_interval);
		izzi_interval = setInterval(izzi_timer, 1000);
	}	
}
//izzi_interval = setInterval(izzi_timer, 2000);

/* utils -> ZnumberUtils
*/
module.exports.utils = function(){
	this.changeOnline = function(){
		// TODO. user change online
	};
	this.findUser = function(pUser_id){
		var user = null;
		Zusers.forEach(function(Zuser){
			if(Zuser.user_id==pUser_id){
				user = Zuser;
			}
		});
		return user; // ref
	};
}

/* Zuser
*/
module.exports.Zuser = function(user_id){
	this.sockets = new Array();
	this.user_id = user_id;
	this.status = 1; // 1 - online, 0 - offline
	this.point = 0;
	this.remove = function(){
		var user_idx = Zusers.indexOf(this);
		// remove user
		Zusers.remove(user_idx);
	}
	this.changeStatus = function(status){
		this.status = status;
	}
	
}

/* Zsocket
*/
module.exports.Zsocket = function(socket, Zuser){
	this.socket = socket;
	this.user = Zuser;
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
				
			}
		}
	}
}

/* Znumber
*/
module.exports.Znumber = function(time){
	this.whos = new Array();
	this.name = '';
	this.status = 0; // 0 - dang dien ra, 1 - ket thuc, 2 - nghi
	this.num_price = 0;
	this.num_online = 0;
	this.num_sum_all = 0;
	this.num_sum_30 = 0;
	this.num_mod_2 = 0;
	this.num_mod_3 = 0;
	this.num_mod_5 = 0;
	this.time_start = ''
	this.time_end = ''
	this.time_next = '';
	// TODO start new
	this.start = function(name, price, time_start){
		this.name = name;
		this.price = price;
		this.time_start = time_start;
	};
	// TODO end
	this.end = function(time_end){
		this.time_end = time_end;
	};
	// TODO end
	this.out = function(time_next){
		this.time_next = time_next;
	}

	// TODO. message out
	this._message_info = function(){
		var data = {
			name: name
			,num_price: num_price
			,num_online: num_online
			,num_sum_all: num_sum_all
			,num_sum_30: num_sum_30
			,num_mod_2: num_mod_2
			,num_mod_3: num_mod_3
			,num_mod_5: num_mod_5
		}
		return data;
	};
	this._message_time = function(){
		var data = { time_curr: (new Date()) };
		return data;
	};
	this._message_out = function(){
		var data = { time_next: this.time_next };
		return data;
	};
}

/*Zwho
*/
module.exports.Zwho = function(user, price){
	this.user = user;
	this.price = price;
	this.time = (new Date());
	this.re_price = function(price){
		this.price = price;
		this.time = (new Date());
		// decreate point: 5;
		this.user.point = this.user.point - 5;
	}
}