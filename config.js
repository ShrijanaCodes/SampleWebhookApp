const env = process.env.NODE_ENV || 'production'
//Provide your credentials here: 
const config = {
	development :{
		APIKey : '',
		APISecret : ''
	},
	production:{	
		APIKey : '',
		APISecret : '',
		VerificationToken: ''
	}
};

module.exports = config[env]