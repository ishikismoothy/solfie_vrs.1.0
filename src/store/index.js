import { createStore } from 'vuex';
import user from '../modules/user';
import chat from '../modules/chat';
import todos from '../modules/todos';
import scores from '../modules/scores';
import abilities from '../modules/abilities';
import auth from '../modules/auth';
import dataExtraction from '../modules/dataExtraction';

export default createStore({
  modules: {
    user,
    chat,
    todos,
    scores,
    abilities,
    auth,
    dataExtraction,
  },
});
