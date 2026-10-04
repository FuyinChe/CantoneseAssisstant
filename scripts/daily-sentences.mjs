const places = [
  "地铁站",
  "机场",
  "火车站",
  "巴士站",
  "医院",
  "诊所",
  "药房",
  "学校",
  "公司",
  "屋企",
  "超市",
  "街市",
  "商场",
  "餐厅",
  "公园",
  "图书馆",
  "邮局",
  "银行",
  "酒店",
  "警署",
  "戏院",
  "博物馆",
  "海边",
  "码头",
  "体育馆",
  "游泳池",
  "茶楼",
  "便利店",
  "停车场",
  "办公室",
  "课室",
  "食堂",
  "球场",
  "面包店",
  "消防局",
  "加油站",
  "社区中心",
  "游客中心",
  "酒店大堂",
  "公司门口",
];

const districts = ["中环", "湾仔", "铜锣湾", "尖沙咀", "旺角", "沙田", "荃湾", "观塘", "元朗", "屯门", "大埔", "将军澳", "东涌", "上环", "金钟"];

const people = ["阿妈", "阿爸", "阿哥", "家姐", "细佬", "细妹", "爷爷", "嫲嫲", "公公", "婆婆", "叔叔", "阿姨", "表哥", "表姐", "老公", "老婆", "仔", "女", "小朋友", "同事"];

const drinks = ["一杯热茶", "一杯咖啡", "一杯奶茶", "一杯冻柠茶", "一杯豆浆", "一杯清水", "一杯热奶", "一罐汽水", "一瓶矿泉水", "一杯果汁", "一壶茶", "一杯柠檬水"];

const foods = [
  "一碗面",
  "一碗饭",
  "一碗粥",
  "一个面包",
  "一条鱼",
  "一只烧鸡",
  "一个苹果",
  "一个橙",
  "一根香蕉",
  "一份点心",
  "一个汉堡",
  "一份炒饭",
  "一份炒面",
  "一个蛋挞",
  "一条油条",
  "一个包子",
  "一碗汤",
  "一个蛋糕",
  "一个雪糕",
  "一份烧味",
  "一碟青菜",
  "一个三明治",
  "一碗云吞面",
  "一份沙拉",
  "一包薯片",
  "一个馒头",
  "一块蛋糕",
  "两个鸡蛋",
];

const body = ["头", "颈", "肩", "背", "腰", "肚", "手", "脚", "膝头", "牙", "眼", "耳仔", "喉咙", "心口"];

const symptoms = ["发烧", "咳嗽", "头晕", "肚泻", "感冒", "过敏", "失眠", "恶心", "流鼻涕"];

const futureTimes = ["听朝", "听日", "後日", "下个礼拜", "今个周末", "今晚", "听晚", "阵间", "下昼", "朝早", "下个月", "年底"];

const activities = ["返工", "放工", "食饭", "出门", "返屋企", "睇医生", "温书", "买餸", "开会", "休息", "动身", "交功课", "见客", "洗衣", "煮饭", "扫地", "购物", "运动"];

const weekdays = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];

const weather = ["好热", "好冻", "好大风", "落大雨", "落细雨", "打风", "出太阳", "好潮湿", "阴天", "有雾", "打雷", "回南天"];

const goods = ["衬衫", "裤子", "鞋子", "袜子", "帽子", "袋子", "雨伞", "毛巾", "牙膏", "洗发水", "香皂", "纸巾", "电池", "充电器", "耳机", "水杯", "雨衣", "围巾", "手套", "腰带"];

const colors = ["红色", "蓝色", "黑色", "白色", "灰色", "绿色", "黄色", "粉色"];
const wearables = ["衫", "鞋", "袋"];

const prices = ["十蚊", "二十蚊", "三十蚊", "五十蚊", "八十蚊", "一百蚊", "一百五", "两百蚊"];

const chores = ["洗碗", "扫地", "拖地", "洗衣", "收衫", "煮饭", "买餸", "倒垃圾", "吸尘", "整理房间", "浇花", "喂狗"];

