/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#pragma once

#include "GameStateBridge.h"
#include "InputHandlerBridge.h"
#include "JsConsoleBridge.h"

#include "../ui_BackroomArchives.h"
#include <QWebChannel>
#include <QWidget>

// ============================================
// BackroomArchives - 主窗口类
// ============================================
class BackroomArchives : public QWidget {
    Q_OBJECT

public:
    // -------------------- 构造/析构 --------------------
    explicit BackroomArchives(QWidget *parent = nullptr);
    ~BackroomArchives();

private:
    Ui::BackroomArchives ui;
    GameStateBridge *m_game_state_bridge;
    InputHandlerBridge *m_input_handler_bridge;
    JsConsoleBridge *m_js_console_bridge;
    QWebChannel *m_channel;

    void init_index_page();
    void init_bridge();
};
