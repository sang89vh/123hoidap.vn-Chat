module.exports = {
  tableName: 'User',
  attributes: {
	first_name: 'STRING',
	last_name: 'string',
	email: 'string',
	total_new_message: 'integer',
	avatar: {
		$id: 'String'
	}
  }
};
