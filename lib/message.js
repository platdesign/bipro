'use strict';



module.exports = class Message {

	constructor(name, config) {
		this.name = name;
		this.config = config;
	}

	match(buf, ctx, protocol) {
		return this.config.schema.every(schema => {

			let type = protocol._getType(schema.type);
			let key = type._config.key || schema.key;

			let res = ctx.data[key] = type.match(buf, ctx, schema, protocol);

			if(res === null) {
				return false;
			}

			return true;
		}) && ctx.offset === buf.length;
	}

	compose(protocol, data) {

		return Buffer.concat(this.config.schema.map(tile => {

			let type = protocol._getType(tile.type);

			let key = tile.key || type._config.key;

			let value = tile.static === true ? tile.default : data[key];

			return type.compose(value, data, tile, protocol);
		}));

	}

}
