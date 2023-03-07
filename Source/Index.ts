import express from "express";
import * as Fs from "fs";
const App : any = express();
import { ChildProcess, spawn } from "child_process";
import * as Crypto from "crypto";
import * as Path from "path";

App.use(express.static(__dirname + "/static"));

// Set the path to your webpage file and PDF file
const webpagePath = './Index.html';
// const PdfPath = "static/Exam1.pdf";
const PdfFileName = "Exam1.pdf";
function GetPdfPath() : string { return __dirname + "/static/" + PdfFileName; }
const plaintextPath = './Exam1.tex';

console.log("Path was " + process.argv[2]);
const TexFilePath : string = Path.resolve(process.argv[2]);

/* @Todo Check to make sure that latexmk is installed. */

function CompileTexFile() : void
{
    const TexDirectory : string = Path.dirname(TexFilePath);
    const Process : ChildProcess = spawn("latexmk", [ "-pdf", TexFilePath ]);
    Process.addListener("close", (Code : number, Signal : NodeJS.Signals) : void =>
    {

        console.log("NodeJS Signal is " + Signal + ", Code is " + Code);
    });
    // process.chdir(TexFileDirectory);

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

// Initialize the last modified time of the plaintext file
// let lastPlaintextModified = fs.statSync(plaintextPath).mtimeMs;

function GetPdfHashString() : string
{
    const PdfHash : Crypto.Hash = Crypto.createHash("sha256");
    const PdfFile : any = Fs.readFileSync(GetPdfPath());
    PdfHash.update(PdfFile);
    const PdfHashString : string = PdfHash.digest("hex");

    return PdfHashString;
}

// Set up a route to serve the webpage
App.get('/', (req, res) => {
    // Read the contents of the PDF file into a buffer
    const pdfBuffer = Fs.readFileSync(GetPdfPath());
    // Get the modification time of the PDF file
    // const pdfMtime = fs.statSync(pdfPath).mtime;
    // Convert the buffer to a base64-encoded data URI
    const pdfDataUri = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    // console.log(pdfDataUri);
    // Read the contents of the webpage HTML file into a string
    let webpageHtml = Fs.readFileSync(webpagePath, 'utf8');
    // Insert the PDF data URI and modification time into the HTML content
    webpageHtml = webpageHtml.replace('[[PDF_DATA_URI]]', pdfDataUri);
    webpageHtml = webpageHtml.replace('[[PDF_HASH]]', GetPdfHashString());
    // Send the modified HTML content as the response
    res.send(webpageHtml);
});

// Check if the plaintext file has been modified, and if so, generate the PDF
// function checkPlaintextModified() : void
// {
//     fs.stat(plaintextPath, (err, stats) =>
//     {
//         if (err) {
//             console.error(err);
//         } else {
//             if (stats.mtimeMs > lastPlaintextModified) {
//                 lastPlaintextModified = stats.mtimeMs;
//                 console.log('Plaintext file has been modified, regenerating PDF...');
//                 exec(`latexmk -pdf Exam1.tex`, (err, stdout, stderr) => {
//                     if (err) {
//                         console.error(err);
//                     } else {
//                         console.log(stdout);
//                     }
//                 });
//             }
//         }
//     });
// }

// Set up a timer to check if the plaintext file has been modified every second
// setInterval(checkPlaintextModified, 1000);

// Set up a route to serve the PDF file
App.get('/pdf', (Request, Response) => {
    // Response.sendFile(__dirname + "/" + pdfPath);
    
    const PdfFile : any = Fs.readFileSync(GetPdfPath());
    Response.contentType("application/pdf");
    Response.send(PdfFile);
});

App.get
(
    "/get-hash",
    (Request, Response) =>
    {
        Response.send(GetPdfHashString());
    }
);

// Start the server and listen for incoming requests
App.listen(1985, () => {
    console.log('Server running on port 1985');
});

// Set up a route to serve the PDF file
App.get('/pdf', (Request, Response) => {
    // Response.sendFile(__dirname + "/" + pdfPath);
    
    const PdfFile : any = Fs.readFileSync(GetPdfPath());
    Response.contentType("application/pdf");
    Response.send(PdfFile);
});

// function CheckForTexChanges() : void
// {
//     const TexHash : Crypto.Hash = Crypto.createHash("sha256");
//     const TexFile : any = Fs.readFileSync();
//     PdfHash.update(PdfFile);
//     const PdfHashString : string = PdfHash.digest("hex");

//     return PdfHashString;
// }

// setInterval(CheckForTexChanges, 1000);