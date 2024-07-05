const RefreshProblemList = document.getElementById("RefreshProblemList");
const CreateBingoName = document.getElementById("CreateBingoName");
const CreateBingoDifficulties = document.getElementById("CreateBingoDifficulties");
const CreateBingoButton = document.getElementById("CreateBingoButton");
const BingoArea = document.getElementById("BingoArea");
for (let i = 0; i < 10; i++)
    BingoArea.appendChild(CreatePlaceHolder());
CheckTokenAvailable();

RefreshProblemList.addEventListener("click", () => {
    ShowModal("Refresh problem list", "Are you sure you want to refresh problem list? This may take a while. ", () => {
        AddLoading(RefreshProblemList);
        RequestAPI("RefreshProblemList", {}, () => {
            RemoveLoading(RefreshProblemList);
        }, () => {
            ShowSuccess("Problem list refreshed");
        }, () => { }, () => { });
    }, () => { });
});
CreateBingoButton.addEventListener("click", () => {
    AddLoading(CreateBingoButton);
    const Difficulties = [];
    for (let i = 0; i < CreateBingoDifficulties.selectedOptions.length; i++) {
        Difficulties.push(CreateBingoDifficulties.selectedOptions[i].value);
    }
    RequestAPI("CreateBingo", {
        "Name": String(CreateBingoName.value),
        Difficulties,
    }, () => {
        RemoveLoading(CreateBingoButton);
    }, () => {
        ShowSuccess("Create bingo success");
        setTimeout(() => { window.location.reload(); }, 1000);
    }, () => { }, () => { });
});

const DifficultyName = [
    "暂无评定",
    "入门",
    "普及−",
    "普及/提高−",
    "普及+/提高",
    "提高+/省选−",
    "省选/NOI−",
    "NOI/NOI+/CTSC",
];
const DifficultyColor = [
    "#bfbfbf",
    "#fe4c61",
    "#f39c11",
    "#ffc116",
    "#52c41a",
    "#3498db",
    "#9d3dcf",
    "#0e1d69",
]

RequestAPI("GetBingos", {}, () => { }, (Data) => {
    BingoArea.innerHTML = "";
    for (let i = 0; i < Data["BingoList"].length; i++) {
        const Bingo = Data["BingoList"][i];

        let CardElement = document.createElement("div"); BingoArea.appendChild(CardElement);
        CardElement.className = "card mb-2";
        let CardBodyElement = document.createElement("div"); CardElement.appendChild(CardBodyElement);
        CardBodyElement.className = "card-body";
        let CardTitleElement = document.createElement("h5"); CardBodyElement.appendChild(CardTitleElement);
        CardTitleElement.className = "card-title";
        CardTitleElement.innerText = Bingo["BingoName"];
        let CardTextElement = document.createElement("p"); CardBodyElement.appendChild(CardTextElement);
        CardTextElement.classList = "card-text";
        let CardTableElement = document.createElement("table"); CardTextElement.appendChild(CardTableElement);
        CardTableElement.className = "table table-bordered";
        CardTableElement.style.width = "50rem";
        let CardTableBodyElement = document.createElement("tbody"); CardTableElement.appendChild(CardTableBodyElement);
        for (let jx = 0; jx < 5; jx++) {
            let CardTableRowElement = document.createElement("tr"); CardTableBodyElement.appendChild(CardTableRowElement);
            CardTableRowElement.style.height = "10rem";
            for (let jy = 0; jy < 5; jy++) {
                const Problem = Bingo["BingoData"][jx * 5 + jy];
                let CardTableColumnElement = document.createElement("td"); CardTableRowElement.appendChild(CardTableColumnElement);
                CardTableColumnElement.style.widows = "10rem";
                CardTableColumnElement.style.cursor = "pointer";
                CardTableColumnElement.setAttribute("data-bs-toggle", "tooltip");
                CardTableColumnElement.setAttribute("data-bs-placement", "bottom");
                CardTableColumnElement.setAttribute("data-bs-title", Problem["Title"]);
                CardTableColumnElement.addEventListener("click", () => {
                    window.open("https://www.luogu.com.cn/problem/" + Problem["PID"]);
                });
                CardTableColumnElement.innerHTML = `<div class="text-center"><div class="h4" style="color: ${DifficultyColor[Problem["Difficulty"]]}">${Problem["PID"]}</div><div>Pass rate: <br>${Number(Problem["PassRate"] * 100).toFixed(2)}%</div></div>`;
            }
        }
    }

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
}, () => { }, () => { });

(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
})();