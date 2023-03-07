#!/usr/bin/env node

import express, { Express, Request, Response } from "express";
import * as Fs from "fs";
const App : Express = express();
import { ChildProcess, spawn } from "child_process";
import * as Crypto from "crypto";
import * as Path from "path";

App.use(express.static(__dirname + "/static"));

const WebPagePath = "./Index.html";
const TexFilePath : string = Path.resolve(process.argv[2]);
let PdfPath : string = __dirname + "\\static\\" + Path.basename(TexFilePath, ".tex") + ".pdf";

// spawn("Get-Command", [ "latexmk" ]).addListener("exit", (Code : number, Signal : NodeJS.Signals) : void =>
// {
//     if(Code !== 0)
//     {

//     }
// });

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
            console.error("latexmk is not installed!  pdfhotreload is exiting...\n");
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
            console.log(Error);
        }

        spawn("latexmk", [ "-pdf", `-output-directory=${__dirname + "\\static"}`, TexFilePath ]);
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

function GetPdfHashString() : string
{
    const PdfHash : Crypto.Hash = Crypto.createHash("sha256");
    try
    {
        const PdfFile : any = Fs.readFileSync(PdfPath);
        PdfHash.update(PdfFile);
        const PdfHashString : string = PdfHash.digest("hex");
        return PdfHashString;
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
            Response.send(GetPdfHashString());
        }
    );

    App.listen(1985, () =>
    {
        console.log("Server running on port 1985");
    });
}

Main();