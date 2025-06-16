export interface LogContext {
  userId?: string;
  channel?: string;
  threadTs?: string;
  error?: Error;
  duration?: number;
  [key: string]: any;
}

export class Logger {
  constructor(private serviceName: string) {}

  info(message: string, context?: LogContext): void {
    console.log(JSON.stringify({
      level: 'info',
      service: this.serviceName,
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(JSON.stringify({
      level: 'warn',
      service: this.serviceName,
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  }

  error(message: string, error: Error, context?: LogContext): void {
    console.error(JSON.stringify({
      level: 'error',
      service: this.serviceName,
      message,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      ...context
    }));
  }

  metric(name: string, value: number, tags?: Record<string, string>): void {
    console.log(JSON.stringify({
      level: 'metric',
      service: this.serviceName,
      metric: name,
      value,
      timestamp: new Date().toISOString(),
      tags
    }));
  }
}