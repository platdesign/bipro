'use strict';

const Joi = require('joi');



module.exports = class Type {

	constructor(name, config) {
		this._config = config;
	}

	compose(value, data, schema, protocol) {
		value = value || schema.default;
		try {
			return this._config.compose(value, data, schema, protocol);
		} catch(e) {
			console.log(e);
			console.log(`\nError in schema with value ${value}\n\n` , schema);
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

		if(this._config.schemaValidation) {
			let res = Joi.validate(schema, this._config.schemaValidation, {allowUnknown:true});

			if(res.error) {
				throw res.error;
			}

			schema = res.value;
		}

		if(this._config.transformSchema) {
			schema = this._config.transformSchema(schema, protocol);
		}



		return schema;
	}

	// validateSchema(schema) {
	// 	if(this._config.schemaValidation) {
	// 		this._config.schemaValidation
	// 	}
	// }
}
