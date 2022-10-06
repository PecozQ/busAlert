module.exports = {
    datastores: {
      default: {
        adapter: 'sails-postgresql',
        url: 'postgresql://doadmin:do6nfsjbla4vfc7q@primary-db-postgresql-do-user-2545403-0.db.ondigitalocean.com:25060/development',
        connectTimeout: 300000,
        ssl:  {
            sslmode: 'require',
            rejectUnauthorized: false,
          },
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
  