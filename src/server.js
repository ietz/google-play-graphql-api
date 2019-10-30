import "regenerator-runtime/runtime";
import {buildSchema} from 'graphql';
import { GraphQLServer } from "graphql-yoga";
import gplay, { category, collection, sort, age, permission } from 'google-play-scraper';
import {importSchema} from "graphql-import";
import {LazyLoader, withLazyParent} from "./lazy";

const port = 4000;

const typeDefs = importSchema('./dist/schema.graphql');
const appFields = Object.keys(buildSchema(typeDefs).getType('App').getFields());
const appLoader = new LazyLoader(
	appFields,
	app => app.appId,
	id => gplay.app({appId: id})
);

const defaultPlaygroundQuery =
`{
  app(appId: "com.whatsapp") {
    title
    description
  }
}
`;


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
	App: withLazyParent(appLoader, {
		histogram: async (parent) => {
			const hist = await parent.histogram;
			return [1, 2, 3, 4, 5].map(stars => hist[String(stars)] || 0)
		},
	}),
};

const server = new GraphQLServer({ typeDefs, resolvers });
server.start({port, defaultPlaygroundQuery})
	.then(() => console.log(`Server is running on http://127.0.0.1:${port}/`));
