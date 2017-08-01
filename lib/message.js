'use strict';

const Joi = require('joi');


const DEFAULT_ATTR_SCHEMA = {
	key: Joi.string(),
	type: Joi.string().required(),
	default: Joi.any().when('static', { is:true, then: Joi.required() }),
	static: Joi.boolean().default(false),
	required: Joi.boolean().default(false)
};



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

			let vschema = Object.assign({}, DEFAULT_ATTR_SCHEMA, type._config.schemaValidation || {});

			let res = Joi.validate(schema, Joi.object().keys(vschema));

			if(res.error) {
				throw res.error;
			}

			return type.transformSchema(res.value, protocol);
		});




	}

	match(buf, ctx, protocol) {
		return this.config.schema.every(schema => {

			let type = protocol._getType(schema.type);
			let key = type._config.key || schema.key;

			let res = ctx.data[key] = type.match(buf, ctx, schema, protocol);

			if(res === null) {
				ctx.info = {
					failedKey: key
				};
				return false;
			}

			return true;
		})// && ctx.offset === buf.length;
	}

	compose(protocol, data) {

		return Buffer.concat(this.config.schema.map(tile => {

			let type = protocol._getType(tile.type);

			let key = tile.key || type._config.key;

			let value = tile.static === true ? tile.default : (data[key] || tile.default);

			return type.compose(value, data, tile, protocol);
		}));

	}

}
