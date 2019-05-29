import SerialPort = require("serialport");
import {Utils} from "./Utils";

export class SerialManager {

    get path(): string {
        return this._path;
    }

    private _serial: SerialPort;

    get serial(): SerialPort {
        return this._serial;
    }

    private readonly _path: string;
    private dataQueue: Array<any>;

    constructor(path: string) {
        this._path = path;
        this.dataQueue = [];
    }

    public connect = async (): Promise<void> => {
        console.log("Attempting to open serial connection....");
        this._serial = new SerialPort(this.path, {
            baudRate: 9600,
            parity: "none",
            stopBits: 2,
            dataBits: 8
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

        this._serial.on("data", (chunk: any) => {
            // const chunkData = chunk.toString().split("");
            // chunkData.forEach(data => this.dataQueue.push(data));
            if(this.dataQueue.length !== 0) {
                console.log("[WARNING] Data queue appears to be backed up. This may lead to unexpected behavior.");
            }

            chunk.toString().split("").forEach(chunkData => {
                console.log("Handling chunk: " + chunkData);
                this.dataQueue.push(chunkData);
            });
        });
    };

    public write = async (data: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            this.serial.write(data, function (err) {
                if (err) return reject(err);
                else return resolve();
            });
        })
    };

    public clearQueue = () => {
        this.dataQueue = [];
    };

    public getNextData = async (amount: number = 2): Promise<any> => {
        if (this.dataQueue.length > amount) {
            return this.dataQueue.splice(0, amount);
        } else {
            await Utils.delay(50);
            return await this.getNextData();
        }
    }
}
