const styles = {
    bold: '\x1B[1m',
    italic: '\x1B[3m',
    underline: '\x1B[4m',
    inverse: '\x1B[7m',
    strikethrough: '\x1B[9m',
    white: '\x1B[37m',
    grey: '\x1B[90m',
    black: '\x1B[30m',
    blue: '\x1B[34m',
    cyan: '\x1B[36m',
    green: '\x1B[32m',
    magenta: '\x1B[35m',
    red: '\x1B[31m',
    yellow: '\x1B[33m',
    whiteBG: '\x1B[47m',
    greyBG: '\x1B[49;5;8m',
    blackBG: '\x1B[40m',
    blueBG: '\x1B[44m',
    cyanBG: '\x1B[46m',
    greenBG: '\x1B[42m',
    magentaBG: '\x1B[45m',
    redBG: '\x1B[41m',
    yellowBG: '\x1B[43m'
};

export const log = (message: string): void => console.log(`${styles.green}[${new Date().toLocaleString()}] ${message}${styles.white}`);
export const warn = (message: string): void => console.log(`${styles.yellow}[${new Date().toLocaleString()}] ${message}${styles.white}`);
export const error = (message: string): void => console.log(`${styles.red}[${new Date().toLocaleString()}] ${message}${styles.white}`);