import {SerialManager} from "./SerialManager";
import {SnapMotor} from "./parts/SnapMotor";
import {Motor} from "./parts/Motor";

import * as fs from "fs-extra";
import * as path from 'path';

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
    motor: Motor | SnapMotor,
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

    constructor(serialPath: string) {
        ArmController._instance = this;
        this._serialManager = new SerialManager(serialPath);
        this.motors = [];
    }

    public configureMotors = () => {
        this.addMotor("base", new Motor(1));
        this.addMotor("elbow1", new Motor(2));
        // this.addMotor("elbow2", new Motor(3));
        // this.addMotor("finger1", new Motor(4));
        // this.addMotor("finger2", new Motor(5));

    };

    public init = async (): Promise<void> => {
        try {
            await this.serialManager.connect();
        } catch (e) {
            console.log("Failed to connect! Check console errors above for more information.");
            process.exit(1);
        }
        await this.serialManager.write("X"); // Disable interrupts
        await this.serialManager.write("a P"); // Reset everything on the arm

        this.configureMotors();

        await this.calibrateAll();
    };

    public calibrateAll = async () => {
        // const localStoragePath = path.join(__dirname, "../localstorage/cache.json");
        //
        // let cache: Array<any>;
        // try{
        //     cache = await fs.readJSON(localStoragePath);
        //     console.log("Loaded cache with " + cache.length + " entries.");
        // }catch (e) {
        //     await fs.outputJson(localStoragePath, []);
        //     cache = [];
        //     console.log("Generated new cache file");
        // }

        for (const motorConfig of this.motors) {
            // const cachedMax = cache[motorConfig.name];
            // if (cachedMax) {
            //     console.log("Got cached data for motor \"" + motorConfig.name + "\", Units: " + cachedMax);
            //     motorConfig.motor.maxUnits = cachedMax;
            //     return;
            // }

            console.log("Calibrating \"" + motorConfig.name + "\"...");
            await motorConfig.motor.calibrate();
        }
    };

    public addMotor = (name: string, motor: Motor | SnapMotor) => {
        console.log("Adding motor \"" + name + "\" with ID #" + motor.motorId);
        this.motors.push({
            name: name,
            motor: motor
        })
    }
}
