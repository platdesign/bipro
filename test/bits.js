'use strict';


const Code = require('code');
const expect = Code.expect;

const Bipro = require('../lib/bipro');



describe('Bits', function() {


	it('with given numbers should match', () => {

		let pro = new Bipro.Protocol();

		pro.defineMessage('test', {
			schema:[
				{ key: 'config', type: 'uint8', bits: {
					a: 0,
					b: 1,
					c: 2,
					d: 7,
					e: 4,
				}}
			]
		});


		let payload = {
			config: {
				a: true,
				b: false,
				d: true
			}
		};

		let buf = pro.compose('test', payload);


		expect(buf).to.equal(Buffer.from([0b10000001]));

		let result = pro.match(buf);
		//console.log(result);

		expect(result.data).to.equal({
			config: {
				a: true,
				b: false,
				c: false,
				d: true,
				e: false
			}
		});

	})




	it('with given object should match', () => {

		let pro = new Bipro.Protocol();

		pro.defineMessage('test', {
			schema:[
				{ key: 'config', type: 'uint8', bits: {
					a: { bit: 3 }
				}}
			]
		});


		let payload = {
			config: {
				a: true
			}
		};

		let buf = pro.compose('test', payload);

		expect(buf).to.equal(Buffer.from([0b00001000]));

		let result = pro.match(buf);


		expect(result.data).to.equal({
			config: {
				a: true
			}
		});

	})









	it('with uint16be as datatype', () => {

		let pro = new Bipro.Protocol();

		pro.defineMessage('test', {
			schema:[
				{ key: 'config', type: 'uint16be', bits: {
					a: 0,
					b: 1,
					c: 2,
					d: 10,
					e: 4,
				}}
			]
		});


		let payload = {
			config: {
				a: true,
				b: false,
				d: true
			}
		};

		let buf = pro.compose('test', payload);

		expect(buf).to.equal(Buffer.from([0b00000100, 0b00000001]));


		let result = pro.match(buf);


		expect(result.data).to.equal({
			config: {
				a: true,
				b: false,
				c: false,
				d: true,
				e: false
			}
		});

	})









	it('in an array', () => {

		let pro = new Bipro.Protocol();

		pro.defineMessage('test', {
			schema:[
				{ key: 'configa', type: 'array', items: {
					type: 'uint8',
					bits: {
						a: 0,
						b: 1,
						c: 2,
						d: 7,
						e: 4,
					}
				}}
			]
		});


		let payload = {
			configa: [
				{ a: true },
				{ a: true, d: true },
			]
		};

		let buf = pro.compose('test', payload);

		expect(buf).to.equal(Buffer.from([2, 0b00000001, 0b10000001]));

		let result = pro.match(buf);

		expect(result.data.configa).to.equal([
			{
				a: true,
				b: false,
				c: false,
				d: false,
				e: false
			},
			{
				a: true,
				b: false,
				c: false,
				d: true,
				e: false
			}
		]);

	});










	it('complex bit setters', () => {

		let pro = new Bipro.Protocol();

		pro.defineMessage('test', {
			schema:[
				{
					key: 'status',
					type: 'uint16be',
					bits: {
						type: { bit: 15, values: ['a', 'b'] },
						mode: { bit: 14, values: ['mode-a', 'mode-b'] },
						opmode: {
							shift: 0,
							size: 2,
							values: {
								a: 0b00,
								b: 0b01,
								c: 0b11,
								d: 0b10
							}
						},

						opmode2: {
							shift: 2,
							size: 3,
							values: {
								a: 0b001,
								b: 0b011,
								c: 0b111,
								d: 0b101
							}
						},

						opmode3: {
							shift: 5,
							size: 4,
							default: 'c',
							values: {
								a: 0b0011,
								b: 0b0111,
								c: 0b1111,
								d: 0b1011
							}
						}
					}
				}
			]
		});


		let payload = {
			status: {
				type: 'a',
				mode: 'mode-a',
				opmode: 'd',
				opmode2: 'b'
			}
		};

		let buf = pro.compose('test', payload);

		expect(buf).to.equal(Buffer.from([0b11000001, 0b11101110]));

		let result = pro.match(buf);

		expect(result)
			.to.be.an.object();

		expect(result.data)
			.to.equal({
				status: {
					type: 'a',
					mode: 'mode-a',
					opmode: 'd',
					opmode2: 'b',
					opmode3: 'c'
				}
			});


	});





});
