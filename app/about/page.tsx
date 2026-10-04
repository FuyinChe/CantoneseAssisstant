export default function AboutPage() {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 text-sm leading-7">
      <h1 className="text-2xl font-semibold">关于</h1>
      <p>
        粤语助手是个人、非商业的学习工具。简体或繁体都可以输入：简体标拼音，并给出英文机器翻译；台湾繁体标注音，香港字形再换成粤语书面说法并标粤拼。朗读优先使用在线神经语音：普通话晓晓、台湾国语晓臻、粤语晓曼、英语 Aria。句子会送到在线语音服务；若暂时读不了，再改用这台设备自己的语音。英文翻译也会把简体句子发送到在线翻译服务。
      </p>
      <p>
        粤典 words.hk 没有可供实时调用的查询接口。完整词典以《非商业开放资料授权协议 1.0》发布，必须署名，不能用于商业。把
        <code className="mx-1">all.csv</code>
        或
        <code className="mx-1">all.csv.gz</code>
        放到
        <code className="mx-1">data/raw/</code>
        后运行
        <code className="mx-1">npm run lexicon</code>
        ，脚本会抽出简体对照和短例句。若以后作商业用途，必须撤下粤典数据。
      </p>
      <p>
        CC-Canto 以知识共享 署名-相同方式共享 3.0 发布。把
        <code className="mx-1">cccanto.txt</code>
        放进同一目录再运行脚本，可以补入词条。OpenCC 负责香港和台湾字形，to-jyutping（CanCLID，BSD-2-Clause）负责粤拼，pinyin-pro（zh-lx，MIT）负责拼音，注音由拼音转写。
      </p>
      <p>
        影视、图书、新闻、博客和社交媒体没有整段收录。这些作品多半有版权。词汇页可以自己追加短句，并选择来源类型；追加内容只存在这台浏览器。
      </p>
      <p>
        第一版的改写走词库。
        <code className="mx-1">lib/rewrite/llm.ts</code>
        留作以后的大模型改写，当前页面不会调用它。朗读默认走 Edge 在线语音；把
        <code className="mx-1">TTS_PROVIDER</code>
        设为 azure 并填上微软语音密钥后，会改用同一批神经声线。
      </p>
      <ul className="list-disc pl-5">
        <li>
          <a className="underline" href="https://words.hk/">粤典 words.hk</a>
        </li>
        <li>
          <a className="underline" href="https://cccanto.org/">CC-Canto</a>
        </li>
        <li>
          <a className="underline" href="https://github.com/BYVoid/OpenCC">OpenCC</a>
        </li>
        <li>
          <a className="underline" href="https://github.com/CanCLID/to-jyutping">to-jyutping</a>
        </li>
        <li>
          <a className="underline" href="https://github.com/zh-lx/pinyin-pro">pinyin-pro</a>
        </li>
      </ul>
    </article>
  );
}
