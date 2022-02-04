"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mode = exports.app = void 0;
const http = __importStar(require("http"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_1 = __importDefault(require("express"));
// Initiate Logger
const logger = console.log; // ("api:src/index.ts");
// Setup dotenv
dotenv.config({ path: path_1.default.join(__dirname, '../../.env') });
// Get package.json for version
const packageJson = require('../../package.json');
// Check all of our ENV variables
logger('⚠ Checking all .env variables. If the process exits with code 1 before the \'passed\' message, check that all env variables are defined. See example.env for reference.');
if (!process.env.NODE_ENV)
    process.exit(1);
process.stdout.write('✅ NODE_ENV ');
if (!process.env.PORT)
    process.exit(1);
process.stdout.write('✅ PORT ');
if (!process.env.HOST)
    process.exit(1);
process.stdout.write('✅ HOST ');
logger('✅ env Check Passed. Starting Bus Backend v' + packageJson.version);
// API Things
exports.app = (0, express_1.default)();
exports.mode = (process.env.NODE_ENV || 'development').toUpperCase();
const port = process.env.PORT || 8008;
let host = process.env.HOST || '127.0.0.1';
exports.app.use(express_1.default.static(path_1.default.resolve(__dirname + '../../../public'), { maxAge: 2628000 })); // One month
exports.app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
exports.app.use((0, cors_1.default)());
exports.app.use((0, helmet_1.default)());
exports.app.use("/*", (req, res, next) => {
    res.sendFile(path_1.default.resolve(__dirname + '../../../public/index.html'));
});
// Init API/ HTTP Server (this will serve the webapp as well)
const server = http.createServer(exports.app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
// Init Socket
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true
    }
});
// Setup Socket Connector
io.on('connection', (client) => __awaiter(void 0, void 0, void 0, function* () {
    client.on('disconnect', () => {
        client.disconnect();
    });
    client.on('drip', () => {
        client.emit('drop');
    });
}));
// Server error handling
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    switch (error.code) {
        case 'EACCES':
            logger(`${port} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger(`${port} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}
// On server listening handler
function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr && addr.port}`;
    logger(`⚠ App started and listening on ${bind}`);
}
process.on('SIGTERM', () => {
    logger('❌ Received SIGTERM, api closing...');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger('❌ Received SIGINT, api closing...');
    process.exit(0);
});
process.on('unhandledRejection', (reason, p) => {
    logger(`⚠ Unhandled promise rejection thrown: `);
    logger(reason);
    // process.exit(1); // no crashy crashy
});
