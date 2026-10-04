import { siteName, siteNameEn } from "@/lib/site";

export default function AboutPage() {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 text-sm leading-7">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">关于{siteName}</h1>
        <p>
          {siteName}（{siteNameEn}）是一个个人、非商业的粤语学习工具。输入一句中文，就能看到粤语说法、三种字形、读音和英文，也可以从图片识字，或把香港繁体做成笔顺工作纸。
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">粤语书面说法</h2>
        <p>
          简体、繁体或两者夹杂都可以直接输入。句子会换成粤语书面说法，每个字下面标粤拼。点一个字可以听这个字的粤语；多音字点下面的粤拼，可以换成另一个读音。整句也可以按粤语习惯朗读。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">三种字形对照</h2>
        <p>
          同一句话并排显示香港繁体、台湾繁体和简体。同一位置用字不同的字会标出来。香港字形只改用字，口头说法留在粤语那一栏。台湾繁体标注音，简体标拼音，多音字同样可以改读音。整句可以分别按国语习惯和普通话习惯朗读。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">英文</h2>
        <p>简体句子会译成英文，并可以按英语朗读。朗读和英文翻译都会把这句话送到在线服务。</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">从图片识字</h2>
        <p>
          可以拍照或从相册选一张图片，识别整张，或在图片上拖出一块再识别。认出的字会填进输入框，接着走同一套粤语转换。图片留在这台设备上，识别完成后可以收起，只留一条预览。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">笔顺工作纸</h2>
        <p>
          香港繁体可以打开笔顺工作纸。每个字按笔画展开，下面留田字格临写。可以勾选要打印的字，并在大方格和小方格之间切换，然后打印或另存为 PDF。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">日常粤语短句</h2>
        <p>
          短句按场景整理，包括招呼、天气、问路、食物、菜市场、购物、交通、学校、体育运动、亲属关系、打电话等。可以按场景筛选或搜索，点字听粤语。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">所用资料</h2>
        <ul className="list-disc pl-5">
          <li>
            <a className="underline" href="https://github.com/BYVoid/OpenCC">OpenCC</a>
            负责香港和台湾字形。
          </li>
          <li>
            <a className="underline" href="https://github.com/CanCLID/to-jyutping">to-jyutping</a>
            （CanCLID，BSD-2-Clause）负责粤拼。
          </li>
          <li>
            <a className="underline" href="https://github.com/zh-lx/pinyin-pro">pinyin-pro</a>
            （zh-lx，MIT）负责拼音，注音由拼音转写。
          </li>
          <li>
            <a className="underline" href="https://github.com/skishore/makemeahanzi">Make Me a Hanzi</a>
            提供笔顺笔画，供临写参考。
          </li>
        </ul>
      </section>
    </article>
  );
}
