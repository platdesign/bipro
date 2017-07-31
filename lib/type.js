'use strict';


module.exports = class Type {

	constructor(name, config) {
		this._config = config;
	}

	compose(value, data, schema, protocol) {
		return this._config.compose(value, data, schema, protocol);
	}

	match(buf, ctx, schema, protocol) {

		let val = this._config.parse(buf, ctx, schema, protocol);

		if(schema.static === true) {
			return val === schema.default ? val : null;
		}


		return val;
	}


}
