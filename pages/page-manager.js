/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

class PageManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`PageManager: 找不到容器元素 #${containerId}`);
        }
        this.currentPageId = null;
        this.currentDestroy = null;
        // 记录已加载的外部脚本
        this.loadedScripts = new Set();
        // 收集页面中已有的 script src
        document.querySelectorAll('script[src]').forEach(script => {
            this.loadedScripts.add(script.src);
        });
    }

    async load(pageId, pageUrl) {
        // 使用统一的日志输出
        const log = (level, ...args) => {
            if (typeof js_log === 'function') {
                js_log(level, ...args);
            } else {
                switch (level) {
                    case 'error': console.error(...args); break;
                    case 'warn': console.warn(...args); break;
                    default: console.log(...args);
                }
            }
        };

        log('log', `[Load] 开始加载 ${pageUrl}`);

        // 销毁当前页面
        if (this.currentDestroy) {
            try {
                this.currentDestroy();
            } catch (e) {
                log('warn', `[PageManager] destroy error for ${this.currentPageId}:`, e);
            }
        }

        // 清空容器
        this.container.innerHTML = '';

        // 拉取子页面 HTML
        let html;
        try {
            const res = await fetch(pageUrl);
            log('log', `[PageManager] 响应状态: ${res.status}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            html = await res.text();
        } catch (err) {
            log('error', `[PageManager] 加载失败:`, err);
            log('error', `[PageManager] Name: ${err.name}`);
            log('error', `[PageManager] Message: ${err.message}`);
            log('error', `[PageManager] Stack: ${err.stack}`);
            this.container.innerHTML = `<div style="color:red;">加载失败: ${err.message}</div>`;
            return;
        }

        // 解析 HTML
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const rootId = `${pageId}-root`;
        const newContent = doc.getElementById(rootId);
        if (!newContent) {
            log('error', `[PageManager] 未找到根容器 #${rootId}`);
            this.container.innerHTML = `<div class="error">未找到根容器 #${rootId}</div>`;
            return;
        }

        // 插入新内容
        this.container.appendChild(newContent);

        // 处理脚本
        const scripts = doc.querySelectorAll('script');
        const externalPromises = [];

        for (const oldScript of scripts) {
            if (oldScript.src) {
                // 外部脚本：去重
                if (this.loadedScripts.has(oldScript.src)) {
                    continue;
                }
                const promise = new Promise((resolve, reject) => {
                    const newScript = document.createElement('script');
                    newScript.src = oldScript.src;
                    newScript.onload = () => {
                        this.loadedScripts.add(oldScript.src);
                        resolve();
                    };
                    newScript.onerror = reject;
                    document.head.appendChild(newScript);
                });
                externalPromises.push(promise);
            } else {
                // 先将内联脚本暂存，稍后统一执行
                if (!this._pendingInlineScripts) this._pendingInlineScripts = [];
                this._pendingInlineScripts.push(oldScript.textContent);
            }
        }

        // 等待所有外部脚本加载完成
        await Promise.all(externalPromises);

        // 执行暂存的内联脚本（按原始顺序）
        if (this._pendingInlineScripts && this._pendingInlineScripts.length) {
            for (const code of this._pendingInlineScripts) {
                const inlineScript = document.createElement('script');
                inlineScript.textContent = code;
                document.body.appendChild(inlineScript);
                inlineScript.remove();
            }
            delete this._pendingInlineScripts;
        }

        // 调用子页面的 init 函数
        const moduleName = `Page${pageId.charAt(0).toUpperCase() + pageId.slice(1)}`;
        const pageModule = window[moduleName];
        const containerEl = document.getElementById(rootId);

        if (pageModule && typeof pageModule.init === 'function') {
            pageModule.init(containerEl);
            // 保存 destroy 函数
            this.currentDestroy = () => {
                if (typeof pageModule.destroy === 'function') {
                    pageModule.destroy(containerEl);
                }
                // 额外清理 DynamicTextEngine 中该容器注册的动效
                if (window.DynamicTextEngine && typeof window.DynamicTextEngine.destroy === 'function') {
                    window.DynamicTextEngine.destroy(containerEl);
                }
            };
        } else {
            log('warn', `[PageManager] 未找到 ${moduleName}.init，跳过初始化`);
            this.currentDestroy = null;
        }

        // 刷新动态文本引擎
        if (window.DynamicTextEngine && typeof window.DynamicTextEngine.refresh === 'function') {
            window.DynamicTextEngine.refresh();
        }

        this.currentPageId = pageId;
    }
}

// 等待主页面脚本加载完成后启动管理器
window.addEventListener('load', () => {
    window.pageManager = new PageManager('page-root');
});
