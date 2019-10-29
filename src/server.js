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
			return await gplay.app({appId});
		},
	},
	App: {
		histogram: (parent) => [1, 2, 3, 4, 5].map(stars => parent.histogram[String(stars)] || 0)
	}
};

const server = new GraphQLServer({ typeDefs: './dist/schema.graphql', resolvers });
server.start({port, defaultPlaygroundQuery})
	.then(() => console.log(`Server is running on http://127.0.0.1:${port}/`));
