Component({
  properties: {
    current: { type: String, value: 'home' }
  },
  data: {
    tabs: [
      { key: 'home', text: '首页', icon: '⌂', url: '/pages/home/index' },
      { key: 'library', text: '游戏库', icon: '🎮', url: '/pages/library/index' },
      { key: 'room', text: '房间', icon: '🚪', url: '/pages/room/index' },
      { key: 'profile', text: '我的', icon: '👤', url: '/pages/profile/index' }
    ]
  },
  methods: {
    switchTab(e) {
      const url = e.currentTarget.dataset.url
      wx.switchTab ? wx.switchTab({ url, fail:()=>wx.reLaunch({url}) }) : wx.reLaunch({ url })
    }
  }
})
