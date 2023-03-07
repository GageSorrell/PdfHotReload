#!/usr/bin/env node

import express, { Express, Request, Response } from "express";
import * as Fs from "fs";
const App : Express = express();
import { ChildProcess, spawn } from "child_process";
import * as Crypto from "crypto";
import * as Path from "path";

App.use(express.static(__dirname + "/static"));

const WebPagePath = __dirname + "\\Index.html";
const TexFilePath : string = Path.resolve(process.argv[2]);
const PdfPath : string = __dirname + "\\static\\" + Path.basename(TexFilePath, ".tex") + ".pdf";

async function ValidateEnvironment() : Promise<boolean>
{
    return new Promise((Resolve, Reject) =>
    {
        /* This assumes that we are on exactly linux, MacOS, or Windows. */
        const WhereWhichCommand : string = process.platform === "linux" || process.platform === "darwin"
            ? "which"
            : "where";

        const WhereWhichProcess : ChildProcess = spawn(WhereWhichCommand, [ "latexmk" ]);
        WhereWhichProcess.stderr.on("data", (Chunk : any) : void =>
        {
            console.error("🚨 latexmk is not installed!  pdfhotreload is exiting...\n");
            Resolve(false);
        });

        WhereWhichProcess.on("close", (Code : number, Signal : NodeJS.Signals) : void =>
        {
            Resolve(true);
        });
    });
}

function CompileTexFile() : void
{
    const TexDirectory : string = Path.dirname(TexFilePath);
    // const Process : ChildProcess = spawn("latexmk", [ "-pdf", "-f", `-output-directory="${PdfPath}"`, TexFilePath ]);
    Fs.unlink(PdfPath, (Error) =>
    {
        if(Error)
        {
            // console.log(Error);
        }

        const Latexmk : ChildProcess = spawn("latexmk", [ "-pdf", `-output-directory=${__dirname + "\\static"}`, TexFilePath ]);
        Latexmk.stderr.on("data", (Chunk : any) : void =>
        {
            let ChunkString : string = Chunk.toString();
            if(ChunkString.startsWith("Reverting"))
            {
                return;
            }

            let ErrorMessage : string = "✋ There was an error compiling your last edit:\n";
            ChunkString.replace(/(\r\n|\r|\n)/g, `$1➡\n️`);
            ErrorMessage += ChunkString;
            ErrorMessage += "🛑 This ends the error message.";
            console.warn(ErrorMessage);
        });
    });
}

function WatchTexFile() : void
{
    Fs.watch(TexFilePath, (EventType : Fs.WatchEventType, FileName : string) : void =>
    {
        if(EventType === "change")
        {
            CompileTexFile();
        }
    });
}

let PdfHashString : string = "";
/** Update the hash iff the PDF is valid or if the app is starting up. */
function UpdatePdfHashString() : string
{
    const PdfHash : Crypto.Hash = Crypto.createHash("sha256");
    try
    {
        const PdfFile : any = Fs.readFileSync(PdfPath);
        const bPdfValid : boolean = Buffer.isBuffer(PdfFile) && PdfFile.lastIndexOf("%PDF-") === 0 && PdfFile.lastIndexOf("%%EOF") > -1;
        if(bPdfValid || PdfHashString === "")
        {
            PdfHash.update(PdfFile);
            PdfHashString = PdfHash.digest("hex");
            return PdfHashString;
        }
    }
    catch(Error)
    {
        // console.log(Error);
    }
}

async function Main() : Promise<void>
{
    await ValidateEnvironment();
    CompileTexFile();
    WatchTexFile();

    App.get("/", (Request : Request, Response : Response) =>
    {
        if(Request.query.file !== Path.basename(PdfPath))
        {
            Response.redirect(`/?file=${Path.basename(PdfPath)}`);
        }
        else
        {
            const WebPageHtml : string = Fs.readFileSync(WebPagePath, "utf8");
            Response.send(WebPageHtml);
        }
    });

    App.get
    (
        "/get-hash",
        (Request : Request, Response : Response) =>
        {
            UpdatePdfHashString();
            Response.send(PdfHashString);
        }
    );

    App.listen(1985, () =>
    {
        console.log("👍 pdf-hot-reload is running.");
    });
}

Main();