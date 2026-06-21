// 出版診断レポート生成 - Netlify Function
// このファイルはサーバー側で実行されます。APIキーはここでのみ使用され、
// ブラウザ（利用者）には一切公開されません。

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY が設定されていません。Netlifyの環境変数を確認してください。' })
    };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'リクエストの形式が不正です。' }) };
  }

  const {
    name = 'ご相談者', job = '', yesCount = 0,
    yesItems = '', noItems = '',
    q8 = '', q9 = '', q10 = '', q11chips = '', q11free = '',
    reader = '', change = '',
    detailOpen = false,
    q12 = '', q13 = '', q14 = '',
    q15 = '', q16 = '', q17 = '',
    q18 = '', q19chips = '', price = '', q21chips = '',
    msg = ''
  } = data;

  const qLabels = ['', 'まだこれから', 'まだこれから', '書けます', '書けます', '十分あります', '十分あります', '今すぐ書こう！'];
  const scoreType = yesCount <= 2 ? 'これから準備型' : yesCount <= 4 ? '潜在力発掘型' : yesCount <= 6 ? '出版準備完了型' : '即出版適性型';

  let prompt = `電子書籍出版の専門コンサルタントとして、相談者の診断シートをもとに出版診断レポートの文章をJSON形式のみで生成してください。前置き・説明・コードブロックは一切不要、JSONのみを返してください。

【相談者】名前：${name} / 職業：${job} / 適性スコア：${yesCount}/7（${scoreType}）
【YES項目】${yesItems}
【NO項目】${noItems}
【Q8 解決してきた悩み】${q8}
【Q9 よく相談されること】${q9}
【Q10 もっと聞きたいと言われたこと】${q10}
【Q11 出版で実現したいこと】${q11chips} ${q11free}
【読んでほしい人】${reader}
【読んだ後の変化】${change}
【担当者メモ】${msg}
`;

  let schema = `{"typeLabel":"タイプ名6文字以内","scoreComment":"スコア評価100〜130字","bookTitle":"本タイトル案20字以内","bookComment":"本の価値と理由130〜160字","readerComment":"読者像コメント100〜130字"}`;

  if (detailOpen) {
    prompt += `
――― 詳細診断データ ―――
【Q12 悩みを乗り越えた具体的な方法】${q12}
【Q13 独自の視点・差別化ポイント】${q13}
【Q14 タイトル案（相談者記入）】${q14}
【Q15 読者が今困っていること（詳細）】${q15}
【Q16 読者が試してうまくいかなかったこと】${q16}
【Q17 なぜ今届けたいか】${q17}
【Q18 出版後につなげたいサービス・商品】${q18}
【Q19 販売・配布チャネル】${q19chips}
【Q20 価格イメージ】${price}
【Q21 既存の発信媒体】${q21chips}

詳細診断データも踏まえ、以下の追加項目も含めてJSONを生成してください。`;
    schema = `{"typeLabel":"タイプ名6文字以内","scoreComment":"スコア評価100〜130字","bookTitle":"本タイトル案20字以内","bookComment":"本の価値と理由130〜160字","readerComment":"読者像コメント100〜130字","conceptComment":"本のコンセプト・差別化ポイントの解説150〜180字","monetizeComment":"出版後の集客・マネタイズ戦略の提案150〜180字。チャネルや価格帯、バックエンド商品への動線を踏まえて具体的に","titleCandidates":["磨き上げたタイトル案1","タイトル案2","タイトル案3"]}`;
  }

  prompt += `
以下のJSON形式のみを返してください：
${schema}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: `Anthropic API error: ${errText}` }) };
    }

    const result = await res.json();
    let text = (result.content || []).map((c) => c.text || '').join('').trim();
    text = text.replace(/```json|```/g, '').trim();

    // バリデーション（パースできることを確認してから返す）
    const parsed = JSON.parse(text);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
