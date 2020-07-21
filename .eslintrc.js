module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    env: {
        node: true,
    },
    plugins: ['prettier'],
    rules: {
        'prettier/prettier': 'error',
    },
};
