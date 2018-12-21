class BaseModel {

	/**
	 * VUe instance
	 * @type (Object)
	 */

	static Vue

	/**
	 * Private properties prefix
	 * @type (String)
	 */

	static prefix

	/**
	 * Constructor of model
	 * @method constructor
	 * @param  {Object|Boolean}   [args=false] object to init model
	 */

	constructor(args = false) {
		if (args)
			this._init(args)
	}

	/**
	 * Get the key of model
	 * @method key
	 * @return {String} Models key
	 */

	get key () {
		if (this.id === undefined)
			throw new Error('key is undefined')

		return this.id + ''
	}

	/**
	 * Define the model property
	 * @method defineProperty
	 * @param  {String}       prop          Propery name
	 * @param  {Object}       Class         Property class instance
	 * @param  {Boolean}      [array=false] property is an array of models
	 */

	defineProperty(prop, Class, array = false) {
		if (Class === Boolean)
			return this.defineBoolean(prop)

		if (Class === Number)
			return this.defineNumber(prop)

		if (Class === String)
			return this.defineString(prop)

		if (array) this[this.constructor.prefix + prop] = []

		Object.defineProperty(this, prop, {
			get() {
				if (array) {
					let arr = this[this.constructor.prefix + prop] || []
					if (!arr.every(el => el instanceof Class))
						this[prop] = arr
				}

				return this[this.constructor.prefix + prop]
			},
			set(val) {
				if (array) {
					if (!Array.isArray(val))
						return console.warn(prop + ' must be an Array')

					this[this.constructor.prefix + prop] = val.map(el => el instanceof Class ? el : new Class(el))
				} else {
					this[this.constructor.prefix + prop] = !val || val instanceof Class ? val : new Class(val)
				}
			},
			configurable: true
		})
	}

	/**
	 * Define the model properties with object
	 * @method define
	 * @param  {Object}  props        Property description
	 * @param  {Boolean} [args=false] init the model with these props
	 */

	define (props, args = false) {
		this.__props__ = props

		for (var prop in props)
			if (props.hasOwnProperty(prop)) {
				if (typeof props[prop] == 'string') {
					this.translateProperty(prop, props[prop])
				} else {
					let array = Array.isArray(props[prop])
					this.defineProperty(prop, array ? props[prop][0] : props[prop], array)
				}
			}

		if (args)
			this._init(args)
	}

	/**
	 * Defines model propery as Boolean
	 * @method defineBoolean
	 * @param  {String}     prop the name of property
	 */

	defineBoolean (prop) {
		Object.defineProperty(this, prop, {
			get() {
				return this[this.constructor.prefix + prop]
			},
			set(val) {
				this[this.constructor.prefix + prop] = !!+val
			},
			configurable: true
		})
	}

	/**
	 * Defines model propery as Number
	 * @method defineNumber
	 * @param  {String}     prop the name of property
	 */

	defineNumber (prop) {
		Object.defineProperty(this, prop, {
			get() {
				return +this[this.constructor.prefix + prop]
			},
			set(val) {
				this[this.constructor.prefix + prop] = +val
			},
			configurable: true
		})
	}

	/**
	 * Defines model propery as String
	 * @method defineString
	 * @param  {String}     prop the name of property
	 */

	defineString (prop) {
		Object.defineProperty(this, prop, {
			get() {
				return this[this.constructor.prefix + prop] + ''
			},
			set(val) {
				this[this.constructor.prefix + prop] = val + ''
			},
			configurable: true
		})
	}

	/**
	 * Create getter and setter with different name of existing property
	 * @method translateProperty
	 * @param  {String}          prop new propertyname
	 * @param  {String}          path path to the value
	 */

	translateProperty (prop, path) {
		Object.defineProperty(this, prop, {
			get () {
				return this._getProperty(path)
			},
			set (value) {
				this._setProperty(path, value)
			},
			configurable: true
		})
	}

	/**
	 * Init the model with object of properties
	 * @method _init
	 * @param  {Object} args
	 */

	_init (args) {
		for (var prop in args)
			if (args.hasOwnProperty(prop))
				this[prop] = args[prop]
	}

	/**
	 * Get the property value by path
	 * @method _getProperty
	 * @param  {String}     path The path of value delimited with dot (.)
	 * @return {Any}     value
	 */

	_getProperty (path) {
		return path
			.split('.')
			.reduce(
				(prev, el) =>
					prev[el] === undefined ||
					prev[el] === null ?
						''
					:	prev[el],
				this
			)
	}

	/**
	 * Sets the property value by path
	 * @method _setProperty
	 * @param  {String}     path  path of property dilimits the object with dot (.)
	 * @param  {Any}     value Value to set
	 */

	_setProperty (path, value) {
		let splited = path.split('.')
		splited.reduce(
			(prev, el, index) =>
				prev[el] ?
					index + 1 == splited.length ?
						this.constructor.__setVueProperty(
							prev,
							el,
							value
						)
					:	prev[el]
				:	this.constructor.__setVueProperty(
						prev,
						el,
						index + 1 == splited.length ?
							value
						:	{}
					),
				this
		)
	}

	/**
	 * Sets the object property if a withVue.set if Vue instance is defined
	 * @method __setVueProperty
	 * @param  {Object}         obj
	 * @param  {String}         prop
	 * @param  {Any}         	value
	 */

	static __setVueProperty (obj, prop, value) {
		if (this.constructor.Vue)
			return this.constructor.Vue.set(
				obj,
				prop,
				value
			)

		obj[prop] = value
	}

	/**
	 * @method instance
	 * @return {BaseModel} this
	 */

	get instance () {
		return this
	}

	/**
	 * Updates the model with an object
	 * @param  {Object} val New Values
	 * @return {BaseModel} this
	 */

	update (val) {
		for (var prop in val)
			if (val.hasOwnProperty(prop))
				this[prop] instanceof BaseModel ?
					this[prop].update(val[prop])
				:	this[prop] = val[prop]

		return this
	}

	/**
	 * Creaes a new instance of current model
	 * @method clone
	 * @return {BaseModel} the clone
	 */

	clone () {
		return new this.constructor(
			Object
				.getOwnPropertyNames(this)
				.reduce(
					(prev, el) => (prev[el] = this[el], prev),
					{}
				)
		)
	}

	/**
	 * @method href
	 * @return {String} the href to current model
	 */

	get href () {
		if (!this.baseUrl) return
		return this.constructor.format(this.baseUrl, this)
	}

	/**
	 * Sets variables in template
	 * @method format
	 * @param  {String} template
	 * @param  {Object} data
	 * @return {String} the merge result
	 */

	static format (template, data) {
		if (typeof template !== 'string')
			throw new Error('template mus be an instance of String')

		if (typeof data !== 'object' || data === null)
			throw new Error('data must be an Object with keys is template marks and values is String')

		return template.replace(/{(\w+)}/g, (m, p) => data[p])
	}

	/**
	 * Wrap an object with current model
	 * @method wrap
	 * @param  {Object} obj          Object with params
	 * @param  {String} [field='id'] Primary key field name
	 * @return {BaseModel} Model
	 * @return {Any} param 1 when primary key is undefined
	 */

	static wrap (obj, field = 'id') {
		if (obj[field] !== undefined)
			return new this(obj)

		return obj
	}

	/**
	 * Wrap an array of objects with this model
	 * @method wrapArray
	 * @param  {Array|Any}  arr
	 * @return {Array}  the array with models
	 * @return {Any}  	param if he is no an array
	 */

	static wrapArray (arr) {
		if (Array.isArray(arr))
			return arr.map(el => new this(el))

		return arr
	}

	get serialize () {
		let fields = typeof this.constructor.fields == 'function' ?
			this.constructor.fields()
		:	this.constructor.fields

		return Array.isArray(fields) ?
			fields
				.reduce(
					(ob, field) => (ob[field] = this[field], ob),
					{}
				)
		:	this
	}

	/**
	 * Create an object from model
	 * @method toObject
	 * @return (Object)
	 */

	toObject () {
 		let props = Object.keys(this.__props__),
 			pref = new RegExp('^' + this.constructor.prefix, 'g')

 		for (let prop in this)
 			if (
 				!props.includes(prop.replace(pref, ''))
 				&& !this.constructor.__private__.includes(prop)
 			) props.push(prop)

 		const toObjectChidls = (acc, el) => {
 			if (this[el] instanceof BaseModel)
 				acc[el] = this[el].toObject()
 			else if (Array.isArray(this[el]))
 				acc[el] = this[el].map(
 					item =>
 					item instanceof BaseModel ?
 						item.toObject()
 					:	item
 				)
 			else
 				acc[el] = this[el]

 			return acc
 		}

 		return props.reduce(toObjectChidls, {})
 	}

	/**
	 * Private props
	 */

	static get __private__ () {
		return [
			'__props__',
			'__private__',
			'__ob__'
		]
	}
}

BaseModel.prefix = '_'
//window.BaseModel = BaseModel
export default BaseModel
