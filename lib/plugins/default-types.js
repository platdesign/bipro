'use strict';

const Joi = require('joi');

module.exports = function(protocol, options) {

	function createIntType(size, type) {
		return {
			schemaValidation: {
				bits: Joi.object()
			},
			parse: (buf, ctx, schema) => {
				let res = buf['read'+type](ctx.offset);
				ctx.offset += size;

				if(!schema.bits) {
					return res;
				}

				let obj = {};

				Object.keys(schema.bits).forEach(key => {
					let bit = schema.bits[key];

					let val = res & 1 << bit;

					obj[key] = val !== 0;

				});

				return obj;

			},
			compose: (value, data, schema, protocol) => {

				if(!schema.bits) {
					let buf = new Buffer(size);
					buf['write'+type](value);
					return buf;
				}

				let store = 0;

				Object.keys(schema.bits).forEach(key => {
					let bit = schema.bits[key];
					if(value[key] === true) {
						store |= 1 << bit;
					}
				});


				let buf = new Buffer(size);
				buf['write'+type](store);
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







	// protocol.defineType('char', {
	// 	compose(char, data, schema, protocol) {
	// 		if(!char) {
	// 			char = [' '];
	// 		}

	// 		return Buffer.from(char[0], schema.encoding || 'utf8');
	// 	},
	// 	parse(buf, ctx, schema, protocol) {
	// 		let res = buf.toString(schema.encoding || 'utf8', ctx.offset, ctx.offset+1);
	// 		ctx.offset++;
	// 		return res;
	// 	}
	// });







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

				let buf = Buffer.alloc(size);
				buf.fill(0);
				buf.write(string.slice(0, size), 0, size, schema.encoding);
				return buf;

				//return Buffer.from(string.slice(0, size), schema.encoding);
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

			if(size === null) {
				return false;
			}

			if(size === 0) {
				return '';
			}

			let res = buf.toString(schema.encoding, ctx.offset, ctx.offset+size);
			ctx.offset += size;

			let index = res.indexOf('\u0000');
			index = index <= 0 ? size : index;
			return res.substr(0, index);

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
			arr = arr || [];

			let size;
			let sizeByte = false;

			if(schema.size) {
				size = schema.size;
			} else {
				let sizeType = protocol._getType(schema.sizeType);
				size = arr.length;
				sizeByte = sizeType.compose(size, data, {}, protocol);
			}

			let itemType = protocol._getType(schema.items.type);


			let arrBuffer = Buffer.concat(arr.filter((item, index) => index < size).map(item => itemType.compose(item, data, schema.items, protocol)));

			if(sizeByte) {
				return Buffer.concat([
					sizeByte,
					arrBuffer
				]);
			} else {
				return arrBuffer;
			}


		},
		parse(buf, ctx, schema, protocol) {
			let res = [];

			let size;
			if(schema.size) {
				size = schema.size;
			} else {
				let sizeType = protocol._getType(schema.sizeType);
				size = sizeType.match(buf, ctx, schema, protocol);
			}

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
