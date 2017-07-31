'use strict';

const Joi = require('joi');

module.exports = function(protocol, options) {

	function createIntType(size, type) {
		return {
			parse: (buf, ctx) => {
				let res = buf['read'+type](ctx.offset);
				ctx.offset += size;
				return res;
			},
			compose: value => {
				let buf = new Buffer(size);
				buf['write'+type](value);
				return buf;
			}
		};
	}


	protocol.defineType('int8', createIntType(1, 'Int8'));
	protocol.defineType('uint8', createIntType(1, 'UInt8'));
	protocol.defineType('byte', 'int8');

	protocol.defineType('int16le', createIntType(2, 'Int16LE'));
	protocol.defineType('int16be', createIntType(2, 'Int16BE'));
	protocol.defineType('uint16le', createIntType(2, 'UInt16LE'));
	protocol.defineType('uint16be', createIntType(2, 'UInt16BE'));
	protocol.defineType('shortle', 'int16le');
	protocol.defineType('shortbe', 'int16be');
	protocol.defineType('ushortle', 'uint16le');
	protocol.defineType('ushortbe', 'uint16be');


	protocol.defineType('int32le', createIntType(4, 'Int32LE'));
	protocol.defineType('int32be', createIntType(4, 'Int32BE'));
	protocol.defineType('uint32le', createIntType(4, 'UInt32LE'));
	protocol.defineType('uint32be', createIntType(4, 'UInt32BE'));
	protocol.defineType('longle', 'int32le');
	protocol.defineType('longbe', 'int32be');
	protocol.defineType('ulongle', 'uint32le');
	protocol.defineType('ulongbe', 'uint32be');







	protocol.defineType('char', {
		compose(char, data, schema, protocol) {
			if(!char) {
				char = [' '];
			}

			return Buffer.from(char[0], schema.encoding || 'utf8');
		},
		parse(buf, ctx, schema, protocol) {
			let res = buf.toString(schema.encoding || 'utf8', ctx.offset, ctx.offset+1);
			ctx.offset++;
			return res;
		}
	});







	protocol.defineType('string', {
		schemaValidation: {
			size: Joi.alternatives().try(Joi.number(), Joi.string()),
			sizeType: Joi.string().default('uint8'),
			encoding: Joi.string().valid(['ascii', 'utf8', 'utf16le', 'base64', 'binary', 'hex']).default('utf8')
		},
		compose(string, data, schema, protocol) {
			string = string || '';

			let sizeByte = false;
			let size;

			if(schema.size) {
				if(typeof schema.size === 'string') {
					size = data[schema.size];
				}

				if(typeof schema.size === 'number') {
					size = schema.size;
				}

			} else {
				sizeByte = true;
				size = string.length;
			}

			if(!sizeByte) {
				return Buffer.from(string.slice(0, size), schema.encoding);
			}

			let sizeType = protocol._getType(schema.sizeType);

			return Buffer.concat([
				sizeType.compose(size, data, {}, protocol),
				Buffer.from(string, schema.encoding)
			])
		},
		parse(buf, ctx, schema, protocol) {

			let sizeByte = false;
			let size;

			if(schema.size) {
				if(typeof schema.size === 'string') {
					size = ctx.data[schema.size];
				}

				if(typeof schema.size === 'number') {
					size = schema.size;
				}
			} else {
				sizeByte = true;
				let sizeType = protocol._getType(schema.sizeType);
				size = sizeType.match(buf, ctx, schema, protocol);
			}

			if(!sizeByte) {
				let res = buf.toString(schema.encoding, ctx.offset, ctx.offset+size);
				ctx.offset += size;
				return res;
			}


			if(size === null) {
				return false;
			}

			if(size === 0) {
				return '';
			}

			let res = buf.toString(schema.encoding, ctx.offset, ctx.offset+size);
			ctx.offset += size;
			return res;
		}
	});









	protocol.defineType('array', {
		schemaValidation: {
			size: Joi.alternatives().try(Joi.number(), Joi.string()),
			items: Joi.alternatives().try(
				Joi.string().default('uint8'),
				Joi.object()
			).default({ type: 'uint8' }),
			sizeType: Joi.string().default('uint8')
		},
		transformSchema(schema, protocol) {
			if(typeof schema.items === 'string') {
				schema.items = { type: schema.items };
			}

			let type = protocol._getType(schema.items.type);
			schema.items = type.transformSchema(schema.items);

			return schema;
		},
		compose(arr, data, schema, protocol) {
			let sizeType = protocol._getType(schema.sizeType);
			let size = arr.length;


			let itemType = protocol._getType(schema.items.type);

			return Buffer.concat([
				sizeType.compose(size, data, {}, protocol),
				Buffer.concat(arr.map(item => itemType.compose(item, data, schema.items, protocol)))
			]);

		},
		parse(buf, ctx, schema, protocol) {
			let res = [];

			let sizeType = protocol._getType(schema.sizeType);
			let size = sizeType.match(buf, ctx, schema, protocol);

			if(size === null) {
				return false;
			}

			let itemType = protocol._getType(schema.items.type);

			for(let i = 0; i < size; i++) {

				let val = itemType.match(buf, ctx, schema.items, protocol);
				if(val === null) {
					return null;
				}
				res.push(val);
			}

			return res;
		}
	});




};
