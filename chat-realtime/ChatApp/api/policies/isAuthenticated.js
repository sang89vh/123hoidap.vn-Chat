/**
 * isAuthenticated
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
function isWS(req){
	return req.protocol=='ws' || req.protocol=='wss' || req.protocol=='WS' || req.protocol=='WSS';
}
module.exports = function(req, res, next) {

	// User is allowed, proceed to the next policy, 
	// or if this is the last policy, the controller
	if (req.session.passport.user){ // với phép check này, khi session đã bị timeout thì socket vẫn chưa close.
		if(isWS(req)){
			return next();
		}else{
			if(req.target.action=='index'){
				return next();
			}else{
				return res.redirect('/auth/notFound');
			}
		}
	}
	req.flash('req', {params: req.params.all(), ref: req.path});
	return res.redirect('/auth/process');
	// User is not allowed
	// (default res.forbidden() behavior can be overridden in `config/403.js`)
	return res.forbidden('Qapolo. Please login!');
};
