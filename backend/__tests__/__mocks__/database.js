const mockExecute = jest.fn();
const mockPool = {
    execute: mockExecute
};

jest.mock('../../database/connection', () => Promise.resolve(mockPool));

module.exports = { mockPool, mockExecute };
