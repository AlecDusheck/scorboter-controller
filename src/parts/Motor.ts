import {ArmController, BinaryReturn} from "../ArmController";
import {Utils} from "../Utils";

export class Motor {

    public static EDGE_UNITS = 15;
    public static EDGE_SPEED = 2;
    public static EDGE_WAIT = 500;

    public static CENTER_UNITS = 25;
    public static CENTER_SPEED = 3;
    public static CENTER_WAIT = 500;


    get motorId(): number{
        return this._motorId;
    }

    get maxUnits(): number{
        return this._maxUnits;
    }

    set maxUnits(value: number){
        this._maxUnits = value;
    }

    private currentUnits: number;

    private _maxUnits: number;
    private readonly _motorId: number;

    constructor (motorId: number, maxUnits?: number) {
        this._motorId = motorId;

        this._maxUnits = maxUnits;
        this.currentUnits = 0;
    }

    public calibrate = async (): Promise<number> => {
        await this.setSpeed(Motor.EDGE_SPEED);
        await this.moveToEdge(); // Move to the edge

        await this.resetMotor();

        await this.setSpeed(Motor.CENTER_SPEED);
        this.maxUnits = await this.moveToCenterFromEdge();
        return this.maxUnits;
    };

    private resetMotor = async (): Promise<void> => {
        await ArmController.instance.serialManager.write(this.motorId + " R");
    };

    private getRemaining = async (): Promise<any> => { // IDK what this type is
        ArmController.instance.serialManager.clearQueue();
        await ArmController.instance.serialManager.write(this.motorId + " Q");
        return await ArmController.instance.serialManager.getNextData();
    };

    private moveToEdge = async () => {
        await ArmController.instance.serialManager.write(this.motorId + " M + " + Motor.EDGE_UNITS + "\r");
        await Utils.delay(Motor.EDGE_WAIT);

        const bytes = await this.getRemaining();

        // Thanks Jack and Andrew! http://www.theoldrobots.com/book45/ER3-Manual.pdf Page 132
        const movementRemaining = ((bytes[0] & 127) << 7) | (bytes[1] & 127);
        if(movementRemaining > Motor.EDGE_UNITS - 1) return;

         await this.moveToEdge();
    };

    private moveToCenterFromEdge = async (iterations: number = 0): Promise<number> => {
        if(await this.getLimitSwitch() === BinaryReturn.ON) return iterations;
        await ArmController.instance.serialManager.write(this.motorId + " M - " + Motor.CENTER_UNITS + "\r");
        await Utils.delay(Motor.CENTER_WAIT);

        return await this.moveToCenterFromEdge(iterations + 10);
    };


    public getLimitSwitch = async (): Promise<BinaryReturn> => {
        ArmController.instance.serialManager.clearQueue();
        await ArmController.instance.serialManager.write(this.motorId + " L");

        const result = (await ArmController.instance.serialManager.getNextData()).toString();

        // http://www.theoldrobots.com/book45/ER3-Manual.pdf page 129
        if (result === "0") return BinaryReturn.OFF;
        return BinaryReturn.ON;
    };

    public setSpeed = async (speed: number) => {
        if (speed < 1 || speed > 9) return;
        await ArmController.instance.serialManager.write(this.motorId + " V " + speed);
    };

    public move = async (units: number) => {
        if(!this.maxUnits) throw new Error("Motor must be calibrated first!");

        let amount;
        let symbol;

        if(units < 0) { // We're moving back
            const maxUnitsReverse = this.maxUnits * -1; // Pos 0 is at the center, you can go positive or negative the same amount
            if (this.currentUnits + units < maxUnitsReverse) { // We're going negative, fix it
                amount = this.currentUnits - this.maxUnits;
                this.currentUnits = maxUnitsReverse;
            } else {
                this.currentUnits = this.currentUnits - units;
                amount = units; // All is fine
            }
            symbol = "-";
        } else {
            if(this.currentUnits + units > this.maxUnits) {
                amount = this.maxUnits - this.currentUnits;
                this.currentUnits = this.maxUnits;
            } else {
                this.currentUnits = this.currentUnits + units;
                amount = units;
            }
            symbol = "+";
        }

        await ArmController.instance.serialManager.write(this.motorId + " M " + symbol + " " + amount + "\r");
    };
}
