import {SerialManager} from "./SerialManager";

export class ArmController {
    static get instance(): ArmController {
        return this._instance;
    }

    static set instance(value: ArmController) {
        this._instance = value;
    }

    get serialManager(): SerialManager {
        return this._serialManager;
    }

    set serialManager(value: SerialManager) {
        this._serialManager = value;
    }
    private static _instance: ArmController;

    private _serialManager: SerialManager;

    constructor (path: string) {
        ArmController.instance = this;
        this._serialManager = new SerialManager(path);
    }

    public init = () => {
        this.serialManager.connect();



    }
}
