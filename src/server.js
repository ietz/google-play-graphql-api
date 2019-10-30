import "regenerator-runtime/runtime";
import {buildSchema} from 'graphql';
import {GraphQLServer} from "graphql-yoga";
import gplay, {category, collection, sort, age, permission} from 'google-play-scraper';
import {importSchema} from "graphql-import";
import {LazyLoader, withLazyParent} from "./lazy";

const port = 4000;

const typeDefs = importSchema('./dist/schema.graphql');
const appFields = Object.keys(buildSchema(typeDefs).getType('App').getFields());
const appLoader = new LazyLoader(appFields, ({appId}, property, {context: {lang, country}}) => gplay.app({appId, lang, country}));

const defaultPlaygroundQuery =
`{
  app(appId: "com.whatsapp") {
    title
    description
  }
}
`;


const mapOpts = (opts) => {
	return Object.entries({category, collection, sort, age, permission})
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
		app: async (_, {appId}, {lang, country}) => {
			return await gplay.app({appId, lang, country});
		},
		list: async (_, params, {lang, country}) => {
			return await gplay.list(mapOpts({...params, lang, country}));
		},
	},
	App: withLazyParent(appLoader, {
		histogram: async (parent) => {
			const hist = await parent.histogram;
			return [1, 2, 3, 4, 5].map(stars => hist[String(stars)] || 0)
		},
	}),
};

const server = new GraphQLServer({
	typeDefs,
	resolvers,
	context: ({request}) => ({
		lang: request.header('lang') || 'en',
		country: request.header('country') || 'us',
	})
});

server.start({port, defaultPlaygroundQuery})
	.then(() => console.log(`Server is running on http://127.0.0.1:${port}/`));
