/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#include "BackroomArchives.h"
#include "AppConfig.h"
#include "DebugLog.h"
#include "GameStateBridge.h"
#include "InputHandlerBridge.h"
#include "JsConsoleBridge.h"

#include <QCoreApplication>
#include <QDir>
#include <QFile>
#include <QString>
#include <QWebChannel>
#include <QWebEngineView>
#include <QWidget>

BackroomArchives::BackroomArchives(QWidget *parent) : QWidget(parent) {
    LOG_MODULE("BackroomArchives", "BackroomArchives", LOG_DEBUG, "开始初始化窗口");
    ui.setupUi(this);

    init_bridge();
    init_index_page();
}

BackroomArchives::~BackroomArchives() {}

void BackroomArchives::init_index_page() {
    auto &config = AppConfig::instance();
    std::string web_page_path = config.get_value<std::string>("app.web_pages.path", "./pages");
    QString base_dir = QCoreApplication::applicationDirPath(); // 最后不含 '/'
    QString relative_or_absolute = QString::fromStdString(web_page_path);
    QString absolute_base_path = QDir(base_dir).absoluteFilePath(relative_or_absolute);
    QString canonical_path = QDir::cleanPath(absolute_base_path);
    QString full_html_path = QDir(canonical_path).absoluteFilePath("index.html");

    // 获取相对于 base_dir 的路径用于日志
    auto rel_path_for_log = [&](const QString &absPath) -> QString { return QDir(base_dir).relativeFilePath(absPath); };

    if (!QFile::exists(full_html_path)) {
        ui.main_webview->setHtml("<html><body><h1>Error</h1><p>File not found: " + full_html_path +
                                 "</p></body></html>");
        LOG_MODULE("BackroomArchives", "init_index_page", LOG_ERROR,
                   "主页文件不存在: " << rel_path_for_log(full_html_path).toStdString());
    }
    else if (!QFileInfo(full_html_path).isReadable()) {
        ui.main_webview->setHtml("<html><body><h1>Error</h1><p>Permission denied: " + full_html_path +
                                 "</p></body></html>");
        LOG_MODULE("BackroomArchives", "init_index_page", LOG_ERROR,
                   "主页文件不可读: " << rel_path_for_log(full_html_path).toStdString());
    }
    else {
        LOG_MODULE("BackroomArchives", "init_index_page", LOG_INFO,
                   "加载主页，路径: " << rel_path_for_log(full_html_path).toStdString());
        ui.main_webview->setUrl(QUrl::fromLocalFile(full_html_path));
    }
}

void BackroomArchives::init_bridge() {
    LOG_MODULE("BackroomArchives", "init_bridge", LOG_DEBUG, "初始化游戏状态桥接");
    m_game_state_bridge = new GameStateBridge(this);
    m_input_handler_bridge = new InputHandlerBridge(this);
    m_js_console_bridge = new JsConsoleBridge(this);

    // 将桥接对象暴露给 JavaScript
    m_channel = new QWebChannel(this);
    m_channel->registerObject("GameState", m_game_state_bridge);
    m_channel->registerObject("InputHandler", m_input_handler_bridge);
    m_channel->registerObject("JsConsole", m_js_console_bridge);

    ui.main_webview->page()->setWebChannel(m_channel);
}
