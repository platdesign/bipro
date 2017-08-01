'use strict';


const Code = require('code');
const expect = Code.expect;

const Bipro = require('../lib/bipro');



describe('Types', function() {
	let p;
	beforeEach(() => p = new Bipro.Protocol());

	const test = function(name, schema, payload, expectedOutput, customMatchResult) {

		describe(name, () => {

			it('composing should return expected buffer', () => {

				p.defineMessage('test', { schema });

				let buf = p.compose('test', payload);

				expect(buf).to.equal(Buffer.from(expectedOutput));

			});


			if(!customMatchResult) {
				it('matching should return input payload again', () => {
					p.defineMessage('test', { schema });

					let buf = p.compose('test', payload);

					let { data } = p.match(buf);

					expect(data).to.equal(payload);

				});
			} else {


				it('matching should return custom payload', () => {
					p.defineMessage('test', { schema });

					let buf = p.compose('test', payload);

					let { data } = p.match(buf);

					expect(data).to.equal(customMatchResult);

				});
			}


		});

	};



	describe('array', () => {


		test('default items with sizeByte', [
			{ key:'data', type: 'array' }
		], {
			data: [1,2,3,4]
		}, [4,1,2,3,4]);

		test('custom item type uint16le as string with sizeByte uint8', [
			{ key:'data', type: 'array', items: 'uint16le' }
		], {
			data: [1,2,3,4]
		}, [4, 1, 0, 2, 0, 3, 0, 4, 0]);

		test('custom item type uint16be as string with sizeByte uint8', [
			{ key:'data', type: 'array', items: 'uint16be' }
		], {
			data: [1,2,3,4]
		}, [4, 0, 1, 0, 2, 0, 3, 0, 4]);

		test('custom item type uint16be as string with sizeType uint16le', [
			{ key:'data', type: 'array', items: 'uint16be', sizeType: 'uint16le' }
		], {
			data: [1,2,3,4]
		}, [4, 0, 0, 1, 0, 2, 0, 3, 0, 4]);

		test('custom item type uint16be as string with sizeType uint16le', [
			{ key:'data', type: 'array', items: 'uint16be', sizeType: 'uint16be' }
		], {
			data: [1,2,3,4]
		}, [0, 4, 0, 1, 0, 2, 0, 3, 0, 4]);

		test('custom item type uint16be as object with sizeByte uint8', [
			{ key:'data', type: 'array', items: { type: 'uint16be' } }
		], {
			data: [1,2,3,4]
		}, [4, 0, 1, 0, 2, 0, 3, 0, 4]);

		test('default itemtype with default values', [
			{ key:'data', type: 'array', items: { type: 'uint8', default: 32 } }
		], {
			data: [1,2, undefined, 4]
		}, [4, 1, 2, 32, 4], { data:[1,2,32,4]});

		test('array with fixed size', [
			{ key:'data', type: 'array', size: 4 }
		], {
			data: [1,2, 3, 4]
		}, [1, 2, 3, 4]);

		test('array with fixed size and longer payload', [
			{ key:'data', type: 'array', size: 4 }
		], {
			data: [1,2, 3, 4, 5, 6]
		}, [1, 2, 3, 4], { data: [1, 2, 3, 4] });

		test('array with fixed size and custom items as string', [
			{ key:'data', type: 'array', size: 4, items: 'uint16be' }
		], {
			data: [1,2, 3, 4]
		}, [0, 1, 0, 2, 0, 3, 0, 4]);

		test('array with fixed size and custom items as string and longer payload', [
			{ key:'data', type: 'array', size: 4, items: 'uint16be' }
		], {
			data: [1,2, 3, 4, 5, 6]
		}, [0, 1, 0, 2, 0, 3, 0, 4], { data: [1,2,3,4] });



	});



	describe('string', () => {

		test('with sizeByte', [
			{ key: 'name', type: 'string' }
		], {
			name: 'Joe'
		}, [0x03, 0x4a, 0x6f, 0x65]);

		test('with fixed size', [
			{ key: 'name', type: 'string', size: 3 }
		], {
			name: 'Joe'
		}, [0x4a, 0x6f, 0x65]);

		test('with custom property as size', [
			{ key: 'strlen', type: 'uint8' },
			{ key: 'name', type: 'string', size: 'strlen' }
		], {
			strlen: 3,
			name: 'Joe'
		}, [0x03, 0x4a, 0x6f, 0x65]);


		test('with sizeByte and empty input', [
			{ key: 'name', type: 'string' }
		], {}, [0x00], {name: ''});

	});



	describe('basic types', () => {


		const basicTypeTest = function(config) {

			describe(config.type, () => {




				test('range', [
					{ key: 'a', type: config.type },
					{ key: 'b', type: config.type }
				], {
					a: config.range.min[0],
					b: config.range.max[0]
				}, [
					...config.range.min[1],
					...config.range.max[1]
				]);

			});

		};


		[
			{
				type: 'int8',
				range: {
					min: [-128, [0x80]],
					max: [127, [0x7F]]
				}
			},

			{
				type: 'uint8',
				range: {
					min: [0, [0x00]],
					max: [255, [0xFF]]
				}
			},

			{
				type: 'int16le',
				range: {
					min: [(0 - (256*256/2)+1), [0x01, 0x80]],
					max: [(256*256/2)-1, [0xFF, 0x7F]]
				}
			},

			{
				type: 'int16be',
				range: {
					min: [(0 - (256*256/2)+1), [0x80, 0x01]],
					max: [(256*256/2)-1, [0x7F, 0xFF]]
				}
			},

			{
				type: 'uint16be',
				range: {
					min: [0, [0x00, 0x00]],
					max: [(256*256)-1, [0xFF, 0xFF]]
				}
			},
		].forEach(type => basicTypeTest(type))


	});


});
