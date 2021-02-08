安装过慢可以使用以下指令单独安装puppeteer
```
npx cross-env PUPPETEER_DOWNLOAD_HOST=https://npm.taobao.org/mirrors/ npm install puppeteer --save
```
修改url的时候记得把domain也修改，否则cookie不会生效
