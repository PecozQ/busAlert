module.exports = {
  datastores: {
    default: {
      adapter: 'sails-postgresql',
      url: 'postgres://postgres:admin@localhost:5432/postgres',
      connectTimeout: 300000,
      // ssl: true,
      database: 'postgres',
    },
    // snapshot: {   // To connect to second DB
    //   adapter: 'sails-mysql',
    //   url: 'mysql://root:password@127.0.0.1:3306/snapshot',
    //   connectTimeout: 100000,
    //   database: 'snapshot',
    // }
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
