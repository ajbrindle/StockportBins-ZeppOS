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
      // --- RESPONSIVE MATH ENGINE ---
      const { width, height, screenShape } = getDeviceInfo()
      const isRound = screenShape === 1
      
      // 1. Text Sizing 
      const titleTextSize = Math.floor(width * 0.070) // ~33px on Balance
      const primaryTextSize = Math.floor(width * 0.065) // ~31px on Balance
      
      // 2. Title Area
      // Push down if the screen is round so the curve doesn't clip the title
      const titleY = isRound ? height * 0.12 : height * 0.05
      const titleH = height * 0.12
      
      // 3. Separator Line
      const lineY = titleY + titleH
      const lineW = width * 0.75 // 75% of screen width
      const lineX = (width - lineW) / 2
      
      // 4. List Row Metrics
      const listStartY = lineY + (height * 0.04) // Small gap below the line
      const dateH = height * 0.10
      const binH = height * 0.08
      const rowGap = height * 0.05 // Spacing between different weeks
      const colorsWordWidth = width * 0.28 // 28% of screen width per color
      // ------------------------------
      
      // Page Title
      createWidget(widget.TEXT, {
        x: 0, y: titleY, w: width, h: titleH,
        color: 0xffffff, text_size: titleTextSize, 
        align_h: align.CENTER_H, align_v: align.CENTER_V,
        text: 'Other Dates'
      })

      // Draw a line under the title
      createWidget(widget.FILL_RECT, {
        x: lineX, y: lineY, w: lineW, h: Math.max(2, Math.floor(height * 0.005)), color: 0x333333
      })

      if (this.futureBinsList.length === 0) {
        createWidget(widget.TEXT, {
          x: 0, y: listStartY + (height * 0.05), w: width, h: height * 0.20,
          color: 0xaaaaaa, text_size: primaryTextSize, align_h: align.CENTER_H, align_v: align.CENTER_V,
          text: 'No other bins found.'
        })
        return
      }

      // Loop through the data and draw a row for each date
      let currentY = listStartY

      this.futureBinsList.forEach((item) => {
        // Draw the Date
        createWidget(widget.TEXT, {
          x: 0, y: currentY, w: width, h: dateH,
          color: 0xaaaaaa, text_size: primaryTextSize, align_h: align.CENTER_H, align_v: align.CENTER_V,
          text: formatBinDate(item.date, true)
        })
        
        const binArray = item.colours.split(', ')
        const totalGroupWidth = binArray.length * colorsWordWidth;
        const startX = (width - totalGroupWidth) / 2;

        binArray.forEach((binName, index) => {
          const lowerName = binName.toLowerCase();
          
          createWidget(widget.TEXT, {
            x: startX + (index * colorsWordWidth), 
            y: currentY + dateH, 
            w: colorsWordWidth, 
            h: binH,
            color: binColorMap[lowerName] || 0xaaaaaa, 
            text_size: primaryTextSize, 
            align_h: align.CENTER_H, align_v: align.CENTER_V, 
            text: binName
          })
        })
        
        // Push the Y coordinate down for the next loop iteration
        currentY += (dateH + binH + rowGap) 
      })

      // --- CRITICAL BEZEL FIX ---
      // We draw an invisible black box at the very end of the list. 
      // This forces the OS scroll engine to let the user scroll the last text item 
      // up into the flat middle of the screen, instead of leaving it trapped in the curved bottom!
      if (isRound) {
        createWidget(widget.FILL_RECT, {
          x: 0, y: currentY, w: width, h: height * 0.15, color: 0x000000 
        })
      }
    }
  })
)