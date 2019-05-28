import {ArmController, BinaryReturn} from "../ArmController";

export class Motor {

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
        await ArmController.instance.serialManager.write(this.motorId + " V " + 1); // Update the speed
        await this.moveToEdge(this.maxUnits / 50); // Move to the edge
        this.maxUnits = await this.moveToCenterFromEdge();
        return this.maxUnits;
    };

    private moveToEdge = async (count: number) => {
        if (count < 1) return;
        await ArmController.instance.serialManager.write(this.motorId + " M + 50");

        await this.moveToEdge(count - 1);
    };

    private moveToCenterFromEdge = async (iterations: number = 0): Promise<number> => {
        if(await this.getLimitSwitch() === BinaryReturn.ON) return iterations;
        await ArmController.instance.serialManager.write(this.motorId + " M - 50");

        return await this.moveToCenterFromEdge(iterations + 50);
    };


    public getLimitSwitch = async (): Promise<BinaryReturn> => {
        ArmController.instance.serialManager.clearQueue();
        await ArmController.instance.serialManager.write(this.motorId + " L");

        const result = await ArmController.instance.serialManager.getNextData();
        if (result === "0") return BinaryReturn.OFF;
        return BinaryReturn.ON;
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

        await ArmController.instance.serialManager.write(this.motorId + " M " + symbol + " " + amount);
    };
}
