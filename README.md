# 粤语助手

个人、非商业的粤语学习应用。简体输入会给出香港繁体字形、粤语书面说法和粤拼，并用浏览器的普通话、粤语语音播放。也可以上传图片，识别整张或框选区域。

## 本地

```bash
npm install
npm run dev
```

开发在 `dev` 分支。`main` 是 Vercel 的生产分支。

## 词库

手工对照在 `data/phrase-map.manual.json`。可选地把粤典的 `all.csv` / `all.csv.gz`，或 CC-Canto 的 `cccanto.txt`，放到 `data/raw/`（该目录不入库），然后：

```bash
npm run lexicon
```

粤典数据只可用于非商业用途，并需要署名。详见关于页。
