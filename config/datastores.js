module.exports.datastores = {
  default: {
    connectTimeout: 100000,
    ssl: true,
    adapter: 'sails-postgresql',
    port: 5432, // DB Connection port
  }
};
