# bipro

Binary Protocol composer/parser


# Install
`npm i --save bipro`



# Api

### Protocol
#### defineType(name, configOrParent, [configExtender])

- **name** *(String)* Unique name/identifier for type *(e.g. uint8, char, byte)*
- **configOrParent** *(Object | String)* String defines previous defined type for inheritance.
	
	- **compose(value, data, schema, protocol)** 	
	Should return an instance of `Buffer`. 
	
		- **value** Value of attributes key in `data`.
		- **data** Whole composing data.
		- **schema** Attribute schema config line 
		- **protocol** Current protocol instance

		
	- **parse(buffer, context, schema, protocol)**	Should return parsed value or `null` if invalid.

		- **buffer** Raw buffer
		- **context** 
			- **offset** Current cursor position during parse-process. 
		- **schema** Attribute schema config line 
		- **protocol** Current protocol instance





#### defineMessage(name, config)
Defines a messageType by given config.

- **name** (`String`) Unique message name.
- **config** (`Object`)
	- **schema** (`Array`) of Schema Objects
		- **key** (`String`) Name of payload attribute.
		- **type** (`String`) Name of type.
		- **default** (`Number`|`String`|`Array`) based on `type`
		- **static** (`Boolean`) Default: false
		- **required** (`Boolean`) Default: false

#### compose(messageName, payload)
Returns buffer for given payload.

#### match(buffer) 
Takes a buffer and returns parsed data or `false` if no messageType matches.

#### use(plugin, [options])




### Message Schema

- schema

### Value Schema

- key
- type
- static
- default

### Type Schema

- compose(char, data, schema, protocol)
- parse(buf, ctx, schema, protocol)




## Default types

- **int8**
- **uint8**
- **byte**
- **char**
- **int16le**
- **int16be**
- **uint16le**
- **uint16be**
- **shortle**
- **shortbe**
- **ushortle**
- **ushortbe**
- **int32le**
- **int32be**
- **uint32le**
- **uint32be**
- **longle**
- **longbe**
- **ulongle**
- **ulongbe**
- **array**
	
	- **itemType** (`String`)	
	Set custom item type. (e.g. string, char, ulongbe) Default is `uint8`
	
	- **sizeType** (`String`)	
	Set custom size type. Default is `uint8`
	
	- **size** (`Number`|`String`)	
	Set custom/fixed size. Otherwise array-items will be prefixed with size-byte(s).
	
		- `Number` Used as fixed length. (No size byte(s) will be prefixed)
		- `String` Used as size-value getter. (No size byte(s) will be prefixed) 

- **string**
	- **size** (`Number`|`String`)
		- `Number` Used as fixed length. (No size byte(s) will be prefixed)
		- `String` Used as size-value getter. (No size byte(s) will be prefixed) 



#Author

Christian Blaschke <mail@platdesign.de>
