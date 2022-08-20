import { Exception } from "@nivinjoseph/n-exception";
import { ConfigurationManager } from "@nivinjoseph/n-config";
import * as moment from "moment-timezone";
import { LogDateTimeZone } from "./log-date-time-zone";
import "@nivinjoseph/n-ext";
import { given } from "@nivinjoseph/n-defensive";
import * as Fs from "fs";
import * as Path from "path";
import { Make, Duration, Mutex } from "@nivinjoseph/n-util";
import { BaseLogger } from "./base-logger";
import { LogPrefix } from "./log-prefix";


// public
export class FileLogger extends BaseLogger
{
    private readonly _source = "nodejs";
    private readonly _service = ConfigurationManager.getConfig<string>("package.name");
    private readonly _env = ConfigurationManager.getConfig<string>("env");
    
    private readonly _mutex = new Mutex();
    private readonly _logDirPath: string;
    private readonly _retentionDays: number;
    
    private _lastPurgedAt = 0;

    
    public constructor(config: { logDirPath: string; retentionDays: number; logDateTimeZone?: LogDateTimeZone; useJsonFormat?: boolean; })
    {
        super(config);
        
        const { logDirPath, retentionDays } = config;
        
        given(logDirPath, "logDirPath").ensureHasValue().ensureIsString()
            .ensure(t => Path.isAbsolute(t), "must be absolute");
            
        given(retentionDays, "retentionDays").ensureHasValue().ensureIsNumber().ensure(t => t > 0);
        this._retentionDays = Number.parseInt(retentionDays.toString());
        
        if (!Fs.existsSync(logDirPath))
            Fs.mkdirSync(logDirPath);
        
        this._logDirPath = logDirPath;
    }


    public async logDebug(debug: string): Promise<void>
    {
        if (ConfigurationManager.getConfig<string>("env") === "dev")
            await this._writeToLog(LogPrefix.debug, debug);
    }

    public async logInfo(info: string): Promise<void>
    {
        await this._writeToLog(LogPrefix.info, info);
    }

    public async logWarning(warning: string | Exception): Promise<void>
    {
        await this._writeToLog(LogPrefix.warning, this.getErrorMessage(warning));
    }

    public async logError(error: string | Exception): Promise<void>
    {
        await this._writeToLog(LogPrefix.error, this.getErrorMessage(error));
    }
    
    private async _writeToLog(status: LogPrefix, message: string): Promise<void>
    {
        given(status, "status").ensureHasValue().ensureIsEnum(LogPrefix);
        given(message, "message").ensureHasValue().ensureIsString();
        
        const dateTime = this.getDateTime();
        
        if (this.useJsonFormat)
        {
            let level = "";
            
            switch (status)
            {
                case LogPrefix.debug:
                    level = "Debug";
                    break;
                case LogPrefix.info:
                    level = "Info";
                    break;
                case LogPrefix.warning:
                    level = "Warn";
                    break;
                case LogPrefix.error:
                    level = "Error";
                    break;
            }
            
            const log = {
                source: this._source,
                service: this._service,
                env: this._env,
                status: level,
                message,
                dateTime,
                time: new Date().toISOString()
            };
            
            message = JSON.stringify(log);
        }
        else
        {
            message = `${dateTime} ${status} ${message}`;
        }
        
        const logFileName = `${dateTime.substr(0, 13)}.log`;
        const logFilePath = Path.join(this._logDirPath, logFileName);
        
        await this._mutex.lock();
        try 
        {
            await Fs.promises.appendFile(logFilePath, `\n${message}`);

            await this._purgeLogs();   
        }
        catch (error)
        {
            console.error(error);
        }
        finally
        {
            this._mutex.release();
        }
    }
    
    private async _purgeLogs(): Promise<void>
    {
        const now = Date.now();
        if (this._lastPurgedAt && this._lastPurgedAt > (now - Duration.fromDays(this._retentionDays).toMilliSeconds()))
            return;
        
        const files = await Make.callbackToPromise<ReadonlyArray<string>>(Fs.readdir)(this._logDirPath);
        await files.forEachAsync(async (file) =>
        {
            const filePath = Path.join(this._logDirPath, file);
            const stats = await Make.callbackToPromise<Fs.Stats>(Fs.stat)(filePath);
            if (stats.isFile() && moment(stats.birthtime).valueOf() < (now - Duration.fromDays(this._retentionDays).toMilliSeconds()))
                await Make.callbackToPromise(Fs.unlink)(filePath);
        }, 1);
        
        this._lastPurgedAt = now;
    }
}