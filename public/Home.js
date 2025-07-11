const RefreshProblemList = document.getElementById("RefreshProblemList");
const CreateBingoName = document.getElementById("CreateBingoName");
const CreateBingoDifficulties = document.getElementById("CreateBingoDifficulties");
const CreateBingoButton = document.getElementById("CreateBingoButton");
const ShowOnlyNotWinned = document.getElementById("ShowOnlyNotWinned");
const RefreshBingos = document.getElementById("RefreshBingos");
const BingoArea = document.getElementById("BingoArea");
for (let i = 0; i < 10; i++)
    BingoArea.appendChild(CreatePlaceHolder());
CheckTokenAvailable();

let OnlyNoWin = true;

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
        SwitchPage("Home");
    }, () => { }, () => { });
});
ShowOnlyNotWinned.addEventListener("change", () => {
    OnlyNoWin = ShowOnlyNotWinned.checked;
    UpdateBingo();
});
RefreshBingos.addEventListener("click", () => { UpdateBingo(); });

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

const UpdateBingo = () => {
    AddLoading(RefreshBingos);
    RequestAPI("GetBingos", {
        OnlyNoWin: OnlyNoWin,
    }, () => {
        RemoveLoading(RefreshBingos);
    }, (Data) => {
        BingoArea.innerHTML = "";
        if (Data["BingoList"].length == 0)
            BingoArea.innerHTML = "There are no Bingos yet.";
        for (let i = 0; i < Data["BingoList"].length; i++) {
            const Bingo = Data["BingoList"][i];

            let CardElement = document.createElement("div"); BingoArea.appendChild(CardElement);
            CardElement.className = "card mb-2";
            let CardBodyElement = document.createElement("div"); CardElement.appendChild(CardBodyElement);
            CardBodyElement.className = "card-body";
            let CardTitleElement = document.createElement("h5"); CardBodyElement.appendChild(CardTitleElement);
            CardTitleElement.className = "card-title";
            CardTitleElement.innerText = Bingo["BingoName"];
            if (Bingo["Winner"] != "") {
                CardTitleElement.innerText += " (Winner: " + Bingo["Winner"] + ")";
            }
            let CardTitleDoneAllElement = document.createElement("button"); CardTitleElement.appendChild(CardTitleDoneAllElement);
            CardTitleDoneAllElement.className = "ms-2 btn btn-sm btn-outline-success";
            CardTitleDoneAllElement.innerText = "Done all";
            CardTitleDoneAllElement.disabled = Bingo["Winner"] != "";
            CardTitleDoneAllElement.addEventListener("click", () => {
                AddLoading(CardTitleDoneAllElement);
                RequestAPI("BingoSubmitAll", {
                    BingoName: String(Bingo["BingoName"]),
                }, () => {
                    RemoveLoading(CardTitleDoneAllElement);
                }, () => {
                    ShowSuccess("Bingo submitted");
                    SwitchPage("Home");
                }, () => { }, () => { });
            });
            let CardTitleDeleteElement = document.createElement("button"); CardTitleElement.appendChild(CardTitleDeleteElement);
            CardTitleDeleteElement.className = "ms-2 btn btn-sm btn-outline-danger AdminOnly";
            CardTitleDeleteElement.innerText = "Delete";
            CardTitleDeleteElement.addEventListener("click", () => {
                AddLoading(CardTitleDeleteElement);
                RequestAPI("DeleteBingo", {
                    BingoName: Bingo["BingoName"],
                }, () => {
                    RemoveLoading(CardTitleDeleteElement);
                }, () => {
                    ShowSuccess("Bingo deleted");
                    SwitchPage("Home");
                }, () => { }, () => { });
            });
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
                    const Problem = Bingo["BingoData"][jx * 5 + jy]["Problem"];
                    const SubmitRecords = Bingo["BingoData"][jx * 5 + jy]["SubmitRecords"];
                    SubmitRecords.sort((a, b) => { return a["Time"] - b["Time"]; });
                    let CardTableColumnElement = document.createElement("td"); CardTableRowElement.appendChild(CardTableColumnElement);
                    CardTableColumnElement.classList = "BingoItem text-center";
                    CardTableColumnElement.style.widows = "10rem";
                    if (SubmitRecords.length > 0) {
                        CardTableColumnElement.style.backgroundColor = SubmitRecords[0]["Color"] + "AA";
                    }
                    CardTableColumnElement.setAttribute("data-bs-toggle", "tooltip");
                    CardTableColumnElement.setAttribute("data-bs-placement", "bottom");
                    CardTableColumnElement.setAttribute("data-bs-title", Problem["Title"]);
                    {
                        let MouseLeaveElement = document.createElement("div"); CardTableColumnElement.appendChild(MouseLeaveElement);
                        MouseLeaveElement.classList = "BingoItemInnerBox";
                        {
                            let Title = document.createElement("span"); MouseLeaveElement.appendChild(Title);
                            Title.classList = "h4";
                            Title.style.color = DifficultyColor[Problem["Difficulty"]];
                            Title.innerText = Problem["PID"];
                            let PassRate = document.createElement("div"); MouseLeaveElement.appendChild(PassRate);
                            PassRate.classList = "mt-2";
                            PassRate.innerText = "Pass rate: " + Number(Problem["PassRate"] * 100).toFixed(2) + "%";
                            if (SubmitRecords.length > 0) {
                                let WinnerAvatar = document.createElement("img"); MouseLeaveElement.appendChild(WinnerAvatar);
                                WinnerAvatar.classList = "rounded me-1";
                                WinnerAvatar.style.height = "1rem";
                                WinnerAvatar.style.width = "1rem";
                                WinnerAvatar.src = SubmitRecords[0]["Avatar"];
                                let Winner = document.createElement("span"); MouseLeaveElement.appendChild(Winner);
                                Winner.classList = "mt-2";
                                Winner.innerText = SubmitRecords[0]["Username"];
                            }
                        }
                        let MouseOverElement = document.createElement("div"); CardTableColumnElement.appendChild(MouseOverElement);
                        MouseOverElement.classList = "BingoItemInnerBox";
                        MouseOverElement.style.backgroundColor = (SubmitRecords.length > 0 ? SubmitRecords[0]["Color"] : "#ffffff")
                        {
                            let Title = document.createElement("a"); MouseOverElement.appendChild(Title);
                            Title.role = "link";
                            Title.target = "_blank";
                            Title.href = "https://www.luogu.com.cn/problem/" + Problem["PID"];
                            Title.classList = "h4 px-2 rounded";
                            Title.style.color = "white";
                            Title.style.backgroundColor = DifficultyColor[Problem["Difficulty"]];
                            Title.innerText = Problem["PID"];
                            let SubmitList = document.createElement("div"); MouseOverElement.appendChild(SubmitList);
                            SubmitList.classList = "mt-2";
                            for (let k = 0; k < Math.min(SubmitRecords.length, 3); k++) {
                                let Submission = document.createElement("div"); SubmitList.appendChild(Submission);
                                {
                                    let SubmissionAvatar = document.createElement("img"); Submission.appendChild(SubmissionAvatar);
                                    SubmissionAvatar.classList = "rounded me-1";
                                    SubmissionAvatar.style.height = "1rem";
                                    SubmissionAvatar.style.width = "1rem";
                                    SubmissionAvatar.src = SubmitRecords[k]["Avatar"];
                                    let SubmissionLink = document.createElement("a"); Submission.appendChild(SubmissionLink);
                                    SubmissionLink.role = "link";
                                    SubmissionLink.target = "_blank";
                                    SubmissionLink.href = "https://www.luogu.com.cn/record/" + SubmitRecords[k]["SID"];
                                    SubmissionLink.classList = "mb-0";
                                    SubmissionLink.innerText = SubmitRecords[k]["Username"];
                                    SubmissionLink.setAttribute("data-bs-toggle", "tooltip");
                                    SubmissionLink.setAttribute("data-bs-placement", "right");
                                    SubmissionLink.setAttribute("data-bs-title",
                                        "Time: " + SubmitRecords[k]["Time"] + "ms " +
                                        "Memory: " + SubmitRecords[k]["Memory"] + "KB " +
                                        "Source code: " + SubmitRecords[k]["SourceCodeLength"] + "B"
                                    );
                                }
                            }
                            let Submit = document.createElement("button"); MouseOverElement.appendChild(Submit);
                            Submit.classList = "mt-2 btn btn-sm btn-outline-success";
                            Submit.innerText = "Done!";
                            Submit.disabled = Bingo["Winner"] != "";
                            Submit.addEventListener("click", () => {
                                AddLoading(Submit);
                                RequestAPI("BingoSubmit", {
                                    BingoName: String(Bingo["BingoName"]),
                                    PID: String(Problem["PID"]),
                                }, () => {
                                    RemoveLoading(Submit);
                                }, () => {
                                    ShowSuccess("Bingo submitted");
                                    SwitchPage("Home");
                                }, () => { }, () => { });
                            });
                        }
                    }
                }
            }
        }

        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    }, () => { }, () => { });
};

UpdateBingo();
window.addEventListener("focus", () => { UpdateBingo(); });

(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
})();
