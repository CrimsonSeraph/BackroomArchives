/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

(function (global) {
    'use strict';
    /**
     * 全局 BackroomsAPI 类
     * 使用示例：
     *   const api = new BackroomsAPI();
     *   api.init().then(() => {
     *       api.on('game_start', () => console.log('Game started'));
     *       api.start_game();
     *   });
     */
    class BackroomsAPI {
        constructor() {
            this._ready = false;
            this._pendingCalls = [];
            this._eventListeners = {};
            this._channel = null;

            // 暴露给外部的模块对象
            this.gameState = null;
            this.inputHandler = null;
            this.jsConsole = null;
        }

        /**
         * 初始化 SDK，建立 QWebChannel 连接
         * @returns {Promise<BackroomsAPI>}
         */
        init() {
            return new Promise((resolve, reject) => {
                // 检查 qt.webChannelTransport 是否可用
                if (!global.qt || !global.qt.webChannelTransport) {
                    reject(new Error('qt.webChannelTransport not available. Make sure QWebChannel is set up.'));
                    return;
                }

                // 创建 QWebChannel
                new QWebChannel(global.qt.webChannelTransport, (channel) => {
                    this._channel = channel;

                    // 获取 C++ 暴露的对象
                    this.gameState = channel.objects.GameState;
                    this.inputHandler = channel.objects.InputHandler;
                    this.jsConsole = channel.objects.JsConsole;

                    // 连接所有模块的信号到内部事件总线
                    this._connectSignals();

                    this._ready = true;
                    // 执行所有等待队列中的回调
                    this._pendingCalls.forEach(cb => cb());
                    this._pendingCalls = [];

                    resolve(this);
                });
            });
        }

        // 连接信号
        _connectSignals() {
            // GameStateBridge 的 game_event 信号
            if (this.gameState && this.gameState.game_event) {
                this.gameState.game_event.connect((eventName, data) => {
                    this._emitEvent(eventName, data);
                });
            }

            // InputHandlerBridge 的 key_processed 信号（假设）
            if (this.inputHandler && this.inputHandler.key_processed) {
                this.inputHandler.key_processed.connect((action, data) => {
                    this._emitEvent('input_' + action, data);
                });
            }
        }

        /**
         * 内部：触发事件，调用所有注册的回调
         * @param {string} eventName
         * @param {any} data
         */
        _emitEvent(eventName, data) {
            const listeners = this._eventListeners[eventName];
            if (listeners) {
                listeners.forEach(cb => {
                    try {
                        cb(data);
                    } catch (e) {
                        console.error(`[BackroomsAPI] Error in event handler for "${eventName}":`, e);
                    }
                });
            }
        }

        /**
         * 外部：监听 C++ 发出的事件
         * @param {string} eventName 事件名称（如 'game_start', 'game_pause'）
         * @param {Function} callback 回调函数，参数为 data
         */
        on(eventName, callback) {
            if (typeof callback !== 'function') {
                console.warn('[BackroomsAPI] on() called with non-function callback');
                return;
            }
            if (!this._eventListeners[eventName]) {
                this._eventListeners[eventName] = [];
            }
            this._eventListeners[eventName].push(callback);
        }

        /**
         * 移除事件监听
         * @param {string} eventName
         * @param {Function} callback 若不提供则移除该事件的所有回调
         */
        off(eventName, callback) {
            if (!this._eventListeners[eventName]) return;
            if (callback) {
                const idx = this._eventListeners[eventName].indexOf(callback);
                if (idx !== -1) this._eventListeners[eventName].splice(idx, 1);
            } else {
                delete this._eventListeners[eventName];
            }
        }

        /**
         * 内部：等待 SDK 就绪后执行操作
         * @param {Function} fn
         * @returns {Promise}
         */
        _whenReady() {
            if (this._ready) return Promise.resolve();
            return new Promise(resolve => this._pendingCalls.push(resolve));
        }

        // ===================== 游戏状态模块 =====================
        async startGame() {
            await this._whenReady();
            if (this.gameState) {
                this.gameState.start_game();
            } else {
                console.warn('[BackroomsAPI] gameState not available');
            }
        }

        async pauseGame() {
            await this._whenReady();
            if (this.gameState) this.gameState.pause_game();
        }

        async resumeGame() {
            await this._whenReady();
            if (this.gameState) this.gameState.resume_game();
        }

        async exitGame() {
            await this._whenReady();
            if (this.gameState) this.gameState.exit_game();
        }

        async isGameRunning() {
            await this._whenReady();
            return this.gameState ? this.gameState.is_running : false;
        }

        // ===================== 按键输入 =====================
        /**
         * 将键盘事件发送给 C++ 处理
         * @param {string} key 键名
         * @param {boolean} isPress true=按下，false=释放
         * @param {Object} modifiers 修饰键 {ctrl: false, shift: false, alt: false}
         */
        async sendKeyEvent(key, isPress, modifiers = {}) {
            await this._whenReady();
            if (this.inputHandler) {
                this.inputHandler.handle_key_event(key, isPress, JSON.stringify(modifiers));
            } else {
                console.warn('[BackroomsAPI] inputHandler not available');
            }
        }

        // 按键按下
        async keyDown(key, modifiers = {}) {
            return this.sendKeyEvent(key, true, modifiers);
        }

        // 按键释放
        async keyUp(key, modifiers = {}) {
            return this.sendKeyEvent(key, false, modifiers);
        }
    }
    global.BackroomsAPI = BackroomsAPI;

    // 全局日志函数
    function jsLog(level, message) {
        if (window.api && window.api.jsConsole) {
            window.api.jsConsole.log(level, message);
        } else {
            console.warn("JsConsole not available");
        }
    }
})(window);
