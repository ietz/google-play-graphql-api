export const lazy = (obj, properties, loadProperty) => {
	return new Proxy(obj, new LazyObjectProxyHandler(properties, loadProperty));
};

class LazyObjectProxyHandler {
	constructor(properties, loadProperty) {
		this.properties = properties;
		this.loadProperty = loadProperty;
		this.requests = {};
	}

	get = async (target, property) => {
		if (!(property in target) && this.properties.includes(property)) {
			if (!(target in this.requests)) {
				this.requests[target] = Promise.resolve(this.loadProperty(property)).then((data) => {
					Object.assign(target, data);
				});
			}

			await this.requests[target];
		}

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
}
