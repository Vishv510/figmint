import { defineDatasource } from "@prisma/client/runtime/library";

export default {
  datasources: {
    db: defineDatasource({
      url: process.env.DATABASE_URL,   // use your env here
      provider: "postgresql",
    }),
  },
};
