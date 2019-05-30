import {SerialManager} from "./SerialManager";
import {SnapMotor} from "./parts/SnapMotor";
import {Motor} from "./parts/Motor";
import {CacheManager} from "./CacheManager";

export enum BinaryReturn {
    OFF = "off",
    ON = "on"
}

export interface MotorConfiguration {
    motor: Motor | SnapMotor,
    name: string
}

export class ArmController {
    static get root(): string {
        return __dirname;
    }

    static get instance(): ArmController {
        return this._instance;
    }

    private static _instance: ArmController;

    get motors(): Array<MotorConfiguration> {
        return this._motors;
    }

    get serialManager(): SerialManager {
        return this._serialManager;
    }

    private readonly _serialManager: SerialManager;
    private readonly _motors: Array<MotorConfiguration>;

    constructor(serialPath: string) {
        ArmController._instance = this;
        this._serialManager = new SerialManager(serialPath);
        this._motors = [];
    }

    public configureMotors = () => {
        this.addMotor("base", new Motor(1));
        this.addMotor("elbow1", new Motor(2));
        // this.addMotor("elbow2", new Motor(3));
        // this.addMotor("finger1", new Motor(4));
        // this.addMotor("finger2", new Motor(5));

    };

    public init = async (skipCache?: boolean): Promise<void> => {
        try {
            await this.serialManager.connect();
        } catch (e) {
            console.log("Failed to connect! Check console errors above for more information.");
            process.exit(1);
        }
        await this.serialManager.write("X"); // Disable interrupts
        await this.serialManager.write("a P"); // Reset everything on the arm

        this.configureMotors();

        await CacheManager.loadStates(skipCache);
        CacheManager.bindToStdin();
    };

    public addMotor = (name: string, motor: Motor | SnapMotor) => {
        console.log("Adding motor \"" + name + "\" with ID #" + motor.motorId);
        this._motors.push({
            name: name,
            motor: motor
        })
    }
}
