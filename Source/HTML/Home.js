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
        SwitchPage("Home");
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
        let CardTitleDeleteElement = document.createElement("button"); CardTitleElement.appendChild(CardTitleDeleteElement);
        CardTitleDeleteElement.className = "ms-2 btn btn-sm btn-outline-danger AdminOnly";
        CardTitleDeleteElement.innerText = "Delete"
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
                let CardTableColumnElement = document.createElement("td"); CardTableRowElement.appendChild(CardTableColumnElement);
                CardTableColumnElement.classList = "BingoItem text-center";
                CardTableColumnElement.style.widows = "10rem";
                if (SubmitRecords.length > 0) {
                    CardTableColumnElement.style.backgroundColor = GenerateColor(SubmitRecords[0]["Username"]);
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
                            let Winner = document.createElement("div"); MouseLeaveElement.appendChild(Winner);
                            Winner.classList = "mt-2";
                            Winner.innerText = SubmitRecords[0]["Username"];
                        }
                    }
                    let MouseOverElement = document.createElement("div"); CardTableColumnElement.appendChild(MouseOverElement);
                    MouseOverElement.classList = "BingoItemInnerBox";
                    {
                        let Title = document.createElement("a"); MouseOverElement.appendChild(Title);
                        Title.role = "link";
                        Title.target = "_blank";
                        Title.href = "https://www.luogu.com.cn/problem/" + Problem["PID"];
                        Title.classList = "h4";
                        Title.style.color = DifficultyColor[Problem["Difficulty"]];
                        Title.innerText = Problem["PID"];
                        let SubmitList = document.createElement("div"); MouseOverElement.appendChild(SubmitList);
                        SubmitList.classList = "mt-2";
                        for (let k = 0; k < Math.min(SubmitRecords.length, 3); k++) {
                            let Submission = document.createElement("a"); SubmitList.appendChild(Submission);
                            Submission.style.display = "block";
                            Submission.role = "link";
                            Submission.target = "_blank";
                            Submission.href = "https://www.luogu.com.cn/record/" + SubmitRecords[k]["SID"];
                            Submission.classList = "mb-0";
                            Submission.innerText = SubmitRecords[k]["Username"];
                            Submission.setAttribute("data-bs-toggle", "tooltip");
                            Submission.setAttribute("data-bs-placement", "right");
                            Submission.setAttribute("data-bs-title",
                                "Time: " + SubmitRecords[k]["Time"] + "ms " +
                                "Memory: " + SubmitRecords[k]["Memory"] + "B " +
                                "Source code: " + SubmitRecords[k]["SourceCodeLength"] + "B"
                            );
                        }
                        let Submit = document.createElement("button"); MouseOverElement.appendChild(Submit);
                        Submit.classList = "mt-2 btn btn-sm btn-outline-success";
                        Submit.innerText = "Done!";
                        Submit.addEventListener("click", () => {
                            AddLoading(Submit);
                            RequestAPI("CheckLuoguLogin", {}, () => {
                            }, () => {
                                RequestAPI("BingoSubmit", {
                                    BingoName: String(Bingo["BingoName"]),
                                    PID: String(Problem["PID"]),
                                }, () => {
                                    RemoveLoading(Submit);
                                }, () => {
                                    ShowSuccess("Bingo submitted");
                                    SwitchPage("Home");
                                }, () => { }, () => { });
                            }, () => {
                                RemoveLoading(Submit);
                                RequestAPI("GetLuoguCaptcha", {}, () => { }, (ResponseData) => {
                                    MouseOverElement.innerHTML = "";
                                    let CaptchaImage = document.createElement("img"); MouseOverElement.appendChild(CaptchaImage);
                                    CaptchaImage.classList = "mb-2";
                                    CaptchaImage.src = ResponseData["CaptchaBase64"];
                                    CaptchaImage.addEventListener("click", () => {
                                        RequestAPI("GetLuoguCaptcha", {}, () => { }, (ResponseData) => {
                                            CaptchaImage.src = ResponseData["CaptchaBase64"];
                                        }, () => { }, () => { });
                                    });
                                    let CaptchaInput = document.createElement("input"); MouseOverElement.appendChild(CaptchaInput);
                                    CaptchaInput.classList = "form-control mb-2";
                                    let CaptchaSubmit = document.createElement("button"); MouseOverElement.appendChild(CaptchaSubmit);
                                    CaptchaSubmit.classList = "btn btn-sm btn-outline-success";
                                    CaptchaSubmit.innerText = "Submit";
                                    CaptchaSubmit.addEventListener("click", () => {
                                        AddLoading(CaptchaSubmit);
                                        RequestAPI("LuoguLogin", {
                                            Captcha: String(CaptchaInput.value),
                                        }, () => {
                                            RemoveLoading(CaptchaSubmit);
                                        }, () => {
                                            ShowSuccess("Luogu login success, please resubmit");
                                            SwitchPage("Home");
                                        }, () => {
                                            CaptchaImage.click();
                                        }, () => { });
                                    });
                                }, () => { }, () => { });
                            }, () => { });
                        });
                    }
                }
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