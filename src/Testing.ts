import * as SerialPort from "serialport";

export class Testing {

    private port: SerialPort;
    private dataQueue: Array<string>;

    constructor() {
        this.dataQueue = [];

        this.port = new SerialPort('/dev/ttyUSB0', {
            baudRate: 9600,
            parity: "even",
            stopBits: 2
        });

        this.bind();
    }

    public bind = () => {
        this.port.on("data", (chunk: string) => {
            console.log("got data chunk: " + chunk);
            const chunkData = chunk.toString().split("");
            chunkData.forEach(data => this.dataQueue.push(data));
            console.log("Data queue update: " + this.dataQueue);
        });

        this.write("X"); // Disable interrupts
        this.write("a P"); // Reset EVERYTHING

        let asd = 0;

        setInterval(() => {
            asd += 50;
            this.write("1 M - 50\r");
            console.log(asd);
        }, 500);

        // process.stdin.on('keypress', (str, key) => {
        //     this.write("1 L");
        //     if (key.name === 'd') {
        //         this.write("1 M + 75\r")
        //     } else if (key.name === 'a') {
        //         this.write("1 M - 75\r")
        //     } else if (key.name === 's') {
        //         this.write("2 M + 75\r")
        //     } else if (key.name === 'w') {
        //         this.write("2 M - 75\r")
        //     } else if (key.name === 'q') {
        //         this.write("4 M - 75\r")
        //     } else if (key.name === 'e') {
        //         this.write("5 M - 75\r")
        //     } else if (key.name === 'z') {
        //         this.write("8 M - 2\r")
        //     } else if (key.name === 'c') {
        //         this.write("8 M + 2\r")
        //     } else {
        //         process.exit();
        //     }
        // });
    };

    public write = async (data: string) => {
        return new Promise((resolve, reject) => {
            this.port.write(data, function (err) {
                if (err) return reject(err);
                else return resolve();
            });
        })
    }
}
