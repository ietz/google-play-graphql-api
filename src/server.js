import "regenerator-runtime/runtime";
import {buildSchema} from 'graphql';
import { GraphQLServer } from "graphql-yoga";
import gplay, { category, collection, sort, age, permission } from 'google-play-scraper';
import {importSchema} from "graphql-import";
import {lazy} from "./lazy";

const port = 4000;

const typeDefs = importSchema('./dist/schema.graphql');
const appFields = Object.keys(buildSchema(typeDefs).getType('App').getFields());

const defaultPlaygroundQuery =
`{
  app(appId: "com.whatsapp") {
    title
    description
  }
}
`;

const appResolverHandler = {
	get: (target, key) => {
		return (parent, args, context, info) => {
			const lazyParent = lazy(parent, appFields, () => gplay.app({appId: parent.appId}));

			if (key in target) {
				return target[key](lazyParent, args, context, info);
			} else {
				return lazyParent[key];
			}
		};
	},
	has: (target, key) => {
		return key in target || appFields.includes(key);
	},
	ownKeys: (target) => {
		return Array.from(new Set([
			...appFields,
			...(Reflect.ownKeys(target) || []),
		]));
	},
	getOwnPropertyDescriptor: (target, key) => {
		if (key in target) {
			return Object.getOwnPropertyDescriptor(target, key);
		} else {
			return {
				value: appResolverHandler.get(target, key),
				writable: false,
				configurable: true,
				enumerable: true,
			}
		}
	},
};

const mapOpts = (opts) => {
	return Object.entries({ category, collection, sort, age, permission })
		.reduce((acc, [name, val_map]) => {
			if (opts.hasOwnProperty(name)) {
				return {
					...acc,
					[name]: val_map[opts[name]],
				};
			} else {
				return acc;
			}
		}, opts)
};

const resolvers = {
	Query: {
		app: async (_, { appId }) => {
			return await gplay.app({appId});
		},
		list: async (_, params) => {
			return await gplay.list(mapOpts(params));
		},
	},
	App: new Proxy({
		histogram: async (parent) => {
			const hist = await parent.histogram;
			return [1, 2, 3, 4, 5].map(stars => hist[String(stars)] || 0)
		},
	}, appResolverHandler),
};

const server = new GraphQLServer({ typeDefs, resolvers });
server.start({port, defaultPlaygroundQuery})
	.then(() => console.log(`Server is running on http://127.0.0.1:${port}/`));
