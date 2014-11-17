module.exports = {
  tableName: 'ChatUserUnread',
  attributes: {
		user: 'string',
		room: 'string',
		room_name: 'string',
		message: 'string',
		status: 'string', // 1 - active, 0 - inactive
  }
};
