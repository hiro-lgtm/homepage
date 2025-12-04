/**
 * Google Apps Script - お問い合わせフォーム送信処理
 * 
 * このスクリプトをGoogle Apps Scriptにコピーして使用してください
 * 
 * デプロイ手順：
 * 1. script.google.com にアクセス
 * 2. 新しいプロジェクトを作成
 * 3. このコードを貼り付け
 * 4. 保存
 * 5. 「デプロイ」→「新しいデプロイ」→「種類の選択」→「ウェブアプリ」
 * 6. 説明を入力、実行ユーザーを「自分」に設定、アクセス権限を「全員」に設定
 * 7. 「デプロイ」をクリック
 * 8. 表示されたWebアプリのURLをコピーして、script.jsのGAS_WEB_APP_URLに貼り付け
 */

function doPost(e) {
  try {
    // リクエストデータを取得
    // FormDataで送信された場合は、e.parameterから取得
    // JSONで送信された場合は、e.postData.contentsから取得
    let data;
    if (e.postData && e.postData.contents) {
      // JSON形式の場合
      data = JSON.parse(e.postData.contents);
    } else {
      // FormData形式の場合
      data = {
        name: e.parameter.name || '',
        email: e.parameter.email || '',
        phone: e.parameter.phone || '',
        company: e.parameter.company || '',
        service: e.parameter.service || '',
        message: e.parameter.message || '',
        timestamp: e.parameter.timestamp || new Date().toISOString()
      };
    }
    
    // 必須項目のチェック
    if (!data.name || !data.email || !data.message) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '必須項目が入力されていません'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // メール送信先（info@k-state.jpに変更してください）
    const recipientEmail = 'info@k-state.jp';
    
    // サービス名のマッピング
    const serviceNames = {
      'consulting': '経営顧問契約・経営支援',
      'subsidy': '助成金・補助金サポート',
      'accounting': '月次決算早期化',
      'cloud-accounting': 'クラウド会計システムへの移行支援',
      'labor': '労務管理内製化',
      'cost': 'コスト削減支援',
      'tax': '税制情報提供・税理士連携サポート',
      'ai': 'AI活用支援',
      'training': '研修サービス・人材育成',
      'system': 'システム開発受託',
      'other': 'その他'
    };
    
    const serviceName = serviceNames[data.service] || data.service || '未選択';
    
    // メール件名
    const subject = `【お問い合わせ】${data.name}様から - ${serviceName}`;
    
    // メール本文
    const body = `
お問い合わせフォームから以下の内容が送信されました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【お名前】
${data.name}

【メールアドレス】
${data.email}

【電話番号】
${data.phone || '未入力'}

【会社名・団体名】
${data.company || '未入力'}

【ご希望のサービス】
${serviceName}

【お問い合わせ内容】
${data.message}

【送信日時】
${data.timestamp || new Date().toLocaleString('ja-JP')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

このメールは自動送信されています。
`;
    
    // メール送信
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: body,
      replyTo: data.email // 返信先を送信者のメールアドレスに設定
    });
    
    // 成功レスポンス（CORSヘッダー付き）
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: '送信が完了しました'
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // エラーレスポンス（CORSヘッダー付き）
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: 'エラーが発生しました: ' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * OPTIONSリクエスト用（CORS preflight対応）
 */
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * GETリクエスト用（動作確認用）
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'OK',
      message: 'Google Apps Script is working'
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

