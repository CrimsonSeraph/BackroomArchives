/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

class PageManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
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
        // 销毁当前页面
        if (this.currentDestroy) {
            try {
                this.currentDestroy();
            } catch (e) {
                console.warn(`[PageManager] destroy error for ${this.currentPageId}:`, e);
            }
        }

        // 清空容器
        this.container.innerHTML = '';

        // 拉取子页面 HTML
        let html;
        try {
            const res = await fetch(pageUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            html = await res.text();
        } catch (err) {
            this.container.innerHTML = `<div class="error">加载失败: ${err.message}</div>`;
            return;
        }

        // 解析 HTML
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const rootId = `${pageId}-root`;
        const newContent = doc.getElementById(rootId);
        if (!newContent) {
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
                // 内联脚本：立即执行
                const inlineScript = document.createElement('script');
                inlineScript.textContent = oldScript.textContent;
                document.body.appendChild(inlineScript);
                // 执行后立即移除
                inlineScript.remove();
            }
        }

        // 等待所有外部脚本加载完成
        await Promise.all(externalPromises);

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
            console.warn(`[PageManager] 未找到 ${moduleName}.init，跳过初始化`);
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
    window.pageManager = new PageManager('page-container');
});
