'use strict';

const Joi = require('joi');

const DEFAULT_ATTR_SCHEMA = {
	key: Joi.string(),
	type: Joi.string().required(),
	default: Joi.any().when('static', { is:true, then: Joi.required() }),
	static: Joi.boolean().default(false),
	required: Joi.boolean().default(false)
};

module.exports = class Type {

	constructor(name, config) {
		this._config = config;
	}

	compose(value, data, schema, protocol) {
		value = value || schema.default;
		try {
			return this._config.compose(value, data, schema, protocol);
		} catch(e) {
			console.log(`\nError in schema with value ${value}\n\n` , schema.key);
			throw e;
		}
	}

	match(buf, ctx, schema, protocol) {

		let val = this._config.parse(buf, ctx, schema, protocol);

		if(schema.static === true) {
			return val === schema.default ? val : null;
		}


		return val;
	}

	transformSchema(schema, protocol) {

		if(this._config.transformSchema) {
			schema = this._config.transformSchema(schema, protocol);
		}

		let vschema = Object.assign({}, DEFAULT_ATTR_SCHEMA, this._config.schemaValidation || {});

		let res = Joi.validate(schema, Joi.object().keys(vschema));

		if(res.error) {
			throw res.error;
		}

		return res.value;



		// if(this._config.schemaValidation) {
		// 	let res = Joi.validate(schema, this._config.schemaValidation, {allowUnknown:true});

		// 	if(res.error) {
		// 		throw res.error;
		// 	}

		// 	schema = res.value;
		// }





		return schema;
	}



	// validateSchema(schema) {
	// 	if(this._config.schemaValidation) {
	// 		this._config.schemaValidation
	// 	}
	// }
}
