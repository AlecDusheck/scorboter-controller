import SerialPort = require("serialport");
import {Utils} from "./Utils";

export class SerialManager {
    get serial(): SerialPort {
        return this._serial;
    }

    get path(): string {
        return this._path;
    }

    private _serial: SerialPort;
    private readonly _path: string;

    private dataQueue: Array<string>;

    constructor(path: string) {
        this._path = path;
    }

    public connect = async () => {
        console.log("Attempting to open serial connection....");
        this._serial = new SerialPort(this.path, {
            baudRate: 9600,
            parity: "even",
            stopBits: 2
        });

        await new Promise((resolve, reject) => {
           this._serial.on("open", () => {
               return resolve();
           });

           this._serial.on("error", err => {
               console.log("Caught exception: " + err);
               return reject(err);
           })
        });

        console.log("Connection to serial controller established!");

        this._serial.on("data", (chunk: string) => {
            const chunkData = chunk.split("");
            chunkData.forEach(data => this.dataQueue.push(data));
            console.log("Data queue update: " + this.dataQueue);
        });
    };

    public write = async (data: string) => {
        console.log("Writing data to serial: " + data);
        return new Promise((resolve, reject) => {
            this.serial.write(data, function (err) {
                if (err) return reject(err);
                else return resolve();
            });
        })
    };

    public getNextData = async () => {
        if (this.dataQueue.length > 0){
            return this.dataQueue.shift();
        } else {
            await Utils.delay(500);
            return await this.getNextData();
        }
    }
}