const switches = ["开灯", "熄灯", "开窗", "关窗", "开冷气", "关冷气", "锁门", "开门", "关电视", "开电视"];

const tasks = ["开会", "写报告", "覆邮件", "见客人", "出差", "加班", "打印文件", "排班", "做培训", "对账", "接电话", "填表格", "交报告", "整理档案"];

const subjects = ["中文", "英文", "数学", "历史", "地理", "科学", "粤语", "普通话", "音乐", "体育"];

const feelings = ["开心", "担心", "紧张", "辛苦", "兴奋", "失望", "生气", "不安", "后悔", "满意", "难过", "害怕"];
const eased = ["担心", "紧张", "辛苦", "失望", "生气", "不安", "后悔", "难过", "害怕"];

const favors = ["开门", "拎行李", "影相", "叫车", "翻译", "指路", "睇住袋", "换位", "倒杯水", "借充电器", "让个位", "讲慢啲"];

const modes = ["巴士", "地铁", "小巴", "的士", "电车", "渡轮", "火车", "单车"];

const lost = ["银包", "电话", "钥匙", "护照", "书包", "眼镜", "雨伞", "身份证", "车票", "行李"];

const meetTimes = ["听朝", "听日下昼", "今晚", "听晚", "周末", "下个礼拜", "後日朝早", "星期五晚"];

const meetPlaces = ["地铁站", "公司门口", "学校门口", "商场", "茶楼", "餐厅", "公园", "图书馆", "戏院", "酒店大堂", "巴士站", "办公室"];

const hours = ["一点", "两点", "三点", "四点", "五点", "六点", "七点", "八点", "九点", "十点", "十一点", "十二点"];

const sizes = ["细码", "中码", "大码", "加大码"];

const tastes = ["少糖", "少冰", "走冰", "少盐", "少油", "不要葱", "不要香菜", "加辣", "不要辣"];

