const LoginUsernameInput = document.getElementById("LoginUsernameInput");
const LoginPasswordInput = document.getElementById("LoginPasswordInput");
const LoginButton = document.getElementById("LoginButton");

LoginButton.onclick = () => {
    AddLoading(LoginButton);
    RequestAPI("Login", {
        "Username": String(LoginUsernameInput.value),
        "Password": String(LoginPasswordInput.value)
    }, () => {
        RemoveLoading(LoginButton);
    }, (Response) => {
        localStorage.setItem("Token", Response.Token);
        localStorage.setItem("IsAdmin", Response.IsAdmin);
        localStorage.setItem("Username", LoginUsernameInput.value);
        const AddonStyle = document.getElementById("AddonStyle");
        AddonStyle.innerHTML = ".NotLoginOnly { display: none; }";
        if (!Response.IsAdmin) {
            AddonStyle.innerHTML += ".AdminOnly { display: none; }";
        }
        ShowSuccess("Login success");
        setTimeout(() => {
            if (new URLSearchParams(window.location.search).get("Callback") !== null) {
                location.href = new URLSearchParams(window.location.search).get("Callback");
            }
            else {
                SwitchPage("Home");
            }
        }, 1000);
    }, () => {
        SetValid(LoginPasswordInput, false);
    }, () => { }, false);
};
if (localStorage.getItem("Token") != null) {
    RequestAPI("CheckTokenAvailable",
        {
            "Token": String(localStorage.getItem("Token"))
        }, () => { }, () => {
            SwitchPage("Home");
        }, () => {
            localStorage.removeItem("Token");
        }, () => { }, false);
}
