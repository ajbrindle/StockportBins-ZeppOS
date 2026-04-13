import { BaseApp } from '@zeppos/zml/base-app'

App(
  BaseApp({
    globalData: {
      alarmParam: null
    },
    
    // onCreate is the very first thing to fire during a Cold Boot
    onCreate(param) {
      if (param) {
        console.log("APP CAUGHT THE BATON: ", param)
        this.globalData.alarmParam = param
      }
    },
    
    onDestroy() {}
  })
)