/**
 * トースト通知ユーティリティ
 * 使い方: showToast('メッセージ') または showToast('メッセージ', 'error')
 * type: 'success' | 'error' | 'info' | 'warning'
 */

(function () {
  // CSSを一度だけ注入
  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style')
    style.id = 'toast-style'
    style.textContent = `
      #toast-container {
        position: fixed;
        bottom: 1.5rem;
        left: 1rem;
        right: 1rem;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        pointer-events: none;
        max-width: 420px;
        margin: 0 auto;
        box-sizing: border-box;
      }
      .toast {
        background: #323232;
        color: white;
        padding: 0.75rem 1.2rem;
        border-radius: 8px;
        font-size: 0.9rem;
        line-height: 1.5;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        opacity: 0;
        transform: translateY(12px);
        transition: opacity 0.25s ease, transform 0.25s ease;
        pointer-events: auto;
        width: 100%;
        text-align: center;
        white-space: pre-line;
      }
      .toast.show {
        opacity: 1;
        transform: translateY(0);
      }
      .toast.toast-success { background: #2e7d32; }
      .toast.toast-error   { background: #c62828; }
      .toast.toast-warning { background: #e65100; }
      .toast.toast-info    { background: #1565c0; }
    `
    document.head.appendChild(style)
  }

  // コンテナを一度だけ作成
  function getContainer() {
    let container = document.getElementById('toast-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'toast-container'
      document.body.appendChild(container)
    }
    return container
  }

  window.showToast = function (message, type = 'default', duration = 3000) {
    const container = getContainer()
    const toast = document.createElement('div')
    toast.className = `toast${type !== 'default' ? ` toast-${type}` : ''}`
    toast.textContent = message
    container.appendChild(toast)

    // アニメーション開始
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'))
    })

    // 自動で消える
    setTimeout(() => {
      toast.classList.remove('show')
      toast.addEventListener('transitionend', () => toast.remove(), { once: true })
    }, duration)
  }
})()
