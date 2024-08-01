import { createStore } from 'vuex';
import user from '../modules/user';
import chat from '../modules/chat';
import todos from '../modules/todos';
import scores from '../modules/scores';
import abilities from '../modules/abilities';

export default createStore({
  modules: {
    user,
    chat,
    todos,
    scores,
    abilities,
  },
})