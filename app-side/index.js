import { BaseSideService } from '@zeppos/zml/base-side'

AppSideService(BaseSideService({
  onRequest(req, res) {
    if (req.method === 'GET_AREA_ID') {
      console.log("Received request for Area ID from the watch")
      // Grab the ID typed into the phone
      const savedAreaId = settings.settingsStorage.getItem('areaId')
      console.log("Fetched Area ID from storage:", savedAreaId)
      return res(null, { areaId: savedAreaId })
    }

    if (req.method === 'DOWNLOAD_IMAGE') {
      const { bins } = req
      
      const imgProxyUrl = `https://www.sk7software.co.uk/bins/makeImage.php?bins=${bins}`
      
      const rawName = 'raw_image.png'
      const convertedName = 'converted_image.png'

      const task = network.downloader.downloadFile({
        url: imgProxyUrl,
        filePath: rawName 
      })

      task.onSuccess = (downloadRes) => {
        image.convert({
          filePath: downloadRes.filePath,          
          targetFilePath: `data://${convertedName}`
        }).then(() => {
          const outbox = transferFile.getOutbox()
          
          // Pick up the file using the exact same path we just saved it to
          const fileTask = outbox.enqueueFile(`data://${convertedName}`)
          
          fileTask.on('change', (event) => {
            if (event.data.readyState === 'transferred') {
              // Send ONLY the clean name to the watch
              res(null, { success: true, fileName: convertedName })
            }
          })
        }).catch(err => {
          console.log(`--- STAGE 2 ERROR ---`, err)
          res(null, { success: false, error: 'Conv Failed: ' + JSON.stringify(err) })
        })
      }
      
      task.onFail = (err) => {
        console.log(`--- STAGE 1 ERROR ---`, err)
        res(null, { success: false, error: 'DL Failed: ' + JSON.stringify(err) })
      }
    }
  }
})
)