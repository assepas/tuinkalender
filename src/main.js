import { mount } from "svelte";
import App from "./App.svelte";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/print.css";

const app = mount(App, { target: document.getElementById("app") });

export default app;
