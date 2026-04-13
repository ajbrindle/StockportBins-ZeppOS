import { createWidget, widget, align, text_style, prop } from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { BasePage } from '@zeppos/zml/base-page'
import TransferFile from '@zos/ble/TransferFile'
import { statSync, openSync, readSync, closeSync, readdirSync } from '@zos/fs'
import { setPageBrightTime } from '@zos/display'
import { set, cancel, getAllAlarms, REPEAT_ONCE } from '@zos/alarm'
import { showToast } from '@zos/interaction'
import { Vibrator, VIBRATOR_SCENE_LONG, VIBRATOR_SCENE_SHORT_LIGHT } from '@zos/sensor'
import { push } from '@zos/router'
import { onGesture, GESTURE_LEFT } from '@zos/interaction'
import { binColorMap, formatBinDate } from '../config'

const transferFile = new TransferFile()
const inbox = transferFile.getInbox()
let binImageWidget = null;

// This will hold the data so the page access via swipe can access it
let secondaryPageData = '[]';

Page(
  BasePage({
    validateFile(targetPath) {
      try {
        const stats = statSync({ path: targetPath });

        if (!stats) {
          console.log(`[STAGE 5 ERROR] File does not exist.`);

          // Debug code to list files on the device for troubleshooting
          try {
            const files = readdirSync({ path: 'download' });
            console.log(`Found ${files.length} files inside the 'download' folder:`);
            files.forEach(f => console.log(` -> ${f}`));
          } catch (scanErr) {
            console.log(`X-Ray failed: ${scanErr.message}`);
          }

          return false;
        }

        if (stats.size === 0) {
          console.log(`[STAGE 5 ERROR] File exists but is 0 bytes.`);
          return false;
        }

        const fd = openSync({ path: targetPath });
        const buf = new ArrayBuffer(4);
        readSync({ fd, buffer: buf });
        closeSync({ fd });

        const view = new Uint8Array(buf);

        // Detect that the file is actually a PNG (look for the standard PNG header bytes)
        if (view[0] === 137 && view[1] === 80 && view[2] === 78 && view[3] === 71) {
          console.log(`[STAGE 5 ERROR] FATAL: This is a raw PNG file! Phone failed to convert.`);
          return false;
        }

        return true;
      } catch (e) {
        console.log(`[STAGE 5 ERROR] Validation exception: ${e.message}`);
        return false;
      }
    },

    onInit() {
      // Grab the global app instance
      const app = getApp();

      // Default to the local parameter (in case of a warm boot)
      let launchParam = param;

      // Check if app.js caught an alarm parameter during a Cold Boot
      if (app._options.globalData && app._options.globalData.alarmParam) {
        launchParam = app._options.globalData.alarmParam;

        // Clear it out so it doesn't vibrate again if you navigate away and come back
        app._options.globalData.alarmParam = null;
      }

      // Trigger the haptics
      if (launchParam === 'trigger=alarm') {
        const vibrator = new Vibrator()
        vibrator.start({ scene: VIBRATOR_SCENE_LONG })
      }
      inbox.on('NEWFILE', () => {
        const fileObject = inbox.getNextFile();

        fileObject.on('change', (event) => {
          if (event.data.readyState === 'transferred') {

            // Strip out any weird paths and forcefully point to the download folder
            const baseName = fileObject.fileName.replace('data://', '').replace('download/', '');
            const safeWatchPath = `download/${baseName}`;

            if (this.validateFile(safeWatchPath)) {
              if (binImageWidget) {
                // UI paths require the data:// prefix in front of the folder!
                binImageWidget.setProperty(prop.SRC, `data://${safeWatchPath}`);
              }
            }
          }
        });
      });
    },

    build() {
      const { width } = getDeviceInfo()
      let areaId = "0"
      setPageBrightTime({ brightTime: 30000 })

      onGesture({
        callback: (event) => {
          // If the user swipes left, and we have future bin data calculated
          if (event === GESTURE_LEFT && secondaryPageData !== '[]') {
            push({ url: 'page/other', params: secondaryPageData })
            return true // Tell the OS we successfully handled this swipe
          }
          return false // Let the OS handle any other swipes normally
        }
      })

      const dateTextWidget = createWidget(widget.TEXT, {
        x: 20, y: 35, w: width - 40, h: 100,
        color: 0xffffff, text_size: 32, align_h: align.CENTER_H, align_v: align.CENTER_V,
        text_style: text_style.WRAP, text: 'Checking bins...'
      })

      const imageWidth = 450;

      binImageWidget = createWidget(widget.IMG, {
        // Centering math: (Screen Width - Image Width) divided by 2
        x: (width - imageWidth) / 2,
        y: 190,
        w: imageWidth,
        h: 200,
        src: ''
      })

      this.request({ method: 'GET_AREA_ID' })
        .then((settingsResponse) => {
          // If the setting is empty, tell the user to open their phone
          if (!settingsResponse || !settingsResponse.areaId) {
            dateTextWidget.setProperty(prop.TEXT, 'Please set Area ID\nin Zepp App')
            return
          }

          areaId = settingsResponse.areaId.trim();
          console.log(`Area ID set to: ${areaId}`);

          this.httpRequest({
            method: 'GET',
            url: `https://www.sk7software.co.uk/bins/index.php?id=${areaId}`
          })
            .then((result) => {
              const data = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
              if (!data || !data.bins || data.bins.length === 0) return;

              const today = new Date(); today.setHours(0, 0, 0, 0);
              const futureBins = data.bins.filter(b => new Date(b.date) >= today);
              if (futureBins.length === 0) return;

              futureBins.sort((a, b) => new Date(a.date) - new Date(b.date));
              const nextDate = futureBins[0].date;
              const colours = futureBins.filter(b => b.date === nextDate).map(b => b.colour);

              dateTextWidget.setProperty(prop.TEXT, `Next bin collection\n${formatBinDate(nextDate)}`);

              // Give each word a fixed width box to sit in
              const wordWidth = 110;

              // Calculate the starting X coordinate so the whole group sits dead centre
              const totalGroupWidth = colours.length * wordWidth;
              const startX = (width - totalGroupWidth) / 2;

              // Loop through the bins and spawn a widget for each one (assumption is that there won't be loads of them)
              colours.forEach((binName, index) => {
                const lowerName = binName.toLowerCase();

                createWidget(widget.TEXT, {
                  x: startX + (index * wordWidth),
                  y: 135,
                  w: wordWidth,
                  h: 45,
                  // Look up the color, default to grey if not found
                  color: binColorMap[lowerName] || 0xaaaaaa,
                  text_size: 32,
                  align_h: align.CENTER_H,
                  text: binName
                })
              })

              const urlColours = colours.map(c => c.toLowerCase()).join(',');

              // Get all bins that are NOT happening on the next immediate date
              const remainingBins = futureBins.filter(b => b.date !== nextDate)

              // Group the first occurrence of each remaining color by date
              const seenColours = new Set()
              const groupedOtherBins = {}

              for (const b of remainingBins) {
                if (!seenColours.has(b.colour)) {
                  seenColours.add(b.colour)
                  if (!groupedOtherBins[b.date]) groupedOtherBins[b.date] = []
                  groupedOtherBins[b.date].push(b.colour)
                }
              }

              // Format into a clean array and serialize it for the swipe router
              const futureDisplayList = Object.keys(groupedOtherBins).map(date => ({
                date: date,
                colours: groupedOtherBins[date].join(', ')
              }))

              secondaryPageData = JSON.stringify(futureDisplayList)

              // Remind me button - for 18:30 the day before the next collection
              createWidget(widget.BUTTON, {
                x: 20, y: 390, w: width - 40, h: 70,
                text: 'Remind me',
                text_size: 32,
                color: 0xffffff,
                normal_color: 0x333333,
                press_color: 0x555555,
                radius: 12,
                click_func: () => {
                  // Give immediate tactile feedback that the button was pressed
                  const vibrator = new Vibrator()
                  vibrator.start({ scene: VIBRATOR_SCENE_SHORT_LIGHT })

                  const alarmDate = new Date(nextDate)
                  alarmDate.setDate(alarmDate.getDate() - 1)
                  alarmDate.setHours(18, 30, 0, 0)

                  //const alarmTimeSeconds = Math.floor(Date.now() / 1000) + 15 // to test
                  const alarmTimeSeconds = Math.floor(alarmDate.getTime() / 1000)
                  const nowSeconds = Math.floor(Date.now() / 1000)

                  if (alarmTimeSeconds <= nowSeconds) {
                    showToast({ content: 'Reminder time has already passed!' })
                    return
                  }

                  const existingAlarms = getAllAlarms()
                  existingAlarms.forEach(id => cancel(id))

                  set({
                    url: 'page/index',
                    // Pass a trigger string to the app when it wakes up
                    param: 'trigger=alarm',
                    time: alarmTimeSeconds,
                    repeat_type: REPEAT_ONCE
                  })

                  showToast({ content: 'Reminder set for 18:30' })
                }
              })

              this.request({
                method: 'DOWNLOAD_IMAGE',
                bins: urlColours
              }, { timeout: 60000 })
                .then((response) => {
                  if (response && response.success) {
                    setTimeout(() => {
                      // If the new file is not detected, fall back to this
                      const baseName = response.fileName.replace('data://', '').replace('download/', '');
                      const safeWatchPath = `download/${baseName}`;

                      if (this.validateFile(safeWatchPath)) {
                        binImageWidget.setProperty(prop.SRC, `data://${safeWatchPath}`);
                      }
                    }, 3000);

                  } else {
                    console.log("Phone script failed early.");
                  }
                })
            })
        })
        .catch((err) => {
          console.log("Error requesting Area ID from phone:", err);
          dateTextWidget.setProperty(prop.TEXT, 'Failed to connect\nto phone.')
        })
    }
  })
)