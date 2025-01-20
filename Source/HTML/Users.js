const AddUserUsername = document.getElementById("AddUserUsername");
const AddUserPassword = document.getElementById("AddUserPassword");
const AddUserButton = document.getElementById("AddUserButton");
const UsersData = document.getElementById("UsersData");
CheckTokenAvailable();
for (let i = 0; i < 10; i++) {
    let Row = document.createElement("tr"); UsersData.children[1].appendChild(Row);
    {
        for (let j = 0; j < 7; j++) {
            let Column = document.createElement("td"); Row.appendChild(Column);
            Column.appendChild(CreatePlaceHolder());
        }
    }
}
AddUserButton.addEventListener("click", () => {
    AddLoading(AddUserButton);
    RequestAPI("AddUser", { Username: String(AddUserUsername.value), Password: String(AddUserPassword.value), }, () => {
        RemoveLoading(AddUserButton);
    }, () => {
        ShowSuccess("Add user success");
        setTimeout(() => { window.location.reload(); }, 1000);
    }, () => { }, () => { });
});
RequestAPI("GetUsers", {}, () => { }, (Response) => {
    UsersData.children[1].innerHTML = "";
    for (let i = 0; i < Response.UserInfo.length; i++) {
        let DataRow = document.createElement("tr"); UsersData.children[1].appendChild(DataRow);
        if (Response.UserInfo[i].Permission === 2) { DataRow.classList.add("table-danger"); }
        {
            let DataRowPermissionCheck;
            let DataRowUsername = document.createElement("td"); DataRow.appendChild(DataRowUsername);
            DataRowUsername.innerText = Response.UserInfo[i].Username;
            let DataRowLuoguUsername = document.createElement("td"); DataRow.appendChild(DataRowLuoguUsername);
            DataRowLuoguUsername.innerText = Response.UserInfo[i].LuoguUsername;
            let DataRowLastOnlineTime = document.createElement("td"); DataRow.appendChild(DataRowLastOnlineTime);
            DataRowLastOnlineTime.innerText = new Date(Response.UserInfo[i].LastOnlineTime).toJSON();
            let DataRowPermission = document.createElement("td"); DataRow.appendChild(DataRowPermission);
            let DataRowPermissionDiv = document.createElement("div"); DataRowPermission.appendChild(DataRowPermissionDiv);
            DataRowPermissionDiv.className = "form-check form-switch";
            {
                DataRowPermissionCheck = document.createElement("input"); DataRowPermissionDiv.appendChild(DataRowPermissionCheck);
                DataRowPermissionCheck.type = "checkbox";
                DataRowPermissionCheck.className = "form-check-input";
                DataRowPermissionCheck.checked = Response.UserInfo[i].Permission === 1;
                DataRowPermissionCheck.id = "User" + i + "PermissionCheck";
                let DataRowPermissionLabel = document.createElement("label"); DataRowPermissionDiv.append(DataRowPermissionLabel);
                DataRowPermissionLabel.className = "form-check-label";
                DataRowPermissionLabel.htmlFor = "User" + i + "PermissionCheck";
                DataRowPermissionLabel.innerText = "Admin";
            }
            let DataRowAction = document.createElement("td"); DataRow.appendChild(DataRowAction);
            {
                let DataRowActionSaveButton = document.createElement("button"); DataRowAction.appendChild(DataRowActionSaveButton);
                DataRowActionSaveButton.innerText = "Save";
                DataRowActionSaveButton.classList.add("btn");
                DataRowActionSaveButton.classList.add("btn-warning");
                DataRowActionSaveButton.classList.add("me-1");
                DataRowActionSaveButton.onclick = () => {
                    AddLoading(DataRowActionSaveButton);
                    RequestAPI("UpdatePermission", {
                        "Username": String(DataRowUsername.innerText),
                        "Permission": Number(DataRowPermissionCheck.checked),
                    }, () => {
                        RemoveLoading(DataRowActionSaveButton);
                    }, () => {
                        ShowSuccess("Update user permission success");
                    }, () => { }, () => { });
                }
                let DataRowActionResetLuoguTokenButton = document.createElement("button"); DataRowAction.appendChild(DataRowActionResetLuoguTokenButton);
                DataRowActionResetLuoguTokenButton.innerText = "Reset luogu token";
                DataRowActionResetLuoguTokenButton.classList.add("btn");
                DataRowActionResetLuoguTokenButton.classList.add("btn-outline-warning");
                DataRowActionResetLuoguTokenButton.classList.add("me-1");
                DataRowActionResetLuoguTokenButton.onclick = () => {
                    AddLoading(DataRowActionResetLuoguTokenButton);
                    RequestAPI("ResetLuoguToken", {
                        "Username": String(DataRowUsername.innerText),
                    }, () => {
                        RemoveLoading(DataRowActionResetLuoguTokenButton);
                    }, () => {
                        ShowSuccess("Reset user token success");
                    }, () => { }, () => { });
                }
            }
        }
    }
}, () => { }, () => { });
