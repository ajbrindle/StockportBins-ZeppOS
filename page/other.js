import { createWidget, widget, align, text_style } from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { BasePage } from '@zeppos/zml/base-page'
import { binColorMap, formatBinDate } from '../config'

Page(
  BasePage({
    onInit(params) {
      // Catch the data passed from the main screen
      this.futureBinsList = params ? JSON.parse(params) : []
    },

    build() {
      const { width } = getDeviceInfo()
      
      // Page Title
      createWidget(widget.TEXT, {
        x: 0, y: 40, w: width, h: 60,
        color: 0xffffff, text_size: 32, 
        align_h: align.CENTER_H, 
        text: 'Other Dates'
      })

      // Draw a line under the title
      createWidget(widget.FILL_RECT, {
        x: 40, y: 100, w: width - 80, h: 5, color: 0x333333
      })

      if (this.futureBinsList.length === 0) {
        createWidget(widget.TEXT, {
          x: 20, y: 180, w: width - 40, h: 80,
          color: 0xaaaaaa, text_size: 32, align_h: align.CENTER_H, 
          text: 'No other bins found.'
        })
        return
      }

      // Loop through the data and draw a row for each date
      let currentY = 110

      this.futureBinsList.forEach((item) => {
        // Draw the Date
        createWidget(widget.TEXT, {
          x: 20, y: currentY, w: width - 40, h: 50,
          color: 0xaaaaaa, text_size: 32, align_h: align.CENTER_H, 
          text: formatBinDate(item.date, true)
        })
        
        // The main page passed the colors as a string ("Blue, Brown"). 
        // We split it back into an array here so we can loop over it.
        const binArray = item.colours.split(', ')
        const wordWidth = 110;
        const totalGroupWidth = binArray.length * wordWidth;
        const startX = (width - totalGroupWidth) / 2;

        binArray.forEach((binName, index) => {
          const lowerName = binName.toLowerCase();
          
          createWidget(widget.TEXT, {
            x: startX + (index * wordWidth), 
            y: currentY + 50, // Drop down slightly below the date
            w: wordWidth, 
            h: 50,
            color: binColorMap[lowerName] || 0xaaaaaa, 
            text_size: 32, 
            align_h: align.CENTER_H, 
            text: binName
          })
        })
        
        currentY += 100 
      })
    }
  })
)