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
        {
            let DataRowPasswordInput, DataRowLuoguUsernameInput, DataRowLuoguPasswordInput, DataRowPermissionCheck;
            let DataRowUsername = document.createElement("td"); DataRow.appendChild(DataRowUsername);
            {
                DataRowUsername.innerText = Response.UserInfo[i].Username;
            }
            let DataRowPassword = document.createElement("td"); DataRow.appendChild(DataRowPassword);
            {
                DataRowPasswordInput = document.createElement("input"); DataRowPassword.appendChild(DataRowPasswordInput);
                DataRowPasswordInput.type = "text";
                DataRowPasswordInput.classList.add("form-control", "BlurDefault");
                DataRowPasswordInput.value = Response.UserInfo[i].Password;
            }
            let DataRowLuoguUsername = document.createElement("td"); DataRow.appendChild(DataRowLuoguUsername);
            {
                DataRowLuoguUsernameInput = document.createElement("input"); DataRowLuoguUsername.appendChild(DataRowLuoguUsernameInput);
                DataRowLuoguUsernameInput.type = "text";
                DataRowLuoguUsernameInput.classList.add("form-control");
                DataRowLuoguUsernameInput.value = Response.UserInfo[i].LuoguUsername;
            }
            let DataRowLuoguPassword = document.createElement("td"); DataRow.appendChild(DataRowLuoguPassword);
            {
                DataRowLuoguPasswordInput = document.createElement("input"); DataRowLuoguPassword.appendChild(DataRowLuoguPasswordInput);
                DataRowLuoguPasswordInput.type = "text";
                DataRowLuoguPasswordInput.classList.add("form-control", "BlurDefault");
                DataRowLuoguPasswordInput.value = Response.UserInfo[i].LuoguPassword;
            }
            let DataRowLastOnlineTime = document.createElement("td"); DataRow.appendChild(DataRowLastOnlineTime);
            {
                DataRowLastOnlineTime.innerText = new Date(Response.UserInfo[i].LastOnlineTime).toJSON();
            }
            let DataRowPermission = document.createElement("td"); DataRow.appendChild(DataRowPermission);
            let DataRowPermissionDiv = document.createElement("div"); DataRowPermission.appendChild(DataRowPermissionDiv);
            DataRowPermissionDiv.className = "form-check form-switch";
            {
                DataRowPermissionCheck = document.createElement("input"); DataRowPermissionDiv.appendChild(DataRowPermissionCheck);
                DataRowPermissionCheck.type = "checkbox";
                DataRowPermissionCheck.className = "form-check-input";
                DataRowPermissionCheck.checked = Response.UserInfo[i].Permission;
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
                    RequestAPI("UpdateUser", {
                        "Username": String(DataRowUsername.innerText),
                        "Password": String(DataRowPasswordInput.value),
                        "LuoguUsername": String(DataRowLuoguUsernameInput.value),
                        "LuoguPassword": String(DataRowLuoguPasswordInput.value),
                        "Permission": Number(DataRowPermissionCheck.checked),
                    }, () => {
                        RemoveLoading(DataRowActionSaveButton);
                    }, () => {
                        ShowSuccess("Update User Success");
                    }, () => { }, () => { });
                }
            }
        }
    }
}, () => { }, () => { });
