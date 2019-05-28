import {SerialManager} from "./SerialManager";
import {SnapMotor} from "./parts/SnapMotor";
import {Motor} from "./parts/Motor";

export enum BinaryReturn {
    OFF = "off",
    ON = "on"
}

export enum MotorStatus {
    NOT_MOVING = "off",
    LESS_THEN_ENCODER_OFFSET = "on, less then encoder offset to finish",
    MORE_THEN_ENCODER_OFFSET = "on, more then encoder offset to finish"
}

export interface MotorConfiguration {
    motor: Motor|SnapMotor,
    name: string
}

export class ArmController {

    static get instance(): ArmController {
        return this._instance;
    }

    private static _instance: ArmController;

    get serialManager(): SerialManager {
        return this._serialManager;
    }

    private readonly _serialManager: SerialManager;
    private motors: Array<MotorConfiguration>;

    constructor(path: string) {
        ArmController._instance = this;
        this._serialManager = new SerialManager(path);
        this.motors = [];
    }

    public init = async (): Promise<void> => {
        try {
            await this.serialManager.connect();
        } catch (e) {
            console.log("Failed to connect! Check console errors above for more information.");
            process.exit(1);
        }
        await this.serialManager.write("X"); // Disable interrupts
        await this.serialManager.write("a P"); // Reset everything on the arm

        this.addMotor("base", new Motor(1));

        // const base = new LinearMotor(3350, 0, 1);
        // base.move(500);
        await this.calibrateAll();
    };

    public calibrateAll = async () => {
      await Promise.all(this.motors.map(async (motorConfig) => {
          console.log("Calibrating \"" + motorConfig.name + "\"...");
          await motorConfig.motor.calibrate();
      }))
    };

    public addMotor = (name: string, motor: Motor|SnapMotor) => {
        console.log("Adding motor \"" + name + "\" with ID #" + motor.motorId);
        this.motors.push({
            name: name,
            motor: motor
        })
    }
}
