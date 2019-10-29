import "regenerator-runtime/runtime";

import { GraphQLServer } from "graphql-yoga";
import gplay from 'google-play-scraper';

const port = 4000;

const defaultPlaygroundQuery =
`{
  app(appId: "com.whatsapp") {
    title
    description
  }
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

const server = new GraphQLServer({ typeDefs: './dist/schema.graphql', resolvers });
server.start({port, defaultPlaygroundQuery})
	.then(() => console.log(`Server is running on http://127.0.0.1:${port}/`));
