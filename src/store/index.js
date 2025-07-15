import { createStore } from 'vuex';
import user from '../modules/user';
import chat from '../modules/chat';
import todos from '../modules/todos';
import scores from '../modules/scores';
import abilities from '../modules/abilities';
import auth from '../modules/auth';
import dataExtraction from '../modules/dataExtraction';
import mindspace from '../modules/mindspace';
import themeSpace from '../modules/themeSpace';
import analysisRecords from '../modules/analysisRecords';
import sharing from '../modules/sharing';

export default createStore({
  modules: {
    user,
    chat,
    todos,
    scores,
    abilities,
    analysisRecords,
    auth,
    dataExtraction,
    mindspace,
    themeSpace,
    sharing,
  },
});
