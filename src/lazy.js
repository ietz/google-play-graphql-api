export class LazyLoader {
	/**
	 * Describes an object which is to be loaded lazily
	 *
	 * @param properties List of properties which can be made available when requested
	 * @param load Called when a new property is requested.
	 * Receives the object and the property name as a parameter and should return the retrieved
	 * properties as an object.
	 */

	constructor(properties, load) {
		this.properties = properties;
		this.load = load;
	}
}

export const withLazyParent = (loader, resolvers) =>
	new Proxy(resolvers, new LazyParentResolverProxyHandler(loader));



class AugmentingProxyHandler {
	/**
	 * A proxy handler which augments the target object with a predefined list of properties
	 *
	 * @param properties the properties to be added to the object
	 */

	constructor(properties) {
		this.properties = properties;
	}

	get = (target, property) => {
		return target[property];
	};

	has = (target, property) => {
		return property in target || property in this.properties;
	};

	ownKeys = (target) => {
		return Array.from(new Set([
			...this.properties,
			...(Reflect.ownKeys(target) || []),
		]));
	};

	getOwnPropertyDescriptor = (target, property) => {
		if (property in target) {
			return Object.getOwnPropertyDescriptor(target, property);
		} else {
			return {
				value: this.get(target, property),
				writable: false,
				configurable: true,
				enumerable: true,
			}
		}
	};
}


class LazyObjectProxyHandler extends AugmentingProxyHandler {
	/**
	 * A proxy handler which can be used to fetch object properties only when they are requested (lazily)
	 * e.g. if only a subset of the object properties are available in cache, the remaining properties
	 * will be retrieved as soon as they are requested.
	 *
	 * @param loader LazyLoader describing the object
	 * @param data Arbitrary object to be passed to loader.load
	 */

	constructor(loader, data) {
		super(loader.properties);
		this.loader = loader;
		this.data = data;
	}

	get = async (target, property) => {
		if (!(property in target) && this.loader.properties.includes(property)) {
			if (!('_request' in target)) {
				target._request = Promise.resolve(this.loader.load(target, property, this.data)).then((data) => {
					Object.assign(target, data);
				});
			}

			await target._request;
		}

		return target[property];
	};
}


class LazyParentResolverProxyHandler extends AugmentingProxyHandler {
	constructor(loader) {
		super(loader.properties);
		this.loader = loader;
	};

	get = (target, property) => {
		return (parent, args, context, info) => {
			const lazyParent = new Proxy(parent, new LazyObjectProxyHandler(this.loader, {args, context, info}));

			if (property in target) {
				return target[property](lazyParent, args, context, info);
			} else {
				return lazyParent[property];
			}
		};
	};
}
