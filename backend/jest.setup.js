const { closePool } = require('./database/connection');

afterAll(async () => {
    await closePool();
});
