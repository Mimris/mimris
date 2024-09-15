const cors_proxy = require('cors-anywhere');

const host = 'localhost';
const port = 8080;

cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, () => {
    console.log(`Running CORS Anywhere on ${host}:${port}`);
});