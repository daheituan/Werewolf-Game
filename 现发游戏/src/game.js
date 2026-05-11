const { GAME_CATEGORIES, GAME_DEFINITIONS } = require("./data");
const { buildSession, clampNumber } = require("./engine");

const APP_NAME = "圆桌玩家";
const ROOM_KEY = "round_table_room";
const SESSION_KEY = "round_table_game_session";
const ROOT = typeof globalThis !== "undefined" ? globalThis : this;

function createDefaultRoom() {
  return {
    roomId: "room_" + Date.now(),
    targetCount: 6,
    unlimited: false,
    players: [
      {
        id: "p_host",
        name: "主持人",
        isHost: true
      }
    ]
  };
}

function loadRoom() {
  const saved = wx.getStorageSync(ROOM_KEY);
  if (!saved || !Array.isArray(saved.players) || saved.players.length === 0) {
    const room = createDefaultRoom();
    wx.setStorageSync(ROOM_KEY, room);
    return room;
  }

  if (!saved.players.some(function (player) { return player.isHost; })) {
    saved.players.unshift({
      id: "p_host",
      name: "主持人",
      isHost: true
    });
    wx.setStorageSync(ROOM_KEY, saved);
  }

  return saved;
}

function saveRoom(room) {
  wx.setStorageSync(ROOM_KEY, room);
}

function saveSession(session) {
  wx.setStorageSync(SESSION_KEY, session);
}

function loadSession() {
  return wx.getStorageSync(SESSION_KEY);
}

function getDevicePlatform() {
  try {
    if (typeof wx.getDeviceInfo === "function") {
      const info = wx.getDeviceInfo() || {};
      return info.platform || "unknown";
    }
  } catch (err) {
    // 忽略平台读取失败，游戏仍可继续运行。
  }
  try {
    const info = wx.getSystemInfoSync();
    return info.platform || "unknown";
  } catch (err2) {
    return "unknown";
  }
}

function createButton(x, y, width, height, text, onTap, options) {
  const opt = options || {};
  return {
    x: x,
    y: y,
    width: width,
    height: height,
    text: text,
    onTap: onTap,
    radius: opt.radius !== undefined ? opt.radius : 18,
    fill: opt.fill !== undefined ? opt.fill : "#ffe49c",
    textColor: opt.textColor !== undefined ? opt.textColor : "#2b1b05",
    border: opt.border !== undefined ? opt.border : "#9c6c1c"
  };
}

function createTouchTarget(rect, onTap) {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    onTap: onTap
  };
}

function titleCase(text) {
  return String(text || "");
}

class RoundTablePlayerGame {
  constructor() {
    this.info = wx.getSystemInfoSync();
    this.platform = getDevicePlatform();
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext("2d");
    this.dpr = this.info.pixelRatio || 1;
    this.width = this.info.windowWidth;
    this.height = this.info.windowHeight;
    this.frame = null;
    this.buttons = [];
    this.touchTargets = [];
    this.state = {
      page: "home",
      category: null,
      selectedGameId: null,
      room: loadRoom(),
      session: null,
      revealRoundIndex: 0,
      revealCardIndex: 0,
      message: "",
      playing: false
    };

    this.setupCanvas();
    this.bindTouches();
    this.render = this.render.bind(this);
    this.loop = this.loop.bind(this);
    this.start();
  }

  setupCanvas() {
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.textBaseline = "middle";
    this.ctx.textAlign = "left";
  }

  bindTouches() {
    var self = this;
    function handle(point) {
      if (!point) {
        return;
      }
      var x = point.clientX !== undefined ? point.clientX : point.pageX !== undefined ? point.pageX : point.x;
      var y = point.clientY !== undefined ? point.clientY : point.pageY !== undefined ? point.pageY : point.y;
      var hit = self.buttons.concat(self.touchTargets).find(function (item) {
        return x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height;
      });
      if (hit && typeof hit.onTap === "function") {
        hit.onTap();
      }
    }

    if (typeof this.canvas.addEventListener === "function") {
      this.canvas.addEventListener("touchend", function (event) {
        var touch = event.changedTouches && event.changedTouches[0];
        handle(touch);
      });
    }
  }

