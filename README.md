#bipro

Binary Protocol composer/parser


#Install
`npm i --save bipro`



# Api

### Protocol
- defineType(name, configOrParent, [configExtender])
- defineMessage(name, config)
- compose(messageName, payload)
- match(buffer)


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


#Author

Christian Blaschke <mail@platdesign.de>
