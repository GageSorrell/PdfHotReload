import { ChildProcess, spawn } from "child_process";

export interface FEnvironmentDescription
{
    /** Does the system have termux?  This will affect how we try to open the PDF. */
    bHasTermux : boolean;
};

export class FEnvironmentValidator
{
    constructor()
    {
        this.WhereWhichCommand = process.platform === "linux" || process.platform === "darwin"
            ? "which"
            : "where";
    }

    private WhereWhichCommand : string;

    public EnvironmentDescription : FEnvironmentDescription =
    {
        bHasTermux: false
    };

    public Validate() : Promise<any>
    {
        // return Promise.all([ this.CheckForCommand("latexmk"), this.CheckForCommand("termux-open") ]);
        return new Promise<void>((Resolve, Reject) =>
        {
            this.CheckForCommand("latexmk").then((bExistsOnSystem : boolean) : void =>
            {
                if(!bExistsOnSystem)
                {
                    console.error("🚨 ${Command} is not installed!  pdfhotreload is exiting...\n");
                    process.exit(1);
                }
            });

            this.CheckForCommand("termux-open").then((bExistsOnSystem : boolean) : void =>
            {
                this.EnvironmentDescription.bHasTermux = bExistsOnSystem;
                Resolve();
            });
        });
    }

    private CheckForCommand(Command : string) : Promise<boolean>
    {
        return new Promise<boolean>((Resolve, Reject) =>
        {
            const WhereWhichProcess : ChildProcess = spawn(this.WhereWhichCommand, [ Command ]);
            WhereWhichProcess.stderr.on("data", (Chunk : any) : void =>
            {
                Resolve(false);
            });

            WhereWhichProcess.on("close", (Code : number, Signal : NodeJS.Signals) : void =>
            {
                Resolve(true);
            });
        })
    }
};