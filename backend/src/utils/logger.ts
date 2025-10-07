interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  private level: number;

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase() || "INFO";
    this.level = LOG_LEVELS[envLevel as keyof LogLevel] ?? LOG_LEVELS.INFO;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : "";
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  private log(level: number, levelName: string, message: string, ...args: any[]): void {
    if (level <= this.level) {
      const formattedMessage = this.formatMessage(levelName, message, ...args);
      console.log(formattedMessage);
    }
  }

  error(message: string, ...args: any[]): void {
    this.log(LOG_LEVELS.ERROR, "ERROR", message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LOG_LEVELS.WARN, "WARN", message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LOG_LEVELS.INFO, "INFO", message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.log(LOG_LEVELS.DEBUG, "DEBUG", message, ...args);
  }
}

export const logger = new Logger();
export default logger;