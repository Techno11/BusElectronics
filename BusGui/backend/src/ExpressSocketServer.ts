import express, {Application, NextFunction, Request, Response} from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import {Server as SocketServer} from 'socket.io';

/**
 * This class initializes a connection to our main bus arduino.
 * The connection expects to receive a heartbeat from the arduino at a configured interval
 */
class ExpressSocketServer {

  // Server Things
  private app: Application;
  private host: string;
  private port: number;
  private io: SocketServer;
  private server: http.Server;

  constructor() {
    // Init API
    this.app = express();
    this.port = process.env.PORT ? parseInt(process.env.PORT) : 8008;
    this.host = process.env.HOST || '127.0.0.1';
    this.setupMiddleware();

    // Init HTTP Server
    this.server = http.createServer(this.app);
    this.server.listen(this.port);
    this.server.on('error', (err) => this.onError(err));
    this.server.on('listening', () => this.onListening());


    // Init Socket
    this.io = new SocketServer(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true
      }
    });
  }

  private setupMiddleware() {
    this.app.use(express.static(path.resolve(__dirname, '../public'), {maxAge: 2628000})); // One month

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    this.app.use(cors());
    this.app.use(helmet());

    this.app.use((req: Request, res: Response) => {
      if (req.path !== '/api' && !req.path.startsWith('/api/')) {
        return res.sendFile(path.resolve(__dirname, '../public/index.html'));
      }
    });
  }

  public getIO(): SocketServer {
    return this.io;
  }

  // On server listening handler
  private onListening(): void {
    const addr = this.server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `${addr && addr.address} ${addr && addr.port}`;
    console.log(`⚠ App started and listening on ${bind}`);
  }

  // Server error handling
  private onError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== 'listen') {
      throw error;
    }
    switch (error.code) {
      case 'EACCES':
        console.log(`${this.port} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.log(`${this.port} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  }
}

export default ExpressSocketServer;