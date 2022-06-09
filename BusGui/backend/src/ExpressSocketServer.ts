import express, {Application, NextFunction, Request, Response} from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import {Server as SocketServer} from 'socket.io';
import getAppDataPath from "appdata-path";
import fs from "fs";
import bodyParser from "body-parser";
import multer from "multer";

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

    this.app.use(bodyParser.json());

    this.app.use(bodyParser.urlencoded({ extended: true, inflate: true, limit: '100mb' }));

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    this.app.use(cors());
    this.app.use(helmet());

    /* Save sent file to disk and load it onto arduino */
    this.app.post("/api/arduino/update", multer().single('file'), (req, res) => {
      try{
        if(req.file) {
          // Place to write file
          const filePath = path.resolve(getAppDataPath("busgui"), "temp_upload.hex");

          // write uploaded file to disk
          fs.writeFileSync(filePath, req.file.buffer);

          // We've "uploaded" the file, we're done here
          res.status(200).send({success: true});

          // @ts-ignore
          process.emit("arduino-upload-ready", filePath);
        } else {
          res.status(400).send({success: false, error: 'Bad Request', route: req.path, method: req.method});
        }
      } catch(e) {
        console.log(e);
        if(!res.headersSent) {
          res.status(500).send({success: false, error: e, route: req.path, method: req.method});
        }
      }
    });

    this.app.use(express.static(path.resolve(__dirname, '../public'), {maxAge: 2628000})); // One month

    this.app.use((req: Request, res: Response) => {
      if (req.path !== '/api' && !req.path.startsWith('/api/')) {
        return res.sendFile(path.resolve(__dirname, '../public/index.html'));
      } else {
        res.status(404).send({success: false, error: "Not Found", method: req.method, route: req.path});
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