const {
  GAME_DEFINITIONS,
  SONG_SCENES,
  SONG_POOL,
  WITNESS_ACTIONS,
  DANCE_SONG_STYLES,
  TRICKSTER_KEYWORDS,
  TRICKSTER_ACTIONS,
  DRAW_PROMPTS,
  TABLE_ACTIONS
} = require("./data");

function randomOne(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, num));
}

function resolvePlayerCount(room) {
  const playerCount = Array.isArray(room.players) ? room.players.length : 0;
  if (room.unlimited) {
    return Math.max(1, playerCount);
  }
  return Math.max(1, Number(room.targetCount) || playerCount || 4);
}

function normalizePlayers(players, targetCount) {
  const result = players.slice(0, Math.max(1, targetCount));
  while (result.length < targetCount) {
    const index = result.length + 1;
    result.push({
      id: "p_" + index,
      name: "玩家" + index,
      isHost: false
    });
  }
  return result;
}

function makeCard(player, title, body, extra) {
  return Object.assign(
    {
      playerId: player.id,
      playerName: player.name,
      title: title,
      body: body,
      private: true
    },
    extra || {}
  );
}

function buildSongWolfSession(room, game) {
  const players = normalizePlayers(room.players || [], resolvePlayerCount(room));
  const undercoverCount = Math.max(1, Math.min(Math.floor(players.length / 3), players.length - 1));
  const undercover = shuffle(players).slice(0, undercoverCount);
  const scenes = shuffle(SONG_SCENES);
  const songs = shuffle(SONG_POOL).slice(0, game.rounds);

  const rounds = songs.map(function (songName, index) {
    const scene = scenes[index % scenes.length];
    return {
      label: "第 " + (index + 1) + " 轮",
      cards: players.map(function (player) {
        const isUndercover = undercover.some(function (item) {
          return item.id === player.id;
        });
        return makeCard(
          player,
          isUndercover ? "你的身份：卧底" : "你的身份：好人",
          isUndercover
            ? "模糊情景：" + scene.badScene + "\n建议演唱：" + songName
            : "准确情景：" + scene.goodScene + "\n建议演唱：" + songName,
          {
            secretTip: songName
          }
        );
      })
    };
  });

  return {
    gameId: game.id,
    gameName: game.name,
    category: game.category,
    title: game.name,
    rules:
      "三轮内根据情景唱出贴合内容的歌曲，歌曲不能重复。若全部找出卧底，好人获胜。",
    note: "本局卧底人数：" + undercoverCount,
    players: players,
    rounds: rounds
  };
}

function buildWitnessSession(room, game, version) {
  const players = normalizePlayers(room.players || [], resolvePlayerCount(room));
  const wolfCount = Math.max(1, Math.min(Math.floor(players.length / 3), players.length - 1));
  const wolves = shuffle(players).slice(0, wolfCount);
  const rounds = Array.from({ length: game.rounds }, function (_, index) {
    const action = randomOne(WITNESS_ACTIONS);
    return {
      label: "第 " + (index + 1) + " 回合",
      cards: players.map(function (player) {
        const isWolf = wolves.some(function (item) {
          return item.id === player.id;
        });
        return makeCard(
          player,
          isWolf ? "身份：狼人" : "身份：小羊",
          isWolf
            ? "你可以随时睁眼，通过" + (version === 2 ? "对视或身体接触" : "对视") + "击杀小羊。"
            : "本轮指定动作：" + action + "\n完成任务后可报警并投票。",
          {
            publicHint: action
          }
        );
      })
    };
  });

  return {
    gameId: game.id,
    gameName: game.name,
    category: game.category,
    title: game.name,
    rules:
      version === 2
        ? "狼人可随时睁眼，通过对视或身体接触击杀小羊。小羊完成任务后可报警投票。"
        : "狼人可随时睁眼，通过对视击杀小羊。小羊完成任务后可报警投票。",
    note: "本局狼人人数：" + wolfCount,
    players: players,
    rounds: rounds,
    action: rounds[0] && rounds[0].cards[0] ? rounds[0].cards[0].publicHint : ""
  };
}

function buildDanceSession(room, game) {
  const players = normalizePlayers(room.players || [], resolvePlayerCount(room));
  const wolves = shuffle(players);
  const wolfKing = wolves[0];
  const wolfCubs = wolves.slice(1, Math.min(3, wolves.length));
  const songStyle = randomOne(DANCE_SONG_STYLES);

  const rounds = [
    {
      label: "开场起舞",
      cards: players.map(function (player) {
        let role = "身份：小羊";
        let body = "跟随音乐起舞，尽量不要暴露自己的节奏。";
        if (wolfKing && player.id === wolfKing.id) {
          role = "身份：狼王";
          body = "你的任务是找出两只听不到音乐的狼崽，并帮其隐藏。";
        } else if (wolfCubs.some(function (item) { return item.id === player.id; })) {
          role = "身份：狼崽";
          body = "如果你听不到音乐，要尽量跟随狼王的动作。";
        }
        return makeCard(player, role, body, { private: true });
      })
    }
  ];

  return {
    gameId: game.id,
    gameName: game.name,
    category: game.category,
    title: game.name,
    rules:
      "所有人在不知道彼此身份的情况下，跟随被分配到的音乐起舞。狼王要隐藏两只狼崽，羊阵营投出狼王即获胜。",
    note: "建议播放：" + songStyle,
    players: players,
    rounds: rounds
  };
}

