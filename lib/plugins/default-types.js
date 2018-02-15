'use strict';

const Joi = require('joi');
const is = require('is');

module.exports = function(protocol, options) {

	function createIntType(size, type) {
		return {
			schemaValidation: {
				bits: Joi.object().pattern(/.*/, Joi.alternatives().try(

					// single bit value
					Joi.object().keys({
						bit: Joi.number().required(),
						slice: Joi.forbidden(),
						values: Joi.array().max(2).default([true, false])
					}),


					// multi bits value
					Joi.object().keys({
						bit: Joi.forbidden(),
						shift: Joi.number().default(0),
						values: Joi.object().default({}).required(),
						_values: Joi.object().required(),
						size: Joi.number().default(2),
						default: Joi.string()
					}),

				))
			},
			transformSchema(schema, protocol) {
				if(schema.bits) {

					let bits = {};

					Object.keys(schema.bits).forEach(key => {

						let input = schema.bits[key];

						if(is.number(input)) {
							return bits[key] = { bit: input };
						}

						if(is.object(input)) {
							bits[key] = input;
						}

						// turn values obje
						// key:val -> val:key
						//
						// for faster access during composing/parsing
						if(is.object(bits[key].values)) {
							let _values = bits[key]._values = {};

							Object.keys(bits[key].values).forEach(_key => {
								_values[bits[key].values[_key]] = _key;
							});
						}

					});
					schema.bits = bits;
				}

				return schema;
			},
			parse: (buf, ctx, schema) => {
				let res = buf['read'+type](ctx.offset);
				ctx.offset += size;

				if(!schema.bits) {
					return res;
				}

				let obj = {};

				Object.keys(schema.bits).forEach(key => {

					let bitSchema = schema.bits[key];


					if(is.number(bitSchema.bit) && Array.isArray(bitSchema.values)) {
						let bit = schema.bits[key].bit;
						let values = schema.bits[key].values;

						let val = res & 1 << bit;
						obj[key] = (val !== 0) ? values[0] : values[1];
					}

					if(is.object(bitSchema.values)) {

						let bit = bitSchema.shift;

						// TODO: find a neater way to create mask length from given size
						// something like this: 0x((FF)*size)
						let mask = (0xFFFFFF) ^ (0xFFFFFF << (bitSchema.size));

						let value = mask & (res >> bit);

						obj[key] = bitSchema._values[value];
					}

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

					let bitSchema = schema.bits[key];

					if(is.number(bitSchema.bit) && Array.isArray(bitSchema.values)) {
						let bit = bitSchema.bit;
						let values = bitSchema.values;

						if(value && value[key] === values[0]) {
							store |= 1 << bit;
						}
						return;
					}

					if(is.object(bitSchema.values)) {

						let bit = bitSchema.shift;

						let setValue = 0;

						if(is.object(value)) {
							if(!value[key] && bitSchema.default) {
								setValue = bitSchema.values[bitSchema.default];
							} else {
								setValue = bitSchema.values[value[key]];
							}
						}



						store |= setValue << bit;
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

			if(!schema.items) {
				schema.items = 'uint8';
			}

			if(is.string(schema.items)) {
				schema.items = { type: schema.items };
			}


			let type = protocol._getType(schema.items.type);
			schema.items = type.transformSchema(schema.items, protocol);

			return schema;
		},
		compose(arr, data, schema, protocol) {
			arr = arr || [];

			let size;
			let sizeByte = false;

			if(schema.size) {
				if(typeof schema.size === 'string') {
					size = data[schema.size];
				} else {
					size = schema.size;
				}
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

				if(typeof schema.size === 'string') {
					size = ctx.data[schema.size];
				} else {
					size = schema.size;
				}

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
