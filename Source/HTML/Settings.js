const SettingsLuoguUsername = document.getElementById("SettingsLuoguUsername");
const SettingsLuoguPassword = document.getElementById("SettingsLuoguPassword");
const SettingsSaveButton = document.getElementById("SettingsSaveButton");
const SettingsDiscardButton = document.getElementById("SettingsDiscardButton");
AddLoading(SettingsLuoguUsername);
AddLoading(SettingsLuoguPassword);
RequestAPI("GetSettings", {}, () => { }, (SettingsData) => {
    RemoveLoading(SettingsLuoguUsername);
    RemoveLoading(SettingsLuoguPassword);
    SettingsLuoguUsername.value = SettingsData["LuoguUsername"];
    SettingsLuoguPassword.value = SettingsData["LuoguPassword"];
}, () => { }, () => { });
SettingsSaveButton.addEventListener("click", () => {
    AddLoading(SettingsSaveButton);
    RequestAPI("SetSettings", {
        "LuoguUsername": SettingsLuoguUsername.value,
        "LuoguPassword": SettingsLuoguPassword.value,
    }, () => {
        RemoveLoading(SettingsSaveButton);
    }, () => {
        ShowSuccess("Settings saved");
    }, () => { }, () => { });
});
SettingsDiscardButton.addEventListener("click", () => {
    window.location.reload();
});