module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js'],
    collectCoverageFrom: [
        'models/**/*.js',
        'controllers/**/*.js',
        'middleware/**/*.js',
        'services/**/*.js'
    ],
    coverageDirectory: 'coverage',
    verbose: true,
    testTimeout: 10000,
    setupFilesAfterEnv: ['./jest.setup.js']
};
