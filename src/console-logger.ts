import { Exception } from "@nivinjoseph/n-exception";
import * as Colors from "colors";
import { BaseLogger } from "./base-logger";
import { LogPrefix } from "./log-prefix";
import { LogRecord } from "./log-record";


// public
export class ConsoleLogger extends BaseLogger
{
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
                
                if (this.logInjector)
                    log = this.logInjector(log);
                
                console.log(Colors.grey(JSON.stringify(log)));    
            }
            else
            {
                console.log(Colors.grey(`${this.getDateTime()} ${LogPrefix.debug} ${debug}`));    
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
            
            if (this.logInjector)
                log = this.logInjector(log);
            
            console.log(Colors.green(JSON.stringify(log)));    
        }
        else
        {
            console.log(Colors.green(`${this.getDateTime()} ${LogPrefix.info} ${info}`));    
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
            
            if (this.logInjector)
                log = this.logInjector(log);

            console.warn(Colors.yellow(JSON.stringify(log)));
        }
        else
        {
            console.warn(Colors.yellow(`${this.getDateTime()} ${LogPrefix.warning} ${this.getErrorMessage(warning)}`));
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
            
            if (this.logInjector)
                log = this.logInjector(log);

            console.error(Colors.red(JSON.stringify(log)));
        }
        else
        {
            console.error(Colors.red(`${this.getDateTime()} ${LogPrefix.error} ${this.getErrorMessage(error)}`));
        }
        
        return Promise.resolve();
    }
}