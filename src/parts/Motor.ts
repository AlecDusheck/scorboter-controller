import {ArmController, BinaryReturn} from "../ArmController";
import {Utils} from "../Utils";

export enum MotorDirection {
    PLUS = "+",
    NEGATIVE = "-"
}

export class Motor {
    public static EDGE_UNITS = 15;
    public static EDGE_SPEED = 2;
    public static EDGE_WAIT = 500;

    public static CENTER_UNITS = 25;
    public static CENTER_SPEED = 3;
    public static CENTER_WAIT = 500;

    public static RECENTER_SPEED = 5;

    get posMax(): number {
        return this._posMax;
    }

    set posMax(value: number) {
        this._posMax = value;
    }

    get negMax(): number {
        return this._negMax;
    }

    set negMax(value: number) {
        this._negMax = value;
    }

    get currentUnits(): number {
        return this._currentUnits;
    }

    set currentUnits(value: number) {
        this._currentUnits = value;
    }

    get motorId(): number{
        return this._motorId;
    }

    private _currentUnits: number;
    private _posMax: number;
    private _negMax: number;
    private readonly _motorId: number;

    constructor (motorId: number) {
        this._motorId = motorId;

        this._posMax = undefined;
        this._negMax = undefined;
        this._currentUnits = undefined;
    }

    private resetMotor = async (): Promise<void> => {
        await ArmController.instance.serialManager.write(this.motorId + " R");
    };

    private getRemaining = async (): Promise<number> => {
        await ArmController.instance.serialManager.write(this.motorId + " Q");
        const bytes = await ArmController.instance.serialManager.getNextData(2); // Two bytes are sent

        // Thanks Jack and Andrew! http://www.theoldrobots.com/book45/ER3-Manual.pdf Page 132
        return ((bytes[0] & 127) << 7) | (bytes[1] & 127);
    };

    public calibrate = async (): Promise<void> => {
        // Move to positive hardstop
        await this.setSpeed(Motor.EDGE_SPEED);
        await this.moveToHardstop(MotorDirection.PLUS); // Move to the edge

        // Move to center
        await this.resetMotor();
        await this.setSpeed(Motor.CENTER_SPEED);
        this.posMax = await this.moveFromHardstopToCenter(MotorDirection.PLUS);

        // Move to negative hardstop
        await this.resetMotor();
        await this.setSpeed(Motor.EDGE_SPEED);
        this.negMax = await this.moveToHardstop(MotorDirection.NEGATIVE);

        // Recenter
        await this.setSpeed(Motor.RECENTER_SPEED);
        await ArmController.instance.serialManager.write(this.motorId + " M " + MotorDirection.PLUS + " " + this.negMax + "\r");
        this.currentUnits = 0;
    };

    private moveToHardstop = async (direction: MotorDirection, iterations: number = 0): Promise<number> => {
        await ArmController.instance.serialManager.write(this.motorId + " M " + direction + " " + Motor.EDGE_UNITS + "\r");
        await Utils.delay(Motor.EDGE_WAIT);

        const movementRemaining = await this.getRemaining();
        if(movementRemaining > 0) return; // If any movement is left return

         await this.moveToHardstop(direction, iterations + Motor.EDGE_UNITS);
    };

    private moveFromHardstopToCenter = async (hardstopDirection: MotorDirection, iterations: number = 0): Promise<number> => {
        if(await this.getLimitSwitch() === BinaryReturn.ON) return iterations;

        let invertedMotorDirection; // We need to invert the hardstop direction since we're moving the other way
        if(hardstopDirection === MotorDirection.PLUS) invertedMotorDirection = MotorDirection.NEGATIVE;
        else invertedMotorDirection = MotorDirection.PLUS;

        await ArmController.instance.serialManager.write(this.motorId + " M " + invertedMotorDirection + " " + Motor.CENTER_UNITS + "\r");
        await Utils.delay(Motor.CENTER_WAIT);

        return await this.moveFromHardstopToCenter(hardstopDirection, iterations + Motor.CENTER_UNITS);
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
        if(!this._posMax || !this._negMax || !this._currentUnits) throw new Error("Motor must be calibrated first!");

        let amount;
        let direction: MotorDirection;
        if(units < 0) { // We're moving back
            const maxUnitsReverse = this.negMax * -1; // Pos 0 is at the center, you can go positive or negative the same amount
            if (this._currentUnits + units < maxUnitsReverse) { // We're going negative, fix it
                amount = this._currentUnits - this.negMax;
                this.currentUnits = maxUnitsReverse;
            } else {
                this._currentUnits = this._currentUnits - units;
                amount = units; // All is fine
            }
            direction = MotorDirection.NEGATIVE;
        } else {
            if(this._currentUnits + units > this.posMax) {
                amount = this.posMax - this._currentUnits;
                this._currentUnits = this.posMax;
            } else {
                this._currentUnits = this._currentUnits + units;
                amount = units;
            }
            direction = MotorDirection.PLUS;
        }

        await ArmController.instance.serialManager.write(this.motorId + " M " + direction + " " + amount + "\r");
    };
}
