var passport = require('passport');
function isWS(req){
	return req.protocol=='ws' || req.protocol=='wss' || req.protocol=='WS' || req.protocol=='WSS';
}
module.exports = {
   index: function (req, res){
		var name = 'x';
		var obj = {name: 'izzi'};
		memcache_client.set('chat/name', {name: 'izzi', type: 'json'});
		memcache_client.get('chat/name',function(err,result){
			console.log(JASON.stringify(obj));
			res.send({action: 'index'});
		});
		
   }
   ,login: function (req, res) {
		//var data = session_decode('firstName|s:5:"Kevin";midName|s:3:"van";surName|s:9:"Zonneveld"');	
		if(!isWS(req)){
			if(!req.isAuthenticated()){
				return res.send('Qapolo chat. Vui lòng đăng nhập');
			}else{
				return res.send('Qapolo chat. Đăng nhập thành công');
			}
		}else{
			res.send({status: 404});
		}
   }
   , process: function (req, res){
		if(!isWS(req)){
			passport.authenticate('local', function(err, user, info)
			{
				if ((err) || (!user))
				{
					return res.redirect('/auth/login');
					
				}
				req.logIn(user, function(err)
				{
					if (err)
					{
						return res.redirect('/auth/login');
						
					}
					var data = req.flash('req');
					if(data && data[0].ref){
						var ref = data[0].ref;
						req.flash('data',{params: data[0].params, ref: data[0].ref});
						return res.redirect(ref);
					}else{
						return res.redirect('/auth/login');
					}
				});
			})(req, res);
		}else{
			res.send({status: 404});
		}
   }
   , logout: function (req, res){
		if(!isWS(req)){
			req.logout();
			res.redirect('/auth/login');
		}else{
			res.send({status: 404});
		}
   }
   , notFound: function( req, res){
		res.send({status: 404});
   }
};
