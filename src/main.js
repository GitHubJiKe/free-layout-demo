// 引入polyfills，解决Node.js环境兼容性问题
import "./polyfills.js";

import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
