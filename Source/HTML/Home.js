const Bingo = document.getElementById("Bingo");
for (let i = 0; i < 10; i++)
    Bingo.appendChild(CreatePlaceHolder());
CheckTokenAvailable();
RequestAPI("GetBingo", {}, () => { }, (Data) => {
    console.log(Data);
}, () => { }, () => { });