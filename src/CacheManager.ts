import * as path from "path";
import {ArmController} from "./ArmController";
import * as fs from "fs-extra";

export interface MotorCache {
    motor: string,
    cachedNegMax: number,
    cachedPosMax: number,
    cachedPosition: number
}

export class CacheManager {

    static get configPath() {
        return path.join(ArmController.root, "../localstorage/cache.json");
    }

    private static getCacheData = async (): Promise<Array<MotorCache>> => {
        const localStoragePath = CacheManager.configPath;

        let cache: Array<MotorCache>;
        try {
            cache = await fs.readJSON(localStoragePath);
            console.log("Loaded cache with " + cache.length + " entries.");
        } catch (e) {
            await CacheManager.storeCacheData([]);
            cache = [];
            console.log("Generated new cache file");
        }
        return cache;
    };

    private static storeCacheData = async (cache: Array<MotorCache>): Promise<void> => {
        const localStoragePath = CacheManager.configPath;
        await fs.outputJson(localStoragePath, cache);
    };

    public static storeStates = async () => {
        const newCache: Array<MotorCache> = [];
        for (const motorConfig of ArmController.instance.motors) {
            newCache.push({
                motor: motorConfig.name,
                cachedNegMax: motorConfig.motor.negMax,
                cachedPosMax: motorConfig.motor.posMax,
                cachedPosition: motorConfig.motor.currentUnits
            })
        }

        await CacheManager.storeCacheData(newCache);
    };

    public static loadStates = async (skipCache?: boolean) => {
        const cache = await CacheManager.getCacheData();
        for (const motorConfig of ArmController.instance.motors) {
            if (skipCache !== undefined && skipCache === true) { // Check to see if we need to skip cache
                const cacheData = cache.find(motorCache => motorCache.motor === motorConfig.name);

                if (cacheData) {
                    console.log("Got cached data for motor \"" + motorConfig.name + "\"");
                    motorConfig.motor.posMax = cacheData.cachedPosMax;
                    motorConfig.motor.negMax = cacheData.cachedNegMax;
                    motorConfig.motor.currentUnits = cacheData.cachedPosition;
                    return;
                }
            }

            console.log("Calibrating \"" + motorConfig.name + "\"...");
            await motorConfig.motor.calibrate();
        }
    };

    public static exitHandler = async () => {
        console.log("Please wait, saving cache data!");
        await CacheManager.storeStates();
        process.exit(0);
    };

    public static bindToStdin = () => {
        process.stdin.resume(); // So the program will not close instantly

        process.on('exit', CacheManager.exitHandler);
        process.on('SIGINT', CacheManager.exitHandler);
        process.on('SIGUSR1', CacheManager.exitHandler);
        process.on('SIGUSR2', CacheManager.exitHandler);
        process.on('uncaughtException', CacheManager.exitHandler);
    }
}
