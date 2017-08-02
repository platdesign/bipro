'use strict';

const Joi = require('joi');




module.exports = class Message {

	constructor(name, config, protocol) {
		this.name = name;


		let typeValidators = Object.assign({}, ...Object.keys(protocol._types)
			.map(key => protocol._types[key]._config)
			.map(c => c.schemaValidation)
			.filter(Boolean))

		let vSchema = Joi.object().keys({
			schema: Joi.array().required().items(Joi.object())
		});

		let res = Joi.validate(config, vSchema);

		if(res.error) {
			throw err;
		}
		this.config = res.value;



		this.config.schema = this.config.schema.map(schema => {
			let type = protocol._getType(schema.type);
			return type.transformSchema(schema, protocol);
		});




	}

	match(buf, ctx, protocol) {
		return this.config.schema.every(schema => {

			let type = protocol._getType(schema.type);
			let key = type._config.key || schema.key;

			let res;
			try {
				res = ctx.data[key] = type.match(buf, ctx, schema, protocol);

			} catch(e) {
				console.log(e);
				return false;
			}

			if(res === null) {
				return false;
			}

			return true;
		})// && ctx.offset === buf.length;
	}

	compose(protocol, data) {

		return Buffer.concat(this.config.schema.map(schema => {
			let type = protocol._getType(schema.type);

			let key = schema.key || type._config.key;
			let value = schema.static === true ? schema.default : (data[key] || schema.default);


			return type.compose(value, data, schema, protocol);
		}));

	}

}
