/**
 * ポートフォリオの問い合わせフォーム受け口（Google Apps Script ウェブアプリ）
 *
 * 使い方:
 *  1. https://script.google.com で新しいプロジェクトを作り、このファイルの内容を貼り付ける
 *  2. 右上「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 *     - 説明: portfolio contact
 *     - 次のユーザーとして実行: 自分
 *     - アクセスできるユーザー: 全員
 *  3. 発行された URL（https://script.google.com/macros/s/.../exec）を
 *     script.js の CONTACT_ENDPOINT に貼り付けて push する
 *  4. 初回デプロイ時に Gmail 送信の権限を求められるので許可する
 *
 * 変更したら「デプロイを管理」→ 編集 → 新バージョンで再デプロイすること（URL は変わらない）。
 */

const TO = 'nagasakarenta@gmail.com';
const MAX_PER_HOUR_PER_SENDER = 5;

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // ハニーポット（人間には見えない欄）に入力があればボット。成功を装って捨てる
    if (data.website) return json_({ ok: true });

    const name = clean_(data.name, 100);
    const email = clean_(data.email, 200);
    const company = clean_(data.company, 120);
    const topic = clean_(data.topic, 60) || 'その他';
    const message = clean_(data.message, 5000);
    if (!name || !email || !message) return json_({ ok: false, error: 'missing' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json_({ ok: false, error: 'email' });

    // 同じ送信者から 1 時間に MAX 件まで
    const cache = CacheService.getScriptCache();
    const key = 'c_' + Utilities.base64EncodeWebSafe(email.toLowerCase());
    const n = Number(cache.get(key) || 0);
    if (n >= MAX_PER_HOUR_PER_SENDER) return json_({ ok: false, error: 'rate' });
    cache.put(key, String(n + 1), 3600);

    const subject = `[Portfolio] ${topic} — ${name}`;
    const body =
      `${message}\n\n` +
      `—\n` +
      `お名前: ${name}\n` +
      `会社名・所属: ${company || '-'}\n` +
      `メール: ${email}\n` +
      `種類: ${topic}\n` +
      `ページ: ${clean_(data.page, 300)}\n` +
      `UA: ${clean_(data.ua, 200)}\n` +
      `受信: ${new Date().toISOString()}`;

    MailApp.sendEmail({ to: TO, replyTo: email, name: 'Portfolio Contact', subject: subject, body: body });

    // 送信者への自動返信（不要ならこのブロックを削除）
    MailApp.sendEmail({
      to: email,
      name: '長坂 錬汰',
      subject: `お問い合わせありがとうございます — ${topic}`,
      body:
        `${name} 様\n\nメッセージを受け取りました。通常 1〜2 日以内にご返信します。\n\n` +
        `— 送信内容 —\n${message}\n\n長坂 錬汰\n${TO}`
    });

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// 動作確認用: ブラウザで URL を開くとこの JSON が返る
function doGet() {
  return json_({ ok: true, service: 'portfolio-contact' });
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
