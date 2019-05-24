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

    private returns: Array<string>;

    constructor(path: string) {
        this._path = path;
    }

    public connect = () => {
        this._serial = new SerialPort(this.path, {
            baudRate: 9600,
            parity: "even",
            stopBits: 2
        });

        this._serial.on("data", (chunk: string) => {
            this.returns.push(chunk);
        });
    };

    public write = async (data: string) => {
        return new Promise((resolve, reject) => {
            this.serial.write(data, function (err) {
                if (err) return reject(err);
                else return resolve();
            });
        })
    };

    public getNextData = async () => {
        if (this.returns.length > 0){
            return this.returns.shift();
        } else {
            await Utils.delay(500);
            return await this.getNextData();
        }
    }
}
