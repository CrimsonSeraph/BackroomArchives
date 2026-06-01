/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#include "DebugLog.h"
#include "GameStateBridge.h"

GameStateBridge::GameStateBridge(QObject* parent)
    : QObject(parent)
{
    LOG_MODULE("GameStateBridge", "GameStateBridge", LOG_DEBUG, "GameStateBridge 构造完成");
}

bool GameStateBridge::is_started() const {
    LOG_MODULE("GameStateBridge", "is_started", LOG_DEBUG, "调用, 当前状态: is_started=" << m_is_started);
    return m_is_started;
}

bool GameStateBridge::is_running() const {
    LOG_MODULE("GameStateBridge", "is_running", LOG_DEBUG, "调用, 当前状态: is_running=" << m_is_running);
    return m_is_running;
}

void GameStateBridge::start_game() {
    LOG_MODULE("GameStateBridge", "start_game", LOG_DEBUG, "调用, 当前状态: is_started=" << m_is_started << ", is_running=" << m_is_running);

    if (m_is_started || m_is_running) {
        LOG_MODULE("GameStateBridge", "start_game", LOG_WARN, "游戏已经启动或正在运行，忽略启动请求");
        return;
    }
    m_is_started = true;
    m_is_running = true;
    emit started_changed(true);
    emit running_changed(true);
    emit game_event("game_start", {});
    LOG_MODULE("GameStateBridge", "start_game", LOG_INFO, "游戏启动信息发送");
}

void GameStateBridge::pause_game() {
    LOG_MODULE("GameStateBridge", "pause_game", LOG_DEBUG, "调用, 当前状态: is_started=" << m_is_started << ", is_running=" << m_is_running);

    if (!m_is_started || !m_is_running) {
        LOG_MODULE("GameStateBridge", "pause_game", LOG_WARN, "游戏未启动或未运行，无法暂停");
        return;
    }
    m_is_running = false;
    emit running_changed(false);
    emit game_event("game_pause", {});
    LOG_MODULE("GameStateBridge", "pause_game", LOG_INFO, "游戏已暂停");
}

void GameStateBridge::resume_game() {
    LOG_MODULE("GameStateBridge", "resume_game", LOG_DEBUG, "调用, 当前状态: is_started=" << m_is_started << ", is_running=" << m_is_running);

    if (!m_is_started || m_is_running) {
        LOG_MODULE("GameStateBridge", "resume_game", LOG_WARN, "游戏未启动或已在运行，无法恢复");
        return;
    }
    m_is_running = true;
    emit running_changed(true);
    emit game_event("game_resume", {});
    LOG_MODULE("GameStateBridge", "resume_game", LOG_INFO, "游戏已恢复");
}

void GameStateBridge::exit_game() {
    LOG_MODULE("GameStateBridge", "exit_game", LOG_DEBUG, "调用, 当前状态: is_started=" << m_is_started << ", is_running=" << m_is_running);

    if (!m_is_started) {
        LOG_MODULE("GameStateBridge", "exit_game", LOG_WARN, "游戏未启动，无需退出");
        return;
    }
    m_is_started = false;
    m_is_running = false;
    emit started_changed(false);
    emit running_changed(false);
    emit game_event("game_exit", {});
    LOG_MODULE("GameStateBridge", "exit_game", LOG_INFO, "游戏已退出");
}
