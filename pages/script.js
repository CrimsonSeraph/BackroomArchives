/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

window.js_log = function (level, message) {
    if (window.api && window.api.jsConsole && typeof window.api.jsConsole.log === 'function') {
        window.api.jsConsole.log(level, message);
    } else {
        console.log(`[${level}] ${message}`);
    }
};

(function () {
    'use strict';

    // 等待所有资源
    window.addEventListener('load', async () => {
        // 检查 BackroomsAPI 是否可用
        if (typeof BackroomsAPI === 'undefined') {
            console.error('[Script] BackroomsAPI 未加载，请检查 backrooms-sdk.js 是否存在');
            return;
        }

        // 创建 API 实例
        const api = new BackroomsAPI();

        try {
            // 初始化 SDK，建立与 C++ 后端的通信通道
            await api.init();

            // 将 api 实例挂载到全局
            window.api = api;

            // 限定菜单容器
            const menuContainer = document.getElementById('main-menu');
            if (menuContainer) {
                bindButtons(menuContainer, api);
            } else {
                console.warn('[Script] 未找到 #main-menu，按钮绑定失败');
            }

            // 输出初始化成功的调试信息
            if (typeof js_log === 'function') {
                js_log('info', '[Script] BackroomsAPI 初始化成功，按钮事件已准备就绪');
            } else {
                console.log('[Script] BackroomsAPI 初始化成功，但 js_log 不可用，将使用 console 输出');
            }

            // 绑定按钮事件
            bindButtons(api);

        } catch (error) {
            console.error('[Script] BackroomsAPI 初始化失败:', error);
            // API 初始化失败时也绑定按钮，但使用降级日志
            bindButtonsFallback();
        }
    });

    /**
     * 绑定按钮的点击事件
     * @param {BackroomsAPI} api - 已初始化的 API 实例
     */
    function bindButtons(scope, api) {
        // 获取三个按钮
        const btnEnter = scope.querySelector('[data-action="start"]');
        const btnRecords = scope.querySelector('[data-action="records"]');
        const btnArchive = scope.querySelector('[data-action="archive"]');

        // 进入档案库（开始游戏）
        if (btnEnter) {
            btnEnter.addEventListener('click', async () => {
                if (typeof js_log === 'function') {
                    js_log('info', '[调试] 用户点击了「进入档案库」按钮');
                } else {
                    console.log('[调试] 用户点击了「进入档案库」按钮');
                }

                try {
                    await api.startGame();
                    if (typeof js_log === 'function') {
                        js_log('debug', '[调试] 已调用 startGame()，游戏开始流程已触发');
                    }
                } catch (err) {
                    if (typeof js_log === 'function') {
                        js_log('error', `[调试] 调用 startGame() 失败: ${err.message}`);
                    }
                    console.error('[Script] startGame 调用出错:', err);
                }
            });
        } else {
            console.warn('[Script] 未找到「进入档案库」按钮');
        }

        // 阅读记录
        if (btnRecords) {
            btnRecords.addEventListener('click', () => {
                if (typeof js_log === 'function') {
                    js_log('info', '[调试] 用户点击了「阅读记录」按钮 - 功能开发中，后续将展示档案记录');
                } else {
                    console.log('[调试] 用户点击了「阅读记录」按钮，功能待完善');
                }

                if (window.api && window.api.js_console) {
                    window.api.js_console.log('debug', '阅读记录按钮被触发，当前游戏状态: ' + (api.game_state ? '已连接' : '未连接'));
                }
            });
        } else {
            console.warn('[Script] 未找到「阅读记录」按钮');
        }

        // 可公开资料库
        if (btnArchive) {
            btnArchive.addEventListener('click', () => {
                if (typeof js_log === 'function') {
                    js_log('info', '[调试] 用户点击了「可公开资料库」按钮 - 准备加载实体档案');
                } else {
                    console.log('[调试] 用户点击了「可公开资料库」按钮，功能待完善');
                }

                setTimeout(() => {
                    if (typeof js_log === 'function') {
                        js_log('debug', '[调试] 资料库请求已记录，等待后续接口开放');
                    }
                }, 50);
            });
        } else {
            console.warn('[Script] 未找到「可公开资料库」按钮');
        }
    }

    /**
     * 降级绑定方案：当 BackroomsAPI 初始化失败时使用（仅 console 输出，保证页面不报错）
     */
    function bindButtonsFallback(scope) {
        const btnEnter = scope.querySelector('[data-action="start"]');
        const btnRecords = scope.querySelector('[data-action="records"]');
        const btnArchive = scope.querySelector('[data-action="archive"]');

        if (btnEnter) {
            btnEnter.addEventListener('click', () => {
                console.log('[降级调试] 点击了「进入档案库」（API 未初始化，仅记录）');
                alert('API 未就绪，请确保在 Qt WebEngine 环境中运行。');
            });
        }
        if (btnRecords) {
            btnRecords.addEventListener('click', () => {
                console.log('[降级调试] 点击了「阅读记录」（API 未初始化）');
            });
        }
        if (btnArchive) {
            btnArchive.addEventListener('click', () => {
                console.log('[降级调试] 点击了「可公开资料库」（API 未初始化）');
            });
        }
    }
})();
