import {SerialManager} from "../SerialManager";
import {ArmController} from "../ArmController";

export enum Motor {
    BASE = 1,
    ELBOW = 2
}

export class MoveCommands {
    public resetMotor = async (motor: Motor) => {
        await ArmController.instance.serialManager.write(motor + " R");
    };

    public stopMotor = async (motor: Motor) => {
        await ArmController.instance.serialManager.write(motor + " P");
    };

    public emergencyStopMotors = async () => {
        await ArmController.instance.serialManager.write("B");
    };

    public resumeMotors = async () => {
        await ArmController.instance.serialManager.write("C");
    };


}
