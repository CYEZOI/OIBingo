const SettingsLuoguUsername = document.getElementById("SettingsLuoguUsername");
const SettingsLuoguPassword = document.getElementById("SettingsLuoguPassword");
const SettingsAvatar = document.getElementById("SettingsAvatar");
const SettingsColor = document.getElementById("SettingsColor");
const SettingsSaveButton = document.getElementById("SettingsSaveButton");
AddLoading(SettingsLuoguUsername);
AddLoading(SettingsLuoguPassword);
RequestAPI("GetSettings", {}, () => { }, (SettingsData) => {
    RemoveLoading(SettingsLuoguUsername);
    RemoveLoading(SettingsLuoguPassword);
    SettingsLuoguUsername.value = SettingsData["LuoguUsername"];
    SettingsAvatar.src = SettingsData["Avatar"];
    SettingsColor.style.backgroundColor = SettingsData["Color"];
}, () => { }, () => { });
SettingsSaveButton.addEventListener("click", () => {
    AddLoading(SettingsSaveButton);
    RequestAPI("SetSettings", {
        "LuoguUsername": SettingsLuoguUsername.value,
        "LuoguPassword": SettingsLuoguPassword.value,
    }, () => {
        RemoveLoading(SettingsSaveButton);
    }, (SettingsData) => {
        ShowSuccess("Luogu settings saved");
        SettingsAvatar.src = SettingsData["Avatar"];
        SettingsColor.style.backgroundColor = SettingsData["Color"];
    }, () => { }, () => { });
});
