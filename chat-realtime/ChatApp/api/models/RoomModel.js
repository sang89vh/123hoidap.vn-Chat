module.exports = {
  tableName: 'ChatRoom',
  attributes: {
		room_id: 'string',
		users: 'array',
		hash: 'string',
		name: 'string',
		create_date: 'date',
		create_by: 'string',
		type: 'integer'
  }
};
