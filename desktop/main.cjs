const { app, BrowserWindow, shell } = require("electron");
function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 850, minWidth: 360, minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadURL("https://siakakebe22-blip.github.io/KS-INFORMATIQUE-/");
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) shell.openExternal(url);
    return { action: "deny" };
  });
}
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