function buildTricksterSession(room, game) {
  const players = normalizePlayers(room.players || [], resolvePlayerCount(room));
  const killerCount = Math.max(1, Math.min(2, Math.floor(players.length / 3)));
  const killers = shuffle(players).slice(0, killerCount);
  const keyword = randomOne(TRICKSTER_KEYWORDS);
  const action = randomOne(TRICKSTER_ACTIONS);

  const rounds = [
    {
      label: "任务阶段",
      cards: players.map(function (player) {
        const isKiller = killers.some(function (item) {
          return item.id === player.id;
        });
        return makeCard(
          player,
          isKiller ? "身份：捣蛋杀手" : "身份：好人",
          isKiller
            ? "完成 3 次任务后可开启捣蛋时刻。\n本次任务关键词：" + keyword + "\n动作任务：" + action
            : "闭眼等待，注意观察异常动作。",
          {
            secretTip: keyword + " / " + action
          }
        );
      })
    }
  ];

  return {
    gameId: game.id,
    gameName: game.name,
    category: game.category,
    title: game.name,
    rules:
      "捣蛋杀手完成指定任务 3 次即可开启捣蛋时刻，可与闭眼玩家互动并指定一人出局。",
    note: "关键词任务：" + keyword,
    players: players,
    rounds: rounds
  };
}

function buildDrawSession(room, game) {
  const players = normalizePlayers(room.players || [], resolvePlayerCount(room));
  const shuffled = shuffle(players);
  const half = Math.ceil(shuffled.length / 2);
  const teamA = shuffled.slice(0, half);
  const teamB = shuffled.slice(half);
  const prompt = randomOne(DRAW_PROMPTS);

  const rounds = [
    {
      label: "组队开画",
      cards: players.map(function (player) {
        const teamName = teamA.some(function (item) { return item.id === player.id; }) ? "A队" : "B队";
        return makeCard(
          player,
          "你的分组：" + teamName,
          "题板内容：" + prompt + "\n请轮流作画并让同队队友猜测。",
          {
            secretTip: prompt
          }
        );
      })
    }
  ];

  return {
    gameId: game.id,
    gameName: game.name,
    category: game.category,
    title: game.name,
    rules:
      "各队派一名队员根据题板内容画画，其余队友限时猜测。答对题目更多的队伍获胜。",
    note: "本局题板：" + prompt,
    players: players,
    rounds: rounds,
    teams: {
      A: teamA,
      B: teamB
    }
  };
}

function buildTableSession(room, game) {
  const players = normalizePlayers(room.players || [], resolvePlayerCount(room));
  const wolfCount = Math.max(1, Math.min(Math.floor(players.length / 3), players.length - 1));
  const wolves = shuffle(players).slice(0, wolfCount);
  const action = randomOne(TABLE_ACTIONS);

  const rounds = [
    {
      label: "餐桌回合",
      cards: players.map(function (player) {
        const isWolf = wolves.some(function (item) {
          return item.id === player.id;
        });
        return makeCard(
          player,
          isWolf ? "身份：狼人" : "身份：好人",
          isWolf
            ? "本轮动作：" + action + "\n请尽可能多地攻击他人。"
            : "小羊任务：保持进食并完成本轮动作 " + action + "。",
          {
            secretTip: action
          }
        );
      })
    }
  ];

  return {
    gameId: game.id,
    gameName: game.name,
    category: game.category,
    title: game.name,
    rules:
      "狼人通过特定动作攻击他人，被攻击的人立即停止用餐。全员复盘投票，狼人全出则好人胜利。",
    note: "本局狼人动作：" + action,
    players: players,
    rounds: rounds
  };
}

function buildComingSoonSession(room, game) {
  return {
    gameId: game.id,
    gameName: game.name,
    category: game.category,
    title: game.name,
    rules: "敬请期待。",
    note: "Coming Soon",
    players: normalizePlayers(room.players || [], resolvePlayerCount(room)),
    rounds: []
  };
}

function buildSession(gameId, room) {
  const game = GAME_DEFINITIONS.find(function (item) {
    return item.id === gameId;
  });

  if (!game) {
    throw new Error("未知的游戏类型");
  }

  if (game.comingSoon) {
    return buildComingSoonSession(room, game);
  }

  if (gameId === "song_wolf") {
    return buildSongWolfSession(room, game);
  }
  if (gameId === "witness_1") {
    return buildWitnessSession(room, game, 1);
  }
  if (gameId === "witness_2") {
    return buildWitnessSession(room, game, 2);
  }
  if (gameId === "dance_wolf") {
    return buildDanceSession(room, game);
  }
  if (gameId === "trickster") {
    return buildTricksterSession(room, game);
  }
  if (gameId === "draw_master") {
    return buildDrawSession(room, game);
  }
  if (gameId === "table_survival") {
    return buildTableSession(room, game);
  }

  throw new Error("暂未支持该游戏");
}

module.exports = {
  randomOne: randomOne,
  shuffle: shuffle,
  clampNumber: clampNumber,
  resolvePlayerCount: resolvePlayerCount,
  normalizePlayers: normalizePlayers,
  buildSession: buildSession
};
