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
            this._pending_calls = [];
            this._event_listeners = {};
            this._channel = null;

            // 暴露给外部的模块对象
            this.game_state = null;
            this.input_handler = null;
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
                    this.game_state = channel.objects.GameState;
                    this.input_handler = channel.objects.InputHandler;

                    // 连接所有模块的信号到内部事件总线
                    this._connect_signals();

                    this._ready = true;
                    // 执行所有等待队列中的回调
                    this._pending_calls.forEach(cb => cb());
                    this._pending_calls = [];

                    resolve(this);
                });
            });
        }

        // 连接信号
        _connect_signals() {
            // GameStateBridge 的 game_event 信号
            if (this.game_state && this.game_state.game_event) {
                this.game_state.game_event.connect((event_name, data) => {
                    this._emit_event(event_name, data);
                });
            }

            // InputHandlerBridge 的 key_processed 信号（假设）
            if (this.input_handler && this.input_handler.key_processed) {
                this.input_handler.key_processed.connect((action, data) => {
                    this._emit_event('input_' + action, data);
                });
            }
        }

        /**
         * 内部：触发事件，调用所有注册的回调
         * @param {string} event_name
         * @param {any} data
         */
        _emit_event(event_name, data) {
            const listeners = this._event_listeners[event_name];
            if (listeners) {
                listeners.forEach(cb => {
                    try {
                        cb(data);
                    } catch (e) {
                        console.error(`[BackroomsAPI] Error in event handler for "${event_name}":`, e);
                    }
                });
            }
        }

        /**
         * 外部：监听 C++ 发出的事件
         * @param {string} event_name 事件名称（如 'game_start', 'game_pause'）
         * @param {Function} callback 回调函数，参数为 data
         */
        on(event_name, callback) {
            if (typeof callback !== 'function') {
                console.warn('[BackroomsAPI] on() called with non-function callback');
                return;
            }
            if (!this._event_listeners[event_name]) {
                this._event_listeners[event_name] = [];
            }
            this._event_listeners[event_name].push(callback);
        }

        /**
         * 移除事件监听
         * @param {string} event_name
         * @param {Function} callback 若不提供则移除该事件的所有回调
         */
        off(event_name, callback) {
            if (!this._event_listeners[event_name]) return;
            if (callback) {
                const idx = this._event_listeners[event_name].indexOf(callback);
                if (idx !== -1) this._event_listeners[event_name].splice(idx, 1);
            } else {
                delete this._event_listeners[event_name];
            }
        }

        /**
         * 内部：等待 SDK 就绪后执行操作
         * @param {Function} fn
         * @returns {Promise}
         */
        _when_ready() {
            if (this._ready) return Promise.resolve();
            return new Promise(resolve => this._pending_calls.push(resolve));
        }

        // ===================== 游戏状态模块 =====================
        async start_game() {
            await this._when_ready();
            if (this.game_state) {
                this.game_state.start_game();
            } else {
                console.warn('[BackroomsAPI] game_state not available');
            }
        }

        async pause_game() {
            await this._when_ready();
            if (this.game_state) this.game_state.pause_game();
        }

        async resume_game() {
            await this._when_ready();
            if (this.game_state) this.game_state.resume_game();
        }

        async exit_game() {
            await this._when_ready();
            if (this.game_state) this.game_state.exit_game();
        }

        async is_game_running() {
            await this._when_ready();
            return this.game_state ? this.game_state.is_running : false;
        }

        // ===================== 按键输入 =====================
        /**
         * 将键盘事件发送给 C++ 处理
         * @param {string} key 键名（如 'ArrowUp', 'KeyW'）
         * @param {boolean} is_press true=按下，false=释放
         * @param {Object} modifiers 修饰键 {ctrl: false, shift: false, alt: false}
         */
        async send_key_event(key, is_press, modifiers = {}) {
            await this._when_ready();
            if (this.input_handler) {
                this.input_handler.handle_key_event(key, is_press, JSON.stringify(modifiers));
            } else {
                console.warn('[BackroomsAPI] input_handler not available');
            }
        }

        // 按键按下
        async key_down(key, modifiers = {}) {
            return this.send_key_event(key, true, modifiers);
        }

        // 按键释放
        async key_up(key, modifiers = {}) {
            return this.send_key_event(key, false, modifiers);
        }
    }
    global.BackroomsAPI = BackroomsAPI;
})(window);
