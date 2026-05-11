Page({
  goWerewolf(){ wx.navigateTo({ url:'/pages/gameList/gameList?category=werewolf' }) },
  goGuess(){ wx.navigateTo({ url:'/pages/gameList/gameList?category=guess' }) },
  goMore(){ wx.showToast({ title:'更多玩法即将上线', icon:'none' }) }
})
