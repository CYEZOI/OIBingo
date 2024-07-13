const AllData = {};

const BingosElement = $0;
for (let x = 0; x < BingosElement.children.length; x++) {
    const BingoCardBody = BingosElement.children[x].children[0];
    const BingoName = BingoCardBody.children[0].childNodes[0].data;
    const BingoData = [];
    const BingoCardData = BingoCardBody.children[1].children[0].children[0];
    for (let i = 0; i < BingoCardData.children.length; i++) {
        for (let j = 0; j < BingoCardData.children[i].children.length; j++) {
            const ProblemElement = BingoCardData.children[i].children[j];
            const PID = String(ProblemElement.children[0].children[0].innerText);
            BingoData.push(PID);
            // const SubmitRecordsElement = ProblemElement.children[1].children[1];
            // const SubmitRecords = [];
            // for (let k = 0; k < SubmitRecordsElement.children.length; k++) {
            //     const Username = String(SubmitRecordsElement.children[k].innerText);
            //     const Match = /Time: ([0-9]*)ms Memory: ([0-9]*)B Source code: ([0-9]*)B/.exec(SubmitRecordsElement.children[k].getAttribute("data-bs-title"));
            //     const Time = Number(Match[1]);
            //     const Memory = Number(Match[2]);
            //     const SourceCodeLength = Number(Match[3]);
            //     const SID = Number(SubmitRecordsElement.children[0].href.substring(32));
            //     SubmitRecords.push({ Username, Time, Memory, SourceCodeLength, SID });
            // }
            // BingoData.push({
            //     Problem: {
            //         PID
            //     },
            //     SubmitRecords
            // });
        }
    }
    AllData[BingoName] = BingoData;
}

// {"提高+/省选-":["P1858","P3362","P4796","P2673","P10119","P4870","P6104","P6374","P9191","P2841","P2894","P1053","P6855","P3492","P6513","P2950","P1127","P2747","P10036","P6028","P7959","P4665","P3868","P2636","P2674"],"普及+/提高":["P2359","P6538","P4047","P1363","P1310","P1052","P3063","P1668","P4401","P2476","P6464","P8858","P1191","P10118","P3956","P5560","P6601","P3205","P1982","B3734","P1655","P6732","P2363","P4816","P8509"],"大杂烩":["P4406","P2330","P8187","B3721","P4933","P6493","P6920","P1417","P2194","P9396","P2905","P9010","P7619","P8634","P7559","P8595","P1091","B2024","P8846","P9634","P1197","P7355","P4654","P6108","P9972"],"大杂烩2":["P3935","P1966","P4175","P9056","P10398","P1424","P2673","P4086","P1577","P2558","P2023","P8936","P2981","P3443","P4053","P9881","P6560","P9023","B3834","P9100","P10299","P9269","P2518","P7763","P8247"],"NOI/NOI+/CTSC":["P8570","P7719","P5525","P9070","P1756","P9419","P1737","P5111","P6792","P9312","P1721","P10065","P7348","P9442","P5423","P9353","P4143","P5225","P3642","P4250","P10545","P8337","P9082","P10028","P4693"],"省选/NOI-":["P9001","P7336","P5175","P6302","P3305","P4745","P3471","P4750","P1667","P1393","P9970","P6915","P10212","P2252","P6860","P3953","P7597","P2045","P7931","P5977","P4858","P3350","P3967","P4245","P5350"],"篮子黑":["P4820","P5851","P3112","P6644","P1813","P9792","P2860","P4321","P7118","P3219","P3400","P8351","P3881","P9432","P3489","P6622","P9212","P1108","P3683","P7396","P6563","P3161","P6232","P10563","P7944"]}