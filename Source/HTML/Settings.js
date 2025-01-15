const SettingsLuoguUsername = document.getElementById("SettingsLuoguUsername");
const SettingsLuoguPassword = document.getElementById("SettingsLuoguPassword");
const SettingsColor = document.getElementById("SettingsColor");
const SettingsAvatar = document.getElementById("SettingsAvatar");
const SettingsSaveButton = document.getElementById("SettingsSaveButton");
const SettingsDiscardButton = document.getElementById("SettingsDiscardButton");
AddLoading(SettingsLuoguUsername);
AddLoading(SettingsLuoguPassword);
AddLoading(SettingsColor);
AddLoading(SettingsAvatar);
RequestAPI("GetSettings", {}, () => { }, (SettingsData) => {
    RemoveLoading(SettingsLuoguUsername);
    RemoveLoading(SettingsLuoguPassword);
    RemoveLoading(SettingsColor);
    RemoveLoading(SettingsAvatar);
    SettingsLuoguUsername.value = SettingsData["LuoguUsername"];
    SettingsLuoguPassword.value = SettingsData["LuoguPassword"];
    SettingsColor.value = SettingsData["Color"];
    SettingsAvatar.value = SettingsData["Avatar"];
}, () => { }, () => { });
SettingsSaveButton.addEventListener("click", () => {
    AddLoading(SettingsSaveButton);
    RequestAPI("SetSettings", {
        "LuoguUsername": SettingsLuoguUsername.value,
        "LuoguPassword": SettingsLuoguPassword.value,
        "Color": SettingsColor.value,
        "Avatar": SettingsAvatar.value,
    }, () => {
        RemoveLoading(SettingsSaveButton);
    }, () => {
        ShowSuccess("Settings saved");
    }, () => { }, () => { });
});
SettingsDiscardButton.addEventListener("click", () => {
    SwitchPage("Settings");
});
