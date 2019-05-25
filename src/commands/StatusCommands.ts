import {ArmController} from "../ArmController";

export enum BinaryReturn {
    OFF = "off",
    ON = "on"
}

export enum MotorStatus {
    NOT_MOVING = "off",
    LESS_THEN_ENCODER_OFFSET = "on, less then encoder offset to finish",
    MORE_THEN_ENCODER_OFFSET = "on, more then encoder offset to finish"
}

export class StatusCommands {
    public getInputStatus = async (input: number): Promise<BinaryReturn> => {
        await ArmController.instance.serialManager.write(input + " I");

        const data = await ArmController.instance.serialManager.getNextData();
        if (data === "0") {
            return BinaryReturn.OFF
        }
        return BinaryReturn.ON;
    };

    public getLimitSwitchStatus = async (input: number): Promise<BinaryReturn> => {
        await ArmController.instance.serialManager.write(input + " L");

        const data = await ArmController.instance.serialManager.getNextData();
        if (data === "0") {
            return BinaryReturn.OFF
        }
        return BinaryReturn.ON;
    };

    public getMotorCompletion = async (): Promise<BinaryReturn> => {
        await ArmController.instance.serialManager.write("E");

        const data = await ArmController.instance.serialManager.getNextData();
        if (data === "0") {
            return BinaryReturn.OFF;
        }
        return BinaryReturn.ON;
    };

    public getMotorStatus = async (): Promise<MotorStatus> => {
        await ArmController.instance.serialManager.write("A");

        const data = await ArmController.instance.serialManager.getNextData();
        if (data === "0") {
            return MotorStatus.NOT_MOVING;
        } else if (data === "-") {
            return MotorStatus.LESS_THEN_ENCODER_OFFSET;
        }
        return MotorStatus.MORE_THEN_ENCODER_OFFSET;
    };
}
