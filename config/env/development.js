module.exports = {
  datastores: {
    // default: { // To run in local DB
    //   adapter: 'sails-postgresql',
    //   url: 'postgres://postgres:admin@localhost:5432/postgres',
    //   connectTimeout: 300000,
    //   // ssl: true,
    //   database: 'postgres',
    // },
    default: { // To run in production DB
      adapter: 'sails-postgresql',
      url: 'postgresql://doadmin:do6nfsjbla4vfc7q@primary-db-postgresql-do-user-2545403-0.db.ondigitalocean.com:25060/development',
      connectTimeout: 300000,
      ssl:  {
          sslmode: 'require',
          rejectUnauthorized: false,
        },
      database: 'postgres',
    },
  },
  models: {
    migrate: 'safe',
    // cascadeOnDestroy: false,

  },
  session: {
    cookie: {
      // secure: true,
      maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    },
  },
  blueprints: {
    shortcuts: true,
  },
};
