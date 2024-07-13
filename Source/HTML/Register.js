const RegisterUsernameInput = document.getElementById("RegisterUsernameInput");
const RegisterPasswordInput = document.getElementById("RegisterPasswordInput");
const RegisterButton = document.getElementById("RegisterButton");

RegisterButton.onclick = () => {
    AddLoading(RegisterButton);
    RequestAPI("Register", {
        "Username": String(RegisterUsernameInput.value),
        "Password": String(RegisterPasswordInput.value)
    }, () => {
        RemoveLoading(RegisterButton);
    }, () => {
        ShowSuccess("Register success");
        SwitchPage("Login");
    }, () => { }, () => { }, false);
};