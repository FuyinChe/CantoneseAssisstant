# 粤语助手

粤语助手（Cantonese Assisstant）是个人、非商业的粤语学习应用。

网址：<https://cantonese.learnlanguage.net>

## 功能

- 简体、繁体或混合输入，换成粤语书面说法并标粤拼。点字可以听这个字，点粤拼可以改多音字的读音。
- 同一句话并排显示香港繁体、台湾繁体和简体。同一位置用字不同的字会标出来。台湾繁体标注音，简体标拼音。
- 整句可以按粤语、国语、普通话和英语朗读。简体句子会译成英文。朗读和英文翻译会把这句话送到在线服务。
- 拍照或上传图片，识别整张，或在图片上拖出一块再识别。图片留在这台设备上。
- 香港繁体可以做成笔顺工作纸：勾选要打印的字，选择大方格或小方格，然后打印或另存为 PDF。
- 日常粤语短句按场景浏览和搜索，点字听粤语。

## 本地

```bash
npm install
npm run dev
```

开发在 `dev` 分支。`main` 是 Vercel 的生产分支。

朗读默认使用在线语音。需要改提供方时，按 `.env.example` 在 `.env.local` 里设置 `TTS_PROVIDER`。

## 词库

手工对照在 `data/phrase-map.manual.json`，手工短句在 `data/examples.manual.json`。场景短句由 `scripts/daily-sentences.mjs` 生成。运行：

```bash
npm run lexicon
```

会写出 `data/phrase-map.json` 和 `data/examples.json`。

## 授权

本仓库里由本应用编写的程序、CA 标志、词表和日常短句，采用 [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0)。全文在 `LICENSE`。

可以出于个人学习等非商业目的使用、修改和再分发。再分发时须附上 `LICENSE`，并保留其中以 `Required Notice:` 开头的声明。不得用于商业用途。

这份协议只约束本应用自己编写的部分。下面两类调用不在其中。

开源依赖各自保留原协议。这些协议允许商用，再分发时须保留原声明：

| 资料 | 协议 | 说明 |
| --- | --- | --- |
| to-jyutping | BSD-2-Clause | 依赖，负责粤拼。 |
| OpenCC 词典数据（经 opencc-js） | Apache-2.0 | 依赖，负责香港和台湾字形。opencc-js 程序本身为 MIT。 |
| pinyin-pro | MIT | 依赖，负责拼音。注音由拼音转写。 |
| tesseract.js | Apache-2.0 | 依赖，在浏览器里识字。语言数据在使用时下载，不入库。 |
| pdf-lib、Next.js、React | MIT | 依赖。 |
| hanzi-writer-data | Arphic Public License | 笔顺按字从 CDN 读取，数据文件不在本仓库。来自 Make Me a Hanzi，源自文鼎字体。允许商用；改过的笔画数据要按同一协议附上授权文本。 |

两个在线接口没有授权给第三方产品商用：

- 朗读默认使用 Edge 浏览器自己的朗读服务。商用朗读需改用付费的 Azure 语音。
- 英文翻译使用 Google 给浏览器扩展用的翻译接口，不是 Google Cloud Translation。

当前入库的对照和日常短句都是本应用编写的，适用上面的 PolyForm 非商业协议。
