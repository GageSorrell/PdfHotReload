#!/usr/bin/env node

import express, { Express, Request, Response } from "express";
import * as Fs from "fs";
const App : Express = express();
import { ChildProcess, spawn } from "child_process";
import * as Crypto from "crypto";
import * as Path from "path";
import open from "open";

import { FEnvironmentValidator, FEnvironmentDescription } from "./ValidateEnvironment";

App.use(express.static(Path.resolve(__dirname, "static")));

const WebPagePath = Path.resolve(__dirname, "Index.html");
const TexFilePath : string = Path.resolve(process.argv[2]);
const PdfPath : string = Path.resolve(__dirname, "static", Path.basename(TexFilePath, ".tex") + ".pdf");

function CompileTexFile() : Promise<boolean>
{
    return new Promise<boolean>((Resolve, Reject) : void =>
    {
        Fs.unlink(PdfPath, (Error) =>
        {
            if(Error)
            {
                // console.log(Error);
            }

            const Latexmk : ChildProcess = spawn("latexmk", [ "-pdf", `-output-directory=${Path.resolve(__dirname, "static")}`, TexFilePath ]);
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
                Resolve(false);
            });

            Latexmk.addListener("close", (Code : number, Signal : NodeJS.Signals) : void =>
            {
                if(Code === 0)
                {
                    Resolve(true);
                }
                else
                {
                    Resolve(false);
                }
            });
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
    App.get
    (
        "/",
        (Request : Request, Response : Response) =>
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
        }
    );

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

    const EnvironmentValidator = new FEnvironmentValidator();
    await EnvironmentValidator.Validate();
    CompileTexFile().then(() : void =>
    {
        if(EnvironmentValidator.EnvironmentDescription.bHasTermux)
        {
            spawn("termux-open", [ "http://localhost:1985/" ])
        }
        else
        {
            open("http://localhost:1985/");
        }
    });

    WatchTexFile();
}

Main();
