'use strict';


const Code = require('code');
const expect = Code.expect;

const Bipro = require('../lib/bipro');



describe('Examples', function() {

	it('should', () => {

		let pro = new Bipro.Protocol();


		pro.defineType('opcode', 'uint16be', { key: 'opcode' });
		pro.defineType('productId', 'uint16be', { key: 'productId' });


		pro.defineMessage('DISCOVER', {
			schema: [
				{ type: 'opcode', default: 123, static: true },
				{ key: 'version', type: 'uint16be', default: 321, static: true },
				{ type: 'productId', required: true },
			]
		});


		pro.defineMessage('DISCOVER2', {
			schema: [
				{ type: 'opcode', default: 223, static: true },
				{ key: 'version', type: 'uint16be', default: 321, static: true },
				{ key: 'values', type: 'array' },
				{ type: 'productId', required: true },
				{ type: 'string', key: 'name2' },
				{ type: 'char', key: 'name' },
			]
		});




		let buf = pro.compose('DISCOVER2', {
			productId: 345,
			values: [1,2,3,4],
			name: 'b',
			name2: 'Christian'
		});


		console.log(buf)

		let res = pro.match(buf);

		console.log(res);

	});

});
