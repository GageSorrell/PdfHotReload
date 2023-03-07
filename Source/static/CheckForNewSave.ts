let Hash : string = "";

function CheckForNewSave() : void
{
    const OldHash : string = Hash;
    fetch("get-hash").then(Response => Response.text()).then(Response =>
    {
        Hash = Response;
        console.log(Hash);
        if(OldHash !== Hash)
        {
            console.log("Should reload...");
            location.reload();
        }
    });
}

fetch("get-hash")
.then(Response => Response.text())
.then(Response =>
{
    Hash = Response;
    console.log(Response);
    setInterval(CheckForNewSave, 2000);
});