export function generatedDailySentences() {
  const rows = [];
  const seen = new Set();

  function add(category, cantonese, simplified) {
    const key = cantonese.trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    rows.push({
      category,
      cantonese: key,
      simplified,
      mandarinGloss: simplified,
      sourceType: "user",
      sourceTitle: "本应用整理",
      license: "original",
    });
  }

  for (const place of [...places, ...districts]) {
    add("directions", `点去${place}？`, `怎么去${place}？`);
    add("directions", `${place}喺边度？`, `${place}在哪里？`);
    add("directions", `去${place}远唔远？`, `去${place}远不远？`);
    add("directions", `我要去${place}。`, `我要去${place}。`);
    add("directions", `唔该带我去${place}。`, `请带我去${place}。`);
    add("directions", `我而家喺${place}。`, `我现在在${place}。`);
    add("directions", `边条路去${place}？`, `哪条路去${place}？`);
    add("directions", `行路去${place}得唔得？`, `走路去${place}行不行？`);
    add("plans", `我哋听日去${place}。`, `我们明天去${place}。`);
    add("transport", `去${place}搭咩车？`, `去${place}坐什么车？`);
  }

  for (const mode of modes) {
    add("transport", `我搭${mode}去。`, `我坐${mode}去。`);
    add("transport", `搭${mode}要几耐？`, `坐${mode}要多久？`);
    add("transport", `呢度有冇${mode}？`, `这里有没有${mode}？`);
    add("transport", `我想搭${mode}。`, `我想坐${mode}。`);
    if (mode !== "的士" && mode !== "单车") {
      add("transport", `${mode}末班车几点？`, `${mode}末班车几点？`);
    }
    add("transport", `我搭错${mode}。`, `我坐错${mode}了。`);
  }

  for (const drink of drinks) {
    add("food", `我要${drink}。`, `我要${drink}。`);
    add("food", `唔该畀我${drink}。`, `请给我${drink}。`);
    add("food", `有冇${drink}？`, `有没有${drink}？`);
    add("food", `我想饮${drink}。`, `我想喝${drink}。`);
    add("food", `再要${drink}，唔该。`, `再要${drink}，谢谢。`);
  }

  for (const food of foods) {
    add("food", `我要${food}。`, `我要${food}。`);
    add("food", `唔该畀我${food}。`, `请给我${food}。`);
    add("food", `有冇${food}？`, `有没有${food}？`);
    add("food", `我钟意食${food}。`, `我喜欢吃${food}。`);
    add("food", `我食紧${food}。`, `我正在吃${food}。`);
    add("food", `再要${food}，唔该。`, `再要${food}，谢谢。`);
    add("food", `我想试下${food}。`, `我想试试${food}。`);
  }

  for (const taste of tastes) {
    add("food", `${taste}，唔该。`, `${taste}，谢谢。`);
  }

  for (const person of people) {
    add("family", `${person}喺屋企。`, `${person}在家。`);
    add("family", `我同${person}一齐食饭。`, `我和${person}一起吃饭。`);
    add("family", `${person}今日得闲。`, `${person}今天有空。`);
    add("family", `${person}叫我返去。`, `${person}叫我回去。`);
    add("family", `我担心${person}。`, `我担心${person}。`);
    add("family", `${person}返咗屋企未？`, `${person}回家了吗？`);
    add("contact", `我打俾${person}。`, `我打给${person}。`);
    add("contact", `我发讯息俾${person}。`, `我发消息给${person}。`);
    add("contact", `${person}未覆我。`, `${person}还没回我。`);
    add("contact", `你见到${person}未？`, `你见到${person}了吗？`);
    add("greeting", `${person}，早晨。`, `${person}，早上好。`);
  }

  for (const part of body) {
    add("health", `我${part}痛。`, `我${part}疼。`);
    add("health", `我${part}好痛。`, `我${part}很疼。`);
    add("health", `我${part}唔舒服。`, `我${part}不舒服。`);
  }

  for (const symptom of symptoms) {
    add("health", `我有啲${symptom}。`, `我有点${symptom}。`);
    add("health", `我因为${symptom}要休息。`, `我因为${symptom}要休息。`);
    add("health", `你系咪${symptom}？`, `你是不是${symptom}？`);
  }

  for (const time of futureTimes) {
    for (const activity of activities) {
      add("time", `我${time}要${activity}。`, `我${time}要${activity}。`);
    }
  }

  for (const day of weekdays) {
    add("time", `${day}我要返工。`, `${day}我要上班。`);
    add("time", `${day}晚得唔得闲？`, `${day}晚上有空吗？`);
    add("plans", `${day}一齐食饭，得唔得？`, `${day}一起吃饭，行不行？`);
  }

  for (const hour of hours) {
    add("time", `我${hour}先得闲。`, `我${hour}才有空。`);
    add("plans", `我哋${hour}见。`, `我们${hour}见。`);
    add("time", `听日${hour}开始。`, `明天${hour}开始。`);
  }

  for (const state of weather) {
    add("weather", `今日${state}。`, `今天${state}。`);
    add("weather", `听日可能${state}。`, `明天可能${state}。`);
    add("weather", `出面而家${state}。`, `外面现在${state}。`);
    add("weather", `因为${state}，我留喺屋企。`, `因为${state}，我留在家里。`);
  }

  for (const item of goods) {
    add("shopping", `有冇${item}卖？`, `有没有${item}卖？`);
    add("shopping", `我要买${item}。`, `我要买${item}。`);
    add("shopping", `${item}太贵喇。`, `${item}太贵了。`);
    add("shopping", `有冇平啲嘅${item}？`, `有没有便宜一点的${item}？`);
    add("shopping", `我想睇下${item}。`, `我想看看${item}。`);
    add("shopping", `我净系睇下${item}。`, `我只是看看${item}。`);
  }

  for (const color of colors) {
    for (const wearable of wearables) {
      add("shopping", `有冇${color}${wearable}？`, `有没有${color}的${wearable}？`);
    }
  }

  for (const price of prices) {
    add("shopping", `一共${price}。`, `一共${price}。`);
    add("shopping", `可唔可以平到${price}？`, `能不能便宜到${price}？`);
  }

  for (const size of sizes) {
    add("shopping", `有冇${size}？`, `有没有${size}？`);
    add("shopping", `${size}还有冇？`, `${size}还有吗？`);
  }

  for (const chore of chores) {
    add("home", `记得${chore}。`, `记得${chore}。`);
    add("home", `我去${chore}先。`, `我先去${chore}。`);
    add("home", `帮我${chore}，唔该。`, `帮我${chore}，谢谢。`);
    add("home", `你${chore}未？`, `你${chore}了吗？`);
    add("home", `屋企要${chore}。`, `家里要${chore}。`);
  }

  for (const action of switches) {
    add("home", `记得${action}。`, `记得${action}。`);
    add("home", `唔该${action}。`, `请${action}。`);
    add("home", `我已经${action}。`, `我已经${action}了。`);
  }

  for (const task of tasks) {
    add("work", `我要${task}。`, `我要${task}。`);
    add("work", `今日要${task}。`, `今天要${task}。`);
    add("work", `我做紧${task}。`, `我正在${task}。`);
    add("work", `听日先${task}。`, `明天再${task}。`);
    add("work", `老板叫我${task}。`, `老板叫我${task}。`);
  }

  for (const subject of subjects) {
    add("study", `我要温${subject}。`, `我要复习${subject}。`);
    add("study", `我唔明${subject}。`, `我不懂${subject}。`);
    add("study", `今日有${subject}堂。`, `今天有${subject}课。`);
    add("study", `听日考${subject}。`, `明天考${subject}。`);
    add("study", `你教我${subject}，得唔得？`, `你教我${subject}，行不行？`);
    add("study", `我听日交${subject}功课。`, `我明天交${subject}作业。`);
  }

  for (const feeling of feelings) {
    add("feeling", `我好${feeling}。`, `我很${feeling}。`);
    add("feeling", `你系咪好${feeling}？`, `你是不是很${feeling}？`);
  }
  for (const feeling of eased) {
    add("feeling", `唔使咁${feeling}。`, `不用这么${feeling}。`);
  }

  for (const favor of favors) {
    add("courtesy", `唔该帮我${favor}。`, `请帮我${favor}。`);
    add("courtesy", `可唔可以帮我${favor}？`, `能不能帮我${favor}？`);
    add("courtesy", `多谢你帮我${favor}。`, `谢谢你帮我${favor}。`);
  }

  for (const thing of lost) {
    add("help", `我唔见咗${thing}。`, `我的${thing}不见了。`);
    add("help", `你见到我个${thing}未？`, `你见到我的${thing}了吗？`);
  }
  for (const service of ["警察", "救护车", "保安", "消防"]) {
    add("help", `快啲叫${service}。`, `快点叫${service}。`);
  }

  for (const time of meetTimes) {
    for (const place of meetPlaces) {
      add("plans", `我哋${time}喺${place}见。`, `我们${time}在${place}见。`);
    }
  }
  for (const place of meetPlaces) {
    add("plans", `改去${place}等，得唔得？`, `改到${place}等，行不行？`);
    add("plans", `听日改喺${place}见。`, `明天改在${place}见。`);
  }

  const pets = ["狗", "猫", "兔", "仓鼠", "鹦鹉", "金鱼", "龟", "雀仔"];
  const animals = ["狗", "猫", "兔", "雀", "鱼", "龟", "鸡", "鸭", "猪", "牛", "羊", "马", "老虎", "狮子", "大象", "猴子", "熊猫", "熊", "蛇", "青蛙", "蝴蝶", "蜜蜂", "鸽子"];
  for (const pet of pets) {
    add("animal", `我屋企有只${pet}。`, `我家里有一只${pet}。`);
    add("animal", `我要喂${pet}。`, `我要喂${pet}。`);
    add("animal", `呢只${pet}好得意。`, `这只${pet}很可爱。`);
    add("animal", `${pet}饿啦。`, `${pet}饿了。`);
    add("animal", `带${pet}去睇兽医。`, `带${pet}去看兽医。`);
  }
  for (const animal of animals) {
    add("animal", `我喺动物园见到${animal}。`, `我在动物园看到${animal}。`);
    add("animal", `我钟意${animal}。`, `我喜欢${animal}。`);
    add("animal", `你怕唔怕${animal}？`, `你怕不怕${animal}？`);
    add("animal", `呢只${animal}好大只。`, `这只${animal}很大。`);
    add("animal", `唔好吓亲${animal}。`, `别吓到${animal}。`);
  }

  const flowers = ["玫瑰", "百合", "兰花", "菊花", "荷花", "向日葵", "桃花", "梅花"];
  const plants = ["树", "草", "竹", "仙人掌", "薄荷", "葱", "蒜", "姜", "盆栽", "玫瑰", "百合", "兰花"];
  for (const flower of flowers) {
    add("plant", `呢朵${flower}好香。`, `这朵${flower}很香。`);
    add("plant", `我想买一束${flower}。`, `我想买一束${flower}。`);
    add("plant", `${flower}开咗。`, `${flower}开了。`);
  }
  for (const plant of plants) {
    add("plant", `我想种${plant}。`, `我想种${plant}。`);
    add("plant", `记得淋${plant}。`, `记得给${plant}浇水。`);
    add("plant", `${plant}枯咗。`, `${plant}枯了。`);
    add("plant", `呢盆${plant}要搬去窗边。`, `这盆${plant}要搬到窗边。`);
  }
  add("plant", "呢棵树好高。", "这棵树很高。");
  add("plant", "叶子黄咗。", "叶子黄了。");
  add("plant", "种子仲未发芽。", "种子还没发芽。");
  add("plant", "花园入面好多花。", "花园里有很多花。");

  const produce = ["白菜", "菜心", "生菜", "番茄", "黄瓜", "茄子", "土豆", "萝卜", "豆角", "西兰花", "豆腐", "猪肉", "牛肉", "鸡肉", "鱼", "虾", "蟹", "鸡蛋", "葱", "蒜", "姜", "辣椒", "香菜", "蘑菇", "玉米", "南瓜", "冬瓜"];
  const amounts = ["半斤", "一斤", "两斤", "三斤"];
  for (const item of produce) {
    add("market", `${item}几多钱一斤？`, `${item}多少钱一斤？`);
    add("market", `呢啲${item}新唔新鲜？`, `这些${item}新不新鲜？`);
    add("market", `今日有冇${item}？`, `今天有没有${item}？`);
    add("market", `帮我拣啲新鲜嘅${item}。`, `帮我挑些新鲜的${item}。`);
    add("market", `老板，${item}平啲得唔得？`, `老板，${item}便宜一点行不行？`);
  }
  for (const item of ["菜心", "白菜", "猪肉", "牛肉", "虾", "豆腐", "鸡蛋", "番茄"]) {
    for (const amount of amounts) {
      add("market", `我要${amount}${item}。`, `我要${amount}${item}。`);
    }
  }
  add("market", "街市几点关门？", "菜市场几点关门？");
  add("market", "呢档猪肉好新鲜。", "这个档口的猪肉很新鲜。");
  add("market", "我每个朝早都去街市。", "我每天早上去菜市场。");
  add("market", "找钱，唔该。", "找零，谢谢。");

  const callers = ["阿妈", "阿爸", "老师", "老板", "同事", "朋友", "医生", "同学"];
  const phoneLines = [
    ["喂，你好。", "喂，你好。"],
    ["我打错电话。", "我打错电话了。"],
    ["可唔可以讲大声啲？", "可以大声一点吗？"],
    ["讯号唔好，我听唔清。", "信号不好，我听不清。"],
    ["阵间再打过。", "一会儿再打过来。"],
    ["你而家方便讲电话吗？", "你现在方便打电话吗？"],
    ["请等一阵。", "请等一下。"],
    ["我留低电话号码。", "我留下电话号码。"],
    ["听日再联络。", "明天再联系。"],
    ["你收到我个未接来电未？", "你收到我的未接来电了吗？"],
    ["而家开会，阵间先覆你。", "现在开会，一会儿再回你。"],
    ["我而家喺地铁，听唔清。", "我现在在地铁，听不清。"],
    ["可唔可以发短讯俾我？", "可以发短信给我吗？"],
    ["你个电话坏咗？", "你的电话坏了吗？"],
  ];
  for (const [cantonese, simplified] of phoneLines) add("phone", cantonese, simplified);
  for (const person of callers) {
    add("phone", `喂，请问系咪${person}？`, `喂，请问是${person}吗？`);
    add("phone", `我打俾${person}，冇人听。`, `我打给${person}，没人接。`);
    add("phone", `${person}而家讲紧电话。`, `${person}正在打电话。`);
    add("phone", `帮我叫${person}听电话。`, `帮我叫${person}听电话。`);
    add("phone", `我留讯俾${person}。`, `我给${person}留了言。`);
    add("phone", `阵间叫${person}打返俾我。`, `一会儿让${person}打回来给我。`);
  }

  const schoolPlaces = ["课室", "操场", "图书馆", "食堂", "校长室", "礼堂", "实验室", "音乐室"];
  const schoolPeople = ["老师", "同学", "校长", "班主任"];
  const schoolLines = [
    ["我返学迟到。", "我上学迟到了。"],
    ["而家上课。", "现在上课。"],
    ["下课啦。", "下课了。"],
    ["放学问老师再见。", "放学和老师再见。"],
    ["我要见班主任。", "我要见班主任。"],
    ["你今日着咗校服未？", "你今天穿校服了吗？"],
    ["操场有人打球。", "操场有人打球。"],
    ["我喺图书馆温书。", "我在图书馆复习。"],
    ["我去食堂食午饭。", "我去食堂吃午饭。"],
    ["听日学校放假。", "明天学校放假。"],
    ["我请一日假。", "我请一天假。"],
    ["书包太重。", "书包太重。"],
    ["我唔记得带课本。", "我忘了带课本。"],
    ["黑板上面写咗功课。", "黑板上写了作业。"],
    ["考试期间要安静。", "考试期间要安静。"],
    ["暑假就到。", "暑假就要到了。"],
  ];
  for (const [cantonese, simplified] of schoolLines) add("school", cantonese, simplified);
  for (const place of schoolPlaces) {
    add("school", `我而家喺${place}。`, `我现在在${place}。`);
    add("school", `老师叫我去${place}。`, `老师叫我去${place}。`);
    add("school", `${place}喺边层？`, `${place}在几楼？`);
  }
  for (const person of schoolPeople) {
    add("school", `${person}叫我交功课。`, `${person}叫我交作业。`);
    add("school", `我去搵${person}。`, `我去找${person}。`);
  }
  add("school", "我同同学一齐返学。", "我和同学一起上学。");
  add("school", "今日有班会。", "今天有班会。");
  add("school", "我坐第一排。", "我坐第一排。");
  add("school", "可唔可以借你支笔？", "可以借你一支笔吗？");

  const balls = ["足球", "篮球", "羽毛球", "乒乓球", "网球", "排球"];
  const activitiesSport = [
    ["游泳", "去游泳"],
    ["跑步", "去跑步"],
    ["跳绳", "去跳绳"],
    ["爬山", "去爬山"],
    ["骑单车", "去骑单车"],
    ["练瑜伽", "去练瑜伽"],
    ["打太极", "去打太极"],
  ];
  for (const ball of balls) {
    add("sport", `我打紧${ball}。`, `我正在打${ball}。`);
    add("sport", `你识唔识打${ball}？`, `你会不会打${ball}？`);
    add("sport", `听日一齐打${ball}。`, `明天一起打${ball}。`);
    add("sport", `我${ball}打得一般。`, `我${ball}打得一般。`);
    add("sport", `边度可以打${ball}？`, `哪里可以打${ball}？`);
  }
  for (const [name, phrase] of activitiesSport) {
    add("sport", `我去${name}。`, `我${phrase}。`);
    add("sport", `我每个星期都${name}。`, `我每个星期都${phrase}。`);
    add("sport", `你想唔想一齐${name}？`, `你想不想一起${phrase}？`);
    add("sport", `我${name}好耐。`, `我${phrase}很久了。`);
  }
  add("sport", "我要热身先。", "我要先热身。");
  add("sport", "比赛听日开始。", "比赛明天开始。");
  add("sport", "我哋队赢咗。", "我们队赢了。");
  add("sport", "今场打和。", "这场打平了。");
  add("sport", "记得带运动鞋。", "记得带运动鞋。");
  add("sport", "我游咗十个塘。", "我游了十个来回。");

  const relatives = ["阿爷", "阿嫲", "公公", "婆婆", "阿爸", "阿妈", "伯父", "伯母", "叔叔", "阿姨", "舅父", "舅母", "姑妈", "姑丈", "姨妈", "姨丈", "表哥", "表姐", "表弟", "表妹", "堂哥", "堂姐", "细佬", "细妹", "老公", "老婆", "仔", "女", "外甥", "外甥女", "孙", "孙女", "外孙", "外孙女"];
  for (const relative of relatives) {
    add("kinship", `呢位系我${relative}。`, `这位是我${relative}。`);
    add("kinship", `我有${relative}。`, `我有${relative}。`);
    add("kinship", `我${relative}住得好远。`, `我${relative}住得很远。`);
    add("kinship", `过年我去探${relative}。`, `过年我去看${relative}。`);
  }
  const kinshipLines = [
    ["阿爸嘅哥哥系伯父。", "爸爸的哥哥是伯父。"],
    ["阿爸嘅弟弟系叔叔。", "爸爸的弟弟是叔叔。"],
    ["阿爸嘅姊妹系姑妈。", "爸爸的姐妹是姑妈。"],
    ["阿妈嘅兄弟系舅父。", "妈妈的兄弟是舅父。"],
    ["阿妈嘅姊妹系姨妈。", "妈妈的姐妹是姨妈。"],
    ["姑妈嘅仔女叫表哥表姐。", "姑妈的子女叫表哥表姐。"],
    ["舅父嘅仔女都叫表哥表姐。", "舅父的子女也叫表哥表姐。"],
    ["叔叔嘅仔女叫堂哥堂姐。", "叔叔的子女叫堂哥堂姐。"],
    ["仔嘅仔叫孙。", "儿子的儿子叫孙子。"],
    ["仔嘅女叫孙女。", "儿子的女儿叫孙女。"],
    ["女嘅仔叫外孙。", "女儿的儿子叫外孙。"],
    ["女嘅女叫外孙女。", "女儿的女儿叫外孙女。"],
    ["我叫爸爸做阿爸。", "我叫爸爸做阿爸。"],
    ["我叫妈妈做阿妈。", "我叫妈妈做阿妈。"],
    ["同阿爸一边、同姓嘅兄弟叫堂兄弟。", "爸爸这边、同姓的兄弟叫堂兄弟。"],
    ["阿妈或者姑妈一边嘅兄弟叫表兄弟。", "妈妈或者姑妈这边的兄弟叫表兄弟。"],
    ["你点称呼你舅父？", "你怎么称呼你舅父？"],
    ["我细佬今年五岁。", "我弟弟今年五岁。"],
    ["家姐大我两岁。", "姐姐比我大两岁。"],
    ["我哋一家有三代人。", "我们一家有三代人。"],
  ];
  for (const [cantonese, simplified] of kinshipLines) add("kinship", cantonese, simplified);

  return rows;
}
