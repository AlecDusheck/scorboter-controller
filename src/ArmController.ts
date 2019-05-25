import {SerialManager} from "./SerialManager";

export class ArmController {
    private readonly _serialManager: SerialManager;

    constructor(path: string) {
        ArmController.instance = this;
        this._serialManager = new SerialManager(path);
    }

    private static _instance: ArmController;

    static get instance(): ArmController {
        return this._instance;
    }

    static set instance(value: ArmController) {
        this._instance = value;
    }

    get serialManager(): SerialManager {
        return this._serialManager;
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
    }
}
