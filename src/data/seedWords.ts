import type { VocabCard } from "../types/vocab";

const TODAY = "2026-08-28";

// 過去のテストで間違いが多かった単語（優先的に出題されるよう srsLevel を低く設定）
const WEAK_KANJI = new Set(["狡猾", "忌避", "紅潮"]);

type SeedEntry = Omit<
  VocabCard,
  "id" | "registeredAt" | "srsLevel" | "nextReviewAt" | "history"
>;

const seedEntries: SeedEntry[] = [
  {
    kanji: "詰問",
    reading: "きつもん",
    meaning: "相手を厳しく問い詰めること",
    synonyms: [
      { word: "追及", nuance: "責任や真相を明らかにする、より客観的・組織的な文脈" },
      { word: "尋問", nuance: "警察や裁判など公的な立場からの質問に限定" },
    ],
    antonyms: [
      { word: "傾聴", example: "彼女は部下の悩みを傾聴した。" },
      { word: "労う", example: "上司は部下の頑張りを労った。" },
    ],
    example: "彼は不正の理由を詰問された。",
  },
  {
    kanji: "憤然",
    reading: "ふんぜん",
    meaning: "怒りを抑えきれず、いかにも腹を立てている様子",
    synonyms: [
      { word: "憤慨", nuance: "怒りの感情そのものに焦点。動詞的に使いやすい" },
      { word: "激怒", nuance: "怒りの強度がより激しい" },
    ],
    antonyms: [
      { word: "平然", example: "彼は批判されても平然としていた。" },
      { word: "淡々", example: "彼女は淡々と結果を報告した。" },
    ],
    example: "彼は憤然として席を立った。",
  },
  {
    kanji: "青天の霹靂",
    reading: "せいてんのへきれき",
    meaning: "突然起こる、予想もしなかった出来事",
    synonyms: [
      { word: "寝耳に水", nuance: "より口語的でカジュアル。日常会話でよく使う" },
      { word: "突然の出来事", nuance: "慣用句ではなく普通の表現" },
    ],
    antonyms: [
      { word: "予想通り", example: "結果は予想通りだった。" },
      { word: "想定内", example: "この程度のトラブルは想定内だ。" },
    ],
    example: "彼の退職はまさに青天の霹靂だった。",
  },
  {
    kanji: "独白口調",
    reading: "どくはくくちょう",
    meaning: "一人で語りかけているような、心情を吐露する話し方・文体",
    synonyms: [
      { word: "モノローグ調", nuance: "映画・演劇批評など横文字寄りの文脈で使う" },
      { word: "内省的な語り", nuance: "内容が自己を見つめる性質であることに焦点" },
    ],
    antonyms: [
      { word: "対話調", example: "この脚本は対話調で進んでいく。" },
      { word: "客観的な語り口", example: "ニュース記事は客観的な語り口で書かれる。" },
    ],
    example: "この小説は独白口調で書かれている。",
  },
  {
    kanji: "白昼夢",
    reading: "はくちゅうむ",
    meaning: "昼間、目が覚めている状態で見る夢のような空想",
    synonyms: [
      { word: "夢想", nuance: "実現しそうにないことを思い描くこと全般" },
      { word: "幻想", nuance: "現実にないものをあるかのように感じるイメージ" },
    ],
    antonyms: [
      { word: "現実", example: "それは白昼夢ではなく現実だった。" },
      { word: "冷静な判断", example: "彼は白昼夢から覚め、冷静な判断を取り戻した。" },
    ],
    example: "まるで白昼夢を見ているようだった。",
  },
  {
    kanji: "買いかぶる",
    reading: "かいかぶる",
    meaning: "人の能力や価値を実際以上に高く評価する",
    synonyms: [
      { word: "過大評価する", nuance: "客観的・書き言葉寄り" },
      { word: "見込みすぎる", nuance: "期待や将来性に対して使うことが多い" },
    ],
    antonyms: [
      { word: "見くびる", example: "彼の実力を見くびっていた。" },
      { word: "過小評価する", example: "自分を過小評価しすぎだよ。" },
    ],
    example: "それは買いかぶりすぎです。",
  },
  {
    kanji: "搦め手",
    reading: "からめて",
    meaning: "正面からでなく裏や側面から攻める手段。弱点を突くやり方",
    synonyms: [
      { word: "裏技", nuance: "ゲームや日常の工夫・攻略法。より軽い言葉" },
      { word: "迂回策", nuance: "論理的・戦略的な文脈で使うかたい表現" },
    ],
    antonyms: [
      { word: "正攻法", example: "搦め手ではなく正攻法で挑むべきだ。" },
      { word: "王道", example: "あの人はいつも王道を行くタイプだ。" },
    ],
    example: "正面からでなく搦め手で攻めた方がいい。",
  },
  {
    kanji: "一縷の望み",
    reading: "いちるののぞみ",
    meaning: "ほとんど絶望的な状況で、かすかに残るわずかな望み",
    synonyms: [
      { word: "一筋の希望", nuance: "やや前向きで温かみのある響き" },
      { word: "僅かな可能性", nuance: "感情的な重みが薄く、確率として述べる" },
    ],
    antonyms: [
      { word: "絶望", example: "彼はついに絶望してしまった。" },
      { word: "確信", example: "彼女は勝利を確信していた。" },
    ],
    example: "医師の言葉に一縷の望みを託した。",
  },
  {
    kanji: "割礼",
    reading: "かつれい",
    meaning: "宗教的・文化的な慣習として、性器の一部を切除する儀式",
    synonyms: [
      { word: "儀式", nuance: "割礼はその一種。儀式はより広い一般語" },
      { word: "通過儀礼", nuance: "人生の節目を示す儀式全般の代表例" },
    ],
    antonyms: [],
    example: "その部族には割礼の儀式がある。",
  },
  {
    kanji: "繁茂",
    reading: "はんも",
    meaning: "草木が盛んに生い茂ること",
    synonyms: [
      { word: "生い茂る", nuance: "繁茂よりやわらかく日常的にも使える" },
      { word: "茂る", nuance: "よりシンプルで一般的な語" },
    ],
    antonyms: [
      { word: "枯れる", example: "夏の暑さで植物が枯れてしまった。" },
      { word: "不毛", example: "この土地は不毛で何も育たない。" },
    ],
    example: "庭には雑草が繁茂していた。",
  },
  {
    kanji: "面目躍如",
    reading: "めんもくやくじょ",
    meaning: "評判・実力にふさわしい活躍をし、名声どおりの働きを見せること",
    synonyms: [
      { word: "本領発揮", nuance: "より口語的。本来の実力を出すことに焦点" },
      { word: "名実相伴う", nuance: "名声と実質が一致していることを客観的に述べる" },
    ],
    antonyms: [
      { word: "期待外れ", example: "今回の結果は期待外れに終わった。" },
      { word: "面目丸つぶれ", example: "ミスが続き、面目丸つぶれだった。" },
    ],
    example: "後半戦、彼はまさに面目躍如の働きを見せた。",
  },
  {
    kanji: "狡猾",
    reading: "こうかつ",
    meaning: "ずる賢く、悪知恵が働くこと",
    synonyms: [
      { word: "ずる賢い", nuance: "よりくだけた言い方。日常会話向き" },
      { word: "老獪", nuance: "経験に裏打ちされたしたたかさ。一目置くニュアンスも" },
    ],
    antonyms: [
      { word: "純朴", example: "彼は田舎育ちらしい純朴な性格だ。" },
      { word: "誠実", example: "彼女はどんな時も誠実に対応する。" },
    ],
    example: "彼は狡猾なやり方で人を出し抜いた。",
  },
  {
    kanji: "忌避",
    reading: "きひ",
    meaning: "嫌って避けること。関わりたくないと拒否する態度",
    synonyms: [
      { word: "敬遠", nuance: "なんとなく避けるという柔らかいニュアンス" },
      { word: "回避", nuance: "嫌悪感を伴わない、中立的な行為" },
    ],
    antonyms: [
      { word: "志向", example: "彼は安定志向が強い。" },
      { word: "歓迎", example: "新しい提案を歓迎する声が多かった。" },
    ],
    example: "その薬品には虫を忌避する効果がある。",
  },
  {
    kanji: "紅潮",
    reading: "こうちょう",
    meaning: "興奮や恥ずかしさ、怒りなどで顔が赤くなること",
    synonyms: [
      { word: "上気", nuance: "興奮・熱・恥ずかしさで顔がほてる状態全般" },
      { word: "赤らむ", nuance: "日常会話で使いやすいやわらかい表現" },
    ],
    antonyms: [
      { word: "青ざめる", example: "知らせを聞いて彼は青ざめた。" },
      { word: "血の気が引く", example: "その光景に血の気が引いた。" },
    ],
    example: "彼女は褒められて頬を紅潮させた。",
  },
  {
    kanji: "顰蹙",
    reading: "ひんしゅく",
    meaning: "不快に思って眉をひそめること。周囲からの反感・軽蔑",
    synonyms: [
      { word: "反感", nuance: "嫌悪・敵意に近く、軽蔑のニュアンスは必須でない" },
      { word: "眉をひそめる", nuance: "顰蹙の元になった動作表現そのもの" },
    ],
    antonyms: [
      { word: "称賛", example: "彼の行動は称賛された。" },
      { word: "好感", example: "その振る舞いは好感を持たれた。" },
    ],
    example: "彼の身勝手な発言は周囲の顰蹙を買った。",
  },
  {
    kanji: "軟派",
    reading: "なんぱ",
    meaning: "異性を気軽に誘う、または遊び人的な人・態度（元は穏健な派閥の意味）",
    synonyms: [
      { word: "チャラい", nuance: "若者言葉。外見や態度の軽薄さを指す" },
      { word: "遊び人", nuance: "誘う行動より生活態度・性格全般を指す" },
    ],
    antonyms: [
      { word: "硬派", example: "彼は硬派で真面目な性格だ。" },
      { word: "誠実", example: "彼は誠実な態度で交際を申し込んだ。" },
    ],
    example: "あの人はちょっと軟派な印象がある。",
  },
  {
    kanji: "言外",
    reading: "げんがい",
    meaning: "言葉には直接表れていない部分。言葉の裏にある意味やニュアンス",
    synonyms: [
      { word: "含み", nuance: "よりくだけた言い方。日常会話でも使いやすい" },
      { word: "ニュアンス", nuance: "カタカナ語。微妙な語感や雰囲気そのもの" },
    ],
    antonyms: [
      { word: "明言", example: "彼はその件について明言を避けた。" },
      { word: "直接的", example: "彼女は直接的な物言いをする人だ。" },
    ],
    example: "その言い方には言外の意味が込められていた。",
  },
  {
    kanji: "一瞥",
    reading: "いちべつ",
    meaning: "ちらっと一目見ること",
    synonyms: [
      { word: "一瞥をくれる", nuance: "相手を見てやるという上から目線のニュアンスが強まる" },
      { word: "ちらっと見る", nuance: "よりくだけた言い方" },
    ],
    antonyms: [
      { word: "凝視", example: "彼は写真をじっと凝視した。" },
      { word: "熟視", example: "資料を熟視してから判断した。" },
    ],
    example: "彼は書類に一瞥をくれただけで席を立った。",
  },
  {
    kanji: "負い目",
    reading: "おいめ",
    meaning: "相手に悪いことをした、迷惑をかけたという後ろめたさ・心理的な負債感",
    synonyms: [
      { word: "引け目", nuance: "比較による劣等感。負い目は加害・恩義に基づく" },
      { word: "罪悪感", nuance: "より強く、道徳的な罪の意識が明確な場合" },
    ],
    antonyms: [
      { word: "誇り", example: "彼はその功績に誇りを持っている。" },
      { word: "恩を売る", example: "彼はわざと恩を売るような真似をした。" },
    ],
    example: "恩を返せていないことにずっと負い目を感じている。",
  },
  {
    kanji: "引け目",
    reading: "ひけめ",
    meaning: "自分と他人を比べて、自分が劣っていると感じる気後れ・劣等感",
    synonyms: [
      { word: "劣等感", nuance: "より強く、心理学的・持続的なコンプレックス" },
      { word: "コンプレックス", nuance: "カタカナ語で口語的・カジュアル" },
    ],
    antonyms: [
      { word: "優越感", example: "テストで一番になり優越感に浸った。" },
      { word: "自信", example: "彼女は自分の実力に自信を持っている。" },
    ],
    example: "友達は受かったのに自分だけ落ちて引け目を感じた。",
  },
];

export const seedWords: VocabCard[] = seedEntries.map((entry, index) => ({
  ...entry,
  id: `seed-${index + 1}`,
  registeredAt: TODAY,
  srsLevel: WEAK_KANJI.has(entry.kanji) ? -1 : 0,
  nextReviewAt: TODAY,
  history: [],
}));
