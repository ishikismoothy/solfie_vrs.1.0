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

export default createStore({
  modules: {
    user,
    chat,
    todos,
    scores,
    abilities,
    auth,
    dataExtraction,
    mindspace,
    themeSpace
  },
});
