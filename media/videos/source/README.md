# Video source

Each `.html` here is one whole video (`gobierno-de-la-iglesia.html`, `la-constitucion-de-la-iglesia.html`, `los-funcionarios-de-la-iglesia.html`, `el-consistorio.html`, `la-historia-del-presbiterianismo.html`, `la-historia-del-presbiterio-san-andres.html`, `las-santas-escrituras.html`, `la-teologia-reformada.html`, `el-libro-de-adoracion.html`, `el-libro-de-disciplina.html`, `la-confesion-de-fe-de-westminster.html`, `el-anciano-y-la-palabra.html`, `el-presbiterio.html`, `los-sacramentos.html`, `guia-introduccion.html`, `terminos-clave.html`, `historia-de-la-iglesia.html`, `las-bases-de-la-teologia.html`, `el-pacto-y-las-ultimas-cosas.html`, `el-libro-de-gobierno.html`, `la-iglesia-y-su-gobierno.html`, `que-es-la-iglesia.html`): the narration script (the `SCRIPT` array, one entry per caption) drives the timing, and `window.render(t)` draws the frame at time `t`. Open it in Chrome to inspect; it uses the app's fonts from `node_modules` and the emblem from `assets/source/emblem.png`.

To render the MP4 (needs Node, ffmpeg and Playwright with Chromium: `npm i -D playwright && npx playwright install chromium`):

    node media/videos/source/render.js "$PWD/media/videos/source/gobierno-de-la-iglesia.html" media/videos/gobierno-de-la-iglesia.mp4 30

To fit a recorded narration, change each caption's timing in `SCRIPT` (or the `WPS` / `GAP` constants) to match the recording, add the audio as a second input to ffmpeg in `render.js`, and render again.

These files are not bundled into the app.