  start() {
    if (this.frame) {
      return;
    }
    this.render();
    this.frame = setInterval(this.loop, 1000 / 30);
  }

  loop() {
    this.render();
  }

  setState(patch) {
    this.state = Object.assign({}, this.state, patch);
    this.render();
  }

  updateRoom(patch) {
    const room = Object.assign({}, this.state.room, patch);
    saveRoom(room);
    this.setState({ room: room });
  }

  resetGame() {
    this.setState({
      page: "home",
      category: null,
      selectedGameId: null,
      session: null,
      revealRoundIndex: 0,
      revealCardIndex: 0,
      message: "",
      playing: false
    });
  }

  addPlayer() {
    const room = loadRoom();
    const nextIndex = room.players.length + 1;
    room.players.push({
      id: "p_" + nextIndex,
      name: "玩家" + nextIndex,
      isHost: false
    });
    saveRoom(room);
    this.setState({
      room: room,
      message: "已添加一名玩家"
    });
  }

  removePlayer() {
    const room = loadRoom();
    if (room.players.length <= 1) {
      wx.showToast({ title: "至少保留主持人", icon: "none" });
      return;
    }
    room.players.pop();
    saveRoom(room);
    this.setState({
      room: room,
      message: "已移除最后一名玩家"
    });
  }

  chooseCategory(category) {
    this.setState({
      category: category,
      page: "games",
      message: ""
    });
  }

  chooseGame(gameId) {
    this.setState({
      selectedGameId: gameId,
      page: "setup",
      message: ""
    });
  }

  launchSession(gameId) {
    try {
      const room = loadRoom();
      if ((room.players || []).length < 3) {
        wx.showToast({ title: "至少需要 3 名玩家", icon: "none" });
        return;
      }
      if (!room.unlimited && Number(room.targetCount) < 3) {
        wx.showToast({ title: "人数至少 3 人", icon: "none" });
        return;
      }
      const session = buildSession(gameId, room);
      saveSession(session);
      this.setState({
        session: session,
        page: session.rounds.length === 0 ? "comingSoon" : "session",
        revealRoundIndex: 0,
        revealCardIndex: 0,
        message: session.note || ""
      });
    } catch (error) {
      wx.showToast({ title: error.message || "启动失败", icon: "none" });
    }
  }

  nextCard() {
    const session = this.state.session;
    if (!session || !session.rounds.length) {
      return;
    }
    const currentRound = session.rounds[this.state.revealRoundIndex];
    if (!currentRound) {
      return;
    }
    const nextCardIndex = this.state.revealCardIndex + 1;
    if (nextCardIndex < currentRound.cards.length) {
      this.setState({ revealCardIndex: nextCardIndex });
      return;
    }
    const nextRoundIndex = this.state.revealRoundIndex + 1;
    if (nextRoundIndex < session.rounds.length) {
      this.setState({
        revealRoundIndex: nextRoundIndex,
        revealCardIndex: 0
      });
      return;
    }
    this.setState({ page: "result" });
  }

  inviteFriends() {
    if (wx.shareAppMessage) {
      wx.shareAppMessage({
        title: "来一起玩《圆桌玩家》吧",
        imageUrl: ""
      });
      return;
    }
    wx.showModal({
      title: "邀请好友",
      content: "当前环境不支持直接分享，请把小程序转发给好友一起使用。",
      showCancel: false
    });
  }

