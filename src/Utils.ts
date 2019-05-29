export class Utils {
    public static delay = (ms: number): Promise<void> => {
        return new Promise(resolve => {
            setTimeout(() => {
                return resolve();
            }, ms);
        })
    }
}
