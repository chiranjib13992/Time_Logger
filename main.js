const { app, BrowserWindow, ipcMain, powerMonitor, desktopCapturer, Notification } = require('electron');
const fs = require('fs');
const path = require('path');
const { addAutoUserActivity } = require('./Service/authService');
const { setToken } = require('./Service/apiConfig');
const FormData = require('form-data');
const axios = require('axios');
const { api } = require('./Service/apiConfig');


let sessionToken = null;
let payloadObj


ipcMain.on('session-token', (event, token) => {
  sessionToken = token;
 // console.log('Received token in main process:', sessionToken);
  setToken(sessionToken);

  try {
    const base64Payload = sessionToken.split('.')[1];
    const decodedPayload = Buffer.from(base64Payload, 'base64').toString('utf8');
    payloadObj = JSON.parse(decodedPayload);
    //const decoded = jwtDecode(sessionToken);
   // console.log('Decoded Token:', payloadObj);
    event.sender.send('store-user-name', payloadObj.name);

  } catch (err) {
    console.error('Failed to decode token:', err);
  }
});


// function captureAndSaveScreenshot(width = 1280, height = 720) {
//   return desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width, height } })
//     .then(sources => {
//       const imgBuffer = sources[0].thumbnail.toPNG();
//       const dir = path.join(app.getAppPath(), 'assets', 'screenshots');
//       fs.mkdirSync(dir, { recursive: true });
//       const file = path.join(dir, `screen-${Date.now()}.png`);
//       fs.writeFileSync(file, imgBuffer);
//       new Notification({
//         title: 'Screenshot Captured',
//         body: 'Your Activity screen was saved.',
//         silent: true
//       }).show();

//       mainWindow.webContents.send('screenshot-taken', file);
//       console.log('Screenshot saved:', file);
//       return file;
//     });
// }

function captureAndSaveScreenshot(width = 1280, height = 720) {
  return desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width, height } })
    .then(async sources => {
      const imgBuffer = sources[0].thumbnail.toPNG();
      const fileName = `screenshot-${Date.now()}.png`;

      // Create a FormData object and append image buffer
      const form = new FormData();
      form.append('image', imgBuffer, {
        filename: fileName,
        contentType: 'image/png',
      });

      try {
        const response = await api.post('/api/uploadScreenshots', form, {
          headers: {
            ...form.getHeaders(),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        });
        new Notification({
          title: 'Screenshot Uploaded',
          body: 'Your screenshot was uploaded to the server successfully.',
          silent: true
        }).show();

        mainWindow.webContents.send('screenshot-taken', response.data.filePath || fileName);
        console.log('Screenshot uploaded successfully:', response.data);

        return response.data;
      } catch (error) {
        console.error('Failed to upload screenshot:', error.response?.data || error.message);

        new Notification({
          title: 'Upload Failed',
          body: 'Screenshot upload failed. Please try again.',
          silent: true
        }).show();
      }
    });
}

let totalIdleTime = 0;
let prevIdleTime = 0;
let mainWindow;
let activeTime = 0;
let isPaused = false;
let intervalId = null;

//let statsFile = path.join(__dirname, 'stats.json');
let dailyStats = [];
//let dailyIdleStats = [];

// if (fs.existsSync(statsFile)) {
//   dailyStats = JSON.parse(fs.readFileSync(statsFile));
// }

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

const today = getToday();
function saveStats() {

  dailyStats.push({
    date: today,
    activeTime,
    idleTime: totalIdleTime,
    id: payloadObj._id
  });
  addAutoUserActivity(dailyStats);
  //fs.writeFileSync(statsFile, JSON.stringify(dailyStats, null, 2));
}

function startTracking() {
  if (intervalId) clearInterval(intervalId);

  intervalId = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    if (isPaused) {
      mainWindow.webContents.send('update-status', {
        activeTime,
        isIdle: false,
        idleSeconds: totalIdleTime,
        paused: true,
        totalIdleTime
      });
      return;
    }

    const idleTime = powerMonitor.getSystemIdleTime();


    const isIdle = idleTime >= 30;
    if (!isIdle) {
      activeTime++;
      captureScreenshot(1280, 720)
        .then(() => console.log('Counting On from ', activeTime, 's'))
        .catch(console.error);

    }
    if (isIdle) {
      totalIdleTime++
    }

    mainWindow.webContents.send('update-status', {
      activeTime,
      isIdle,
      idleSeconds: idleTime,
      paused: false,
      totalIdleTime
    });
  }, 1000);
}

function throttle(func, intervalMs) {
  let lastTime = 0;
  return async (...args) => {
    const now = Date.now();
    if (now - lastTime >= intervalMs) {
      lastTime = now;
      return func(...args);
    }
  };
}

// function getRandomBetween10And15() {
//   return Math.floor(Math.random() * (15 - 10 + 1)) + 10;
// }

const captureScreenshot = throttle(captureAndSaveScreenshot, 13 * 47 * 1000);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 350,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('login.html');
 // mainWindow.webContents.openDevTools(); //For Opening the inspect console
}

ipcMain.handle('load-main-page', async () => {
  await mainWindow.loadFile('index.html');
  startTracking(); // Start the timer only after loading the tracker page
});

ipcMain.on('toggle-pause', () => {
  isPaused = !isPaused;
});

app.on('before-quit', () => {
  saveStats();
});

app.whenReady().then(createWindow);
