import { Exception } from "@nivinjoseph/n-exception";
import { BaseLogger } from "./base-logger";
import { LogPrefix } from "./log-prefix";
import { LogRecord } from "./log-record";

// public
export class ConsoleLogger extends BaseLogger
{
    private readonly _stream = process.stdout;
    
    public logDebug(debug: string): Promise<void>
    {
        if (this.env === "dev")
        {
            if (this.useJsonFormat)
            {
                let log: LogRecord = {
                    source: this.source,
                    service: this.service,
                    env: this.env,
                    level: "Debug",
                    message: debug,
                    dateTime: this.getDateTime(),
                    time: new Date().toISOString()
                };
                
                this.injectTrace(log);
                
                if (this.logInjector)
                    log = this.logInjector(log);
                
                this._stream.write(JSON.stringify(log) + "\n");    
            }
            else
            {
                this._stream.write(`${this.getDateTime()} ${LogPrefix.debug} ${debug}\n`);    
            }
        }
        
        return Promise.resolve();
    }
    
    public logInfo(info: string): Promise<void>
    {
        if (this.useJsonFormat)
        {
            let log: LogRecord = {
                source: this.source,
                service: this.service,
                env: this.env,
                level: "Info",
                message: info,
                dateTime: this.getDateTime(),
                time: new Date().toISOString()
            };
            
            this.injectTrace(log);
            
            if (this.logInjector)
                log = this.logInjector(log);
            
            this._stream.write(JSON.stringify(log) + "\n");    
        }
        else
        {
            this._stream.write(`${this.getDateTime()} ${LogPrefix.info} ${info}\n`);    
        }
        
        return Promise.resolve();
    }

    public logWarning(warning: string | Exception): Promise<void>
    {
        if (this.useJsonFormat)
        {
            let log: LogRecord = {
                source: this.source,
                service: this.service,
                env: this.env,
                level: "Warn",
                message: this.getErrorMessage(warning),
                dateTime: this.getDateTime(),
                time: new Date().toISOString()
            };
            
            this.injectTrace(log);
            
            if (this.logInjector)
                log = this.logInjector(log);

            this._stream.write(JSON.stringify(log) + "\n");
        }
        else
        {
            this._stream.write(`${this.getDateTime()} ${LogPrefix.warning} ${this.getErrorMessage(warning)}\n`);
        }
        
        return Promise.resolve();
    }

    public logError(error: string | Exception): Promise<void>
    {
        if (this.useJsonFormat)
        {
            let log: LogRecord = {
                source: this.source,
                service: this.service,
                env: this.env,
                level: "Error",
                message: this.getErrorMessage(error),
                dateTime: this.getDateTime(),
                time: new Date().toISOString()
            };
            
            this.injectTrace(log, true);
            
            if (this.logInjector)
                log = this.logInjector(log);

            this._stream.write(JSON.stringify(log) + "\n");
        }
        else
        {
            this._stream.write(`${this.getDateTime()} ${LogPrefix.error} ${this.getErrorMessage(error)}\n`);
        }
        
        return Promise.resolve();
    }
}