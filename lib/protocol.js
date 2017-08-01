'use strict';

const Message = require('./message');
const Type = require('./type');

const DefaultTypesPlugin = require('./plugins/default-types');

module.exports = class Protocol {

	constructor() {

		this._types = {};
		this._messages = {};

		this.use(DefaultTypesPlugin);
	}

	use(plugin, options) {
		plugin(this, options);
	}

	_getType(name) {
		/* istanbul ignore if  */
		if(!this._types.hasOwnProperty(name)) {
			throw new Error(`Type ${name} not found`);
		}

		return this._types[name];
	}

	defineType(name, config, configExtender) {
		/* istanbul ignore if  */
		if(this._types.hasOwnProperty(name)) {
			throw new Error(`Type ${name} already defined`);
		}

		if(typeof config === 'string') {

			let existingType = this._getType(config);

			if(!configExtender) {
				return this._types[name] = existingType;
			}

			let _config = Object.assign({}, existingType._config, configExtender);

			this._types[name] = new Type(name, _config);
		} else {
			this._types[name] = new Type(name, config);
		}

	}


	defineMessage(name, config) {
		/* istanbul ignore if  */
		if(this._messages.hasOwnProperty(name)) {
			throw new Error(`Message ${name} already defined`);
		}

		let msg = new Message(name, config, this);

		this._messages[name] = msg;
		return msg;
	}

	compose(messageName, data) {

		let msg = this._messages.hasOwnProperty(messageName) ? this._messages[messageName] : null;

		/* istanbul ignore if  */
		if(!msg) {
			throw new Error(`Message ${messageName} not defined`);
		}

		return msg.compose(this, data);
	}

	match(buf) {

		let ctx;

		let res = Object.keys(this._messages)
		.map(key => this._messages[key])
		.find(msg => {
			ctx = { offset: 0, data:{}, msg: msg.name };
			return msg.match(buf, ctx, this);
		});

		if(!res) {
			return false;
		}

		return {
			msg: ctx.msg,
			data: ctx.data
		};
	}

}


















