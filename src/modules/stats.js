
export default {
  namespaced: true,
  state: {
    solfieLevel: 100,
    questCleared: 34,
    averageScore: 4.5,
    quests: [
      { quest: "アカウントを設定しよう。", theme: "Tutorial", exp: 100, timestamp: "2024/03/01 20:44" },
      { quest: "選択をリストアップ", theme: "Decision", exp: 100, timestamp: "2024/03/01 20:44" },
    ],
  },
  mutations: {
    SET_STATS_DATA(state, statsData) {
      Object.assign(state, statsData);
    },
    COMPLETE_QUEST(state, index) {
      state.quests.splice(index, 1);
      state.questCleared++;
    },
  },
  actions: {
    updateStatsData({ commit }, statsData) {
      commit('SET_STATS_DATA', statsData);
    },
    completeQuest({ commit }, index) {
      commit('COMPLETE_QUEST', index);
    },
  },
};
