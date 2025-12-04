// ナビゲーションメニューのトグル
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// ナビゲーションリンクをクリックしたときにメニューを閉じる
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// スクロール時のナビゲーションバーのスタイル変更
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    }
    
    lastScroll = currentScroll;
});

// スムーススクロール（同じページ内のアンカーリンクのみ）
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // 同じページ内のアンカーリンクの場合のみ処理
        if (href.startsWith('#') && href.length > 1) {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offsetTop = target.offsetTop - 80; // ナビゲーションバーの高さを考慮
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// ページ読み込み時にアンカーリンクを処理（他のページから遷移した場合）
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;
    if (hash) {
        const target = document.querySelector(hash);
        if (target) {
            setTimeout(() => {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
});

// フォーム送信処理
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // フォームデータの取得
    const formData = new FormData(contactForm);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company: formData.get('company'),
        service: formData.get('service'),
        message: formData.get('message'),
        privacy: formData.get('privacy')
    };
    
    // バリデーション
    if (!data.name || !data.email || !data.message || !data.privacy) {
        alert('必須項目を入力してください。');
        return;
    }
    
    // メールアドレスのバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        alert('正しいメールアドレスを入力してください。');
        return;
    }
    
    // 送信ボタンを無効化
    submitButton.disabled = true;
    submitButton.textContent = '送信中...';
    
    try {
        // Google Apps ScriptのWebアプリURLに送信
        const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyM8h7qkMP4yhszBDBOoqhIpmEZN7zefiZWtASF_pqIDdjj1bYste8Xx-1GafZjtjzn/exec';
        
        // GASのWebアプリはCORS制限があるため、FormDataを使用して送信
        // これにより、no-corsモードでもデータを送信できます
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('phone', data.phone || '');
        formData.append('company', data.company || '');
        formData.append('service', data.service || '');
        formData.append('message', data.message);
        formData.append('timestamp', new Date().toISOString());
        
        // no-corsモードで送信（CORSエラーを回避）
        await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });
        
        // no-corsモードではレスポンスを確認できないため、
        // 送信は成功したものとして扱います
        // 実際の送信結果はメールで確認してください
        alert('お問い合わせありがとうございます。\n内容を確認次第、ご連絡いたします。');
        
        // フォームをリセット
        contactForm.reset();
    } catch (error) {
        console.error('送信エラー:', error);
        alert('送信に失敗しました。しばらく時間をおいて再度お試しください。');
    } finally {
        // 送信ボタンを再有効化
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// FAQアコーディオン機能
document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // 他のFAQを閉じる
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // クリックしたFAQを開閉
            if (isActive) {
                item.classList.remove('active');
            } else {
                item.classList.add('active');
            }
        });
    });
});


