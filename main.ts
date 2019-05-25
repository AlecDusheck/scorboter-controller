import {ArmController} from "./src/ArmController";

let path = "/dev/ttyUSB0";

process.argv.forEach((val, index, array) => {
    if (val === "-path") {
        if (index + 1 >= array.length) return;

        path = array[index + 1];
    }
});

console.log("Using path: " + path + ". Change this by using the -path flag");

const controller = new ArmController(path);
controller.init();
