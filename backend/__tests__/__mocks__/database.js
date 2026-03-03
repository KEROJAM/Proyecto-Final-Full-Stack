const mockQuery = jest.fn();
const mockPool = {
    query: mockQuery,
    connect: jest.fn(() => Promise.resolve({ release: jest.fn() }))
};

jest.mock('../../database/connection', () => async () => mockPool);

module.exports = { mockPool, mockQuery };
