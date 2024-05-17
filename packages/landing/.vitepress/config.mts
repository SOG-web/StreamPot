import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "StreamPot",
  description: "Easiest way to convert media",
  head: [['link', { rel: 'icon', href: '../favicon.ico' }]],
  srcDir: 'src',
  head: [
    [
      'script',
      {},
      `window.$crisp=[];window.CRISP_WEBSITE_ID="3f4d50bb-b8a8-4fa5-ae8d-80e61b99ad9a";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`,
    ],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home 🏠', link: '/' },
      // { text: 'Specification 📄', link: '/methods' },
      { text: 'Examples 🌟', link: '/examples' },
      { text: 'Contact ✉️', link: '/contact' },
    ],

    sidebar: [
      {
        text: 'Getting started',
        items: [
          { text: 'Installation', link: '/installation' },
          {
            text: 'List of methods',
            link: '/specification',
          },
        ],
      },
      {
        text: 'Self-hosting',
        items: [
          { text: 'Docker Compose', link: '/docker-compose' }
        ]
      },
      {
        text: 'Examples',
        items: [
          { text: '✄ Trim video', link: 'examples#trim-a-video' },
          { text: '🔄 Convert video', link: 'examples#convert-a-video' },
          { text: '🎞️ Concatenate videos', link: 'examples#concatenate-different-videos' },
          { text: '🎥 Watermark video', link: 'examples#add-watermark' },
          { text: '🔊 Add audio to video', link: 'examples#add-audio-to-video' },
          { text: '🎚️ Change volume', link: 'examples#change-volume' },
          { text: '🎨 Change resolution', link: 'examples#change-resolution' },
          { text: '🎞️ Crop video', link: 'examples#crop-video' },
          { text: '🔄 Convert audio', link: 'examples#convert-audio' },
          { text: '🔊 Extract audio', link: 'examples#extract-audio' },
          { text: '🎞️ Extract frames', link: 'examples#extract-frames' },
          { text: '🔄 Convert frames to video', link: 'examples#convert-frames-to-video' },
          // { text: '🎞️ Overlay videos', link: 'examples#overlay-videos' },
          // { text: '🎞️ Reverse video', link: 'examples#reverse-video' },
          // { text: '🎞️ Speed up video', link: 'examples#speed-up-video' },
          // { text: '🎞️ Slow down video', link: 'examples#slow-down-video' },
          // { text: '🎞️ Split video', link: 'examples#split-video' },
          // { text: '🎞️ Stitch videos', link: 'examples#stitch-videos' },
          // { text: '🎞️ Trim video', link: 'examples#trim-video' },
          // { text: '🎞️ Zoom video', link: 'examples#zoom-video' },
          // { text: '🎞️ Rotate video', link: 'examples#rotate-video' },
          // { text: '🎞️ Mirror video', link: 'examples#mirror-video' },
          // { text: '🎞️ Blur video', link: 'examples#blur-video' },
          // { text: '🎞️ Brighten video', link: 'examples#brighten-video' },
          // { text: '🎞️ Darken video', link: 'examples#darken-video' },
          // { text: '🎞️ Sharpen video', link: 'examples#sharpen-video' },
          // { text: '🎞️ Denoise video', link: 'examples#denoise-video' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/jackbridger/streampot' }
    ]
  }
})
