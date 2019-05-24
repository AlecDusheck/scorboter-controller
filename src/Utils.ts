export class Utils {
    public static delay = (ms: number) => {
        return new Promise(resolve => {
            setTimeout(() => {
                return resolve
            }, ms);
        })
    }
}
