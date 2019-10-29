import "regenerator-runtime/runtime";

import { GraphQLServer } from "graphql-yoga";
import gplay from 'google-play-scraper';

const port = 4000;

// language=GraphQL
const typeDefs = `
	type App {
		appId: String!,
		title: String!,
		description: String!,
	}
	
	type Query {
		app(appId: String!): App
	}
`;

const resolvers = {
	Query: {
		app: async (_, { appId }) => {
			const app = await gplay.app({appId});
			return {
				appId: app['appId'],
				title: app['title'],
				description: app['description'],
			}
		},
	},
};

const server = new GraphQLServer({ typeDefs, resolvers });
server.start({port}).then(() => console.log(`Server is running on http://127.0.0.1:${port}/`));
