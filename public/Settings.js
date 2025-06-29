const SettingsLuoguUsername = document.getElementById("SettingsLuoguUsername");
const SettingsLuoguPassword = document.getElementById("SettingsLuoguPassword");
const SettingsColor = document.getElementById("SettingsColor");
const SettingsLuoguSaveButton = document.getElementById("SettingsLuoguSaveButton");
const SettingsSaveButton = document.getElementById("SettingsSaveButton");
AddLoading(SettingsLuoguUsername);
AddLoading(SettingsLuoguPassword);
AddLoading(SettingsColor);
RequestAPI("GetSettings", {}, () => { }, (SettingsData) => {
    RemoveLoading(SettingsLuoguUsername);
    RemoveLoading(SettingsLuoguPassword);
    RemoveLoading(SettingsColor);
    SettingsLuoguUsername.value = SettingsData["LuoguUsername"];
    SettingsLuoguPassword.value = SettingsData["LuoguPassword"];
    SettingsColor.value = SettingsData["Color"];
}, () => { }, () => { });
SettingsLuoguSaveButton.addEventListener("click", () => {
    AddLoading(SettingsLuoguSaveButton);
    RequestAPI("SetLuoguSettings", {
        "LuoguUsername": SettingsLuoguUsername.value,
        "LuoguPassword": SettingsLuoguPassword.value,
    }, () => {
        RemoveLoading(SettingsLuoguSaveButton);
    }, () => {
        ShowSuccess("Luogu settings saved");
    }, () => { }, () => { });
});
SettingsSaveButton.addEventListener("click", () => {
    AddLoading(SettingsSaveButton);
    RequestAPI("SetSettings", {
        "Color": SettingsColor.value,
    }, () => {
        RemoveLoading(SettingsSaveButton);
    }, () => {
        ShowSuccess("Settings saved");
    }, () => { }, () => { });
});
