import "regenerator-runtime/runtime";

import { GraphQLServer } from "graphql-yoga";
import gplay, { category, collection, sort, age, permission } from 'google-play-scraper';

const port = 4000;

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
	App: {
		histogram: (parent) => [1, 2, 3, 4, 5].map(stars => parent.histogram[String(stars)] || 0),
	}
};

const server = new GraphQLServer({ typeDefs: './dist/schema.graphql', resolvers });
server.start({port, defaultPlaygroundQuery})
	.then(() => console.log(`Server is running on http://127.0.0.1:${port}/`));