  drawBackground() {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#fef5db");
    gradient.addColorStop(1, "#fffaf0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = "rgba(133, 92, 24, 0.06)";
    for (let i = 0; i < 10; i += 1) {
      ctx.beginPath();
      ctx.arc((i * 53) % this.width, (i * 79) % this.height, 32 + (i % 4) * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  roundRect(x, y, width, height, radius) {
    const ctx = this.ctx;
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  wrapText(text, x, y, maxWidth, lineHeight, color, font) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color || "#3a2710";
    ctx.font = font || "14px sans-serif";
    const lines = [];
    String(text || "")
      .split("\n")
      .forEach(function (line) {
        let current = "";
        for (let i = 0; i < line.length; i += 1) {
          const next = current + line.charAt(i);
          if (ctx.measureText(next).width > maxWidth && current) {
            lines.push(current);
            current = line.charAt(i);
          } else {
            current = next;
          }
        }
        lines.push(current || "");
      });
    lines.forEach(function (line, index) {
      ctx.fillText(line, x, y + index * lineHeight);
    });
    ctx.restore();
  }

  drawTitle(title, subtitle) {
    const ctx = this.ctx;
    ctx.fillStyle = "#2b1b05";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(titleCase(title), 24, 44);
    if (subtitle) {
      ctx.fillStyle = "#7d5a22";
      ctx.font = "14px sans-serif";
      ctx.fillText(subtitle, 24, 70);
    }
  }

  drawPanel(x, y, width, height, title, body) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.strokeStyle = "rgba(132, 91, 24, 0.15)";
    ctx.lineWidth = 1;
    this.roundRect(x, y, width, height, 20);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2b1b05";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(title, x + 18, y + 28);
    this.wrapText(body, x + 18, y + 58, width - 36, 22, "#473014", "14px sans-serif");
    ctx.restore();
  }

  drawButton(button) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = button.fill;
    ctx.strokeStyle = button.border;
    ctx.lineWidth = 2;
    this.roundRect(button.x, button.y, button.width, button.height, button.radius);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = button.textColor;
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2);
    ctx.restore();
  }

  drawPlayerSeat(player, x, y, radius) {
    const ctx = this.ctx;
    ctx.fillStyle = player.isHost ? "#ffcc6d" : "#fff2cb";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#b7862e";
    ctx.stroke();
    ctx.fillStyle = "#3a2710";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(player.name, x, y + radius + 12);
  }

  renderHome() {
    const room = this.state.room;
    this.drawTitle(APP_NAME, "聚会游戏辅助小游戏");

    this.drawPanel(
      18,
      92,
      this.width - 36,
      168,
      "圆桌概览",
      "当前玩家：" +
        room.players.length +
        " 人\n目标人数：" +
        (room.unlimited ? "不限制" : room.targetCount + " 人") +
        "\n平台：" +
        this.platform +
        "\n说明：这是本地聚会版，主持人可以手动增减玩家。"
    );

    this.buttons.push(createButton(20, 282, 108, 42, "加一人", this.addPlayer.bind(this)));
    this.buttons.push(createButton(136, 282, 108, 42, "减一人", this.removePlayer.bind(this)));
    this.buttons.push(
      createButton(
        252,
        282,
        this.width - 272,
        42,
        room.unlimited ? "人数：不限制" : "人数：" + room.targetCount,
        function () {
          if (room.unlimited) {
            this.updateRoom({
              unlimited: false,
              targetCount: clampNumber(room.targetCount, 4, 20, 6)
            });
          } else {
            const next = room.targetCount >= 20 ? 4 : room.targetCount + 1;
            this.updateRoom({ targetCount: next });
          }
        }.bind(this)
      )
    );
    this.buttons.push(
      createButton(
        20,
        338,
        this.width - 40,
        42,
        room.unlimited ? "切换为指定人数" : "切换为不限制人数",
        function () {
          this.updateRoom({ unlimited: !room.unlimited });
        }.bind(this)
      )
    );
    this.buttons.push(
      createButton(20, 392, this.width - 40, 48, "开始选择游戏", function () {
        this.setState({ page: "category" });
      }.bind(this), {
        fill: "#ffcc6d"
      })
    );
    this.buttons.push(
      createButton(20, 448, this.width - 40, 42, "邀请好友", this.inviteFriends.bind(this), {
        fill: "#d9f0ff",
        border: "#6497c7"
      })
    );

    const seatTop = 508;
    this.drawPanel(18, seatTop, this.width - 36, this.height - seatTop - 16, "圆桌座位", "点击按钮增加或移除玩家。");
    const seats = room.players.slice(0, 8);
    seats.forEach(
      function (player, index) {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const x = 44 + col * 86;
        const y = seatTop + 56 + row * 72;
        this.drawPlayerSeat(player, x, y, 24);
      }.bind(this)
    );
  }

  renderCategory() {
    this.drawTitle("选择分类", "先选狼人杀或猜词类");
    this.drawPanel(20, 110, this.width - 40, 148, "分类说明", "狼人杀类会自动生成身份与任务。猜词类会生成分组与题板提示。");
    this.buttons.push(createButton(20, 282, this.width - 40, 70, "狼人杀", this.chooseCategory.bind(this, "wolf"), { fill: "#ffd27d" }));
    this.buttons.push(createButton(20, 370, this.width - 40, 70, "猜词类", this.chooseCategory.bind(this, "guess"), { fill: "#d9f0ff" }));
    this.buttons.push(createButton(20, this.height - 64, this.width - 40, 42, "返回首页", this.resetGame.bind(this)));
  }

  renderGameList() {
    const category = this.state.category;
    const title = category === "wolf" ? "狼人杀类游戏" : "猜词类游戏";
    this.drawTitle(title, "点击游戏卡片进入设置");
    const games = GAME_DEFINITIONS.filter(function (game) {
      return game.category === category;
    });
    games.forEach(
      function (game, index) {
        const y = 96 + index * 92;
        this.drawPanel(20, y, this.width - 40, 78, game.name, game.summary + (game.comingSoon ? "\n敬请期待" : ""));
        this.buttons.push(
          createButton(
            this.width - 128,
            y + 20,
            88,
            34,
            game.comingSoon ? "Soon" : "选择",
            function () {
              if (game.comingSoon) {
                this.setState({ page: "comingSoon", selectedGameId: game.id });
                return;
              }
              this.chooseGame(game.id);
            }.bind(this),
            {
              fill: game.comingSoon ? "#e3e3e3" : "#ffdc92"
            }
          )
        );
      }.bind(this)
    );
    this.buttons.push(createButton(20, this.height - 64, this.width - 40, 42, "返回分类", function () {
      this.setState({ page: "category" });
    }.bind(this)));
  }

  renderSetup() {
    const game = GAME_DEFINITIONS.find(
      function (item) {
        return item.id === this.state.selectedGameId;
      }.bind(this)
    );
    if (!game) {
      this.resetGame();
      return;
    }
    this.drawTitle(game.name, "先看规则，再开始分配");
    this.drawPanel(20, 96, this.width - 40, 182, "游戏规则", game.summary);

    const room = this.state.room;
    this.drawPanel(
      20,
      294,
      this.width - 40,
      148,
      "当前设置",
      "玩家数：" +
        room.players.length +
        "\n目标人数：" +
        (room.unlimited ? "不限制" : room.targetCount + " 人") +
        "\n系统会自动生成狼人、任务、词语或歌曲提示。"
    );

    this.buttons.push(
      createButton(20, 468, this.width - 40, 44, "开始游戏", this.launchSession.bind(this, game.id), {
        fill: "#ffcc6d"
      })
    );
    this.buttons.push(
      createButton(20, 522, (this.width - 50) / 2, 38, "返回游戏列表", function () {
        this.setState({ page: "games" });
      }.bind(this))
    );
    this.buttons.push(
      createButton(30 + (this.width - 50) / 2, 522, (this.width - 50) / 2, 38, "回首页", this.resetGame.bind(this))
    );
  }

  renderSession() {
    const session = this.state.session || loadSession();
    if (!session) {
      this.resetGame();
      return;
    }

    const round = session.rounds[this.state.revealRoundIndex];
    this.drawTitle(session.title, (this.state.revealRoundIndex + 1) + "/" + Math.max(1, session.rounds.length) + " 轮");
    this.drawPanel(20, 96, this.width - 40, 128, "规则", session.rules);
    this.drawPanel(20, 238, this.width - 40, 72, "本局提示", session.note || "请主持人按顺序传递设备。");

    if (!round) {
      this.drawPanel(20, 330, this.width - 40, 164, "结束", "所有内容已发放完成。现在可以开始复盘、投票或进入下一局。");
      this.buttons.push(createButton(20, 520, this.width - 40, 42, "回到首页", this.resetGame.bind(this)));
      return;
    }

    const card = round.cards[this.state.revealCardIndex];
    if (!card) {
      this.drawPanel(20, 330, this.width - 40, 164, "本轮结束", "第 " + (this.state.revealRoundIndex + 1) + " 轮已经全部发放完毕。");
      if (this.state.revealRoundIndex + 1 < session.rounds.length) {
        this.buttons.push(
          createButton(20, 520, this.width - 40, 42, "进入下一轮", function () {
            this.setState({
              revealRoundIndex: this.state.revealRoundIndex + 1,
              revealCardIndex: 0
            });
          }.bind(this), {
            fill: "#ffcf73"
          })
        );
      } else {
        this.buttons.push(createButton(20, 520, this.width - 40, 42, "结束复盘", function () {
          this.setState({ page: "result" });
        }.bind(this), {
          fill: "#ffcf73"
        }));
      }
      return;
    }

    this.drawPanel(
      20,
      330,
      this.width - 40,
      164,
      card.playerName + " 的卡片",
      (card.private ? "仅当前玩家查看" : "本内容可公开给全员") + "\n\n" + card.title + "\n" + card.body
    );

    this.buttons.push(
      createButton(20, 520, this.width - 40, 42, "我看完了，传给下一位", this.nextCard.bind(this), {
        fill: "#ffcf73"
      })
    );

    this.touchTargets.push(
      createTouchTarget(
        { x: 20, y: 330, width: this.width - 40, height: 164 },
        function () {
          if (card.private) {
            wx.showToast({ title: "请先看完卡片，再点底部按钮", icon: "none" });
          }
        }
      )
    );
  }

  renderComingSoon() {
    this.drawTitle("Coming Soon", "游戏8 预留入口");
    this.drawPanel(20, 120, this.width - 40, 148, "预留位", "后续新增游戏可以直接接到这个入口。");
    this.buttons.push(createButton(20, 300, this.width - 40, 42, "返回首页", this.resetGame.bind(this)));
  }

  renderResult() {
    const session = this.state.session || loadSession();
    this.drawTitle("本局结束", session ? session.gameName : APP_NAME);
    this.drawPanel(20, 110, this.width - 40, 176, "结果", session ? session.rules : "游戏已经结束。");
    this.drawPanel(20, 308, this.width - 40, 132, "下一步", "你可以重新选择游戏，或者回到首页继续加人后再开一局。");
    this.buttons.push(createButton(20, 468, this.width - 40, 42, "再来一局", this.resetGame.bind(this), { fill: "#ffcc6d" }));
  }

  renderFooter() {
    const ctx = this.ctx;
    ctx.fillStyle = "#8a6a2a";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(APP_NAME + " · " + this.platform, 24, this.height - 16);
  }

  render() {
    this.buttons = [];
    this.touchTargets = [];
    this.drawBackground();

    switch (this.state.page) {
      case "home":
        this.renderHome();
        break;
      case "category":
        this.renderCategory();
        break;
      case "games":
        this.renderGameList();
        break;
      case "setup":
        this.renderSetup();
        break;
      case "session":
        this.renderSession();
        break;
      case "comingSoon":
        this.renderComingSoon();
        break;
      case "result":
        this.renderResult();
        break;
      default:
        this.renderHome();
    }

    this.buttons.forEach(this.drawButton.bind(this));
    this.renderFooter();
  }
}

wx.onShow(function () {
  if (!ROOT.__roundTablePlayerGame) {
    ROOT.__roundTablePlayerGame = new RoundTablePlayerGame();
  } else if (ROOT.__roundTablePlayerGame.render) {
    ROOT.__roundTablePlayerGame.render();
  }
});

if (!ROOT.__roundTablePlayerGame) {
  ROOT.__roundTablePlayerGame = new RoundTablePlayerGame();
}
