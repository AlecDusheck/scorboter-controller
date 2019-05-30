import {ArmController} from "./src/ArmController";

let path = "/dev/ttyUSB0";
let skipCache = false;

process.argv.forEach((val, index, array) => {
    if (val === "-path") {
        if (index + 1 >= array.length) return;

        path = array[index + 1];
    } else if (val === "-skipCache") {
        skipCache = true;
        console.log("Skipping cache checking. This will cause all motors to calibrate and the cache to be regenerated!");
    }
});

console.log("Using path: " + path + ". Change this by using the -path flag");

const controller = new ArmController(path);
controller.init(skipCache);

// import {Testing} from "./src/Testing";
//
// new Testing();
