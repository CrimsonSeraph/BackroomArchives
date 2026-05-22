/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#include "AppConfig.h"
#include "BackroomArchives.h"
#include "DebugLog.h"

#include <QDir>
#include <QFile>
#include <QString>
#include <QWebEngineView>
#include <QWidget>

BackroomArchives::BackroomArchives(QWidget* parent)
    : QWidget(parent) {
    LOG_MODULE("BackroomArchives", "BackroomArchives", LOG_DEBUG, "开始初始化窗口");
    ui.setupUi(this);

    init_index_page();
}

BackroomArchives::~BackroomArchives() {}

void BackroomArchives::init_index_page() {
    auto& config = AppConfig::instance();
    std::string web_page_path = config.get_value<std::string>("app.web_pages.path", "./pages");
    QString base_dir = QCoreApplication::applicationDirPath();   // 最后不含 '/' 
    QString relative_or_absolute = QString::fromStdString(web_page_path);
    QString absolute_base_path = QDir(base_dir).absoluteFilePath(relative_or_absolute);
    QString canonical_path = QDir::cleanPath(absolute_base_path);
    QString full_html_path = QDir(canonical_path).absoluteFilePath("index.html");

    if (!QFile::exists(full_html_path)) {
        ui.main_webview->setHtml("<html><body><h1>Error</h1><p>File not found: " + full_html_path + "</p></body></html>");
        LOG_MODULE("BackroomArchives", "init_index_page", LOG_ERROR, "主页文件不存在: " << full_html_path.toStdString());
    }
    else if (!QFileInfo(full_html_path).isReadable()) {
        ui.main_webview->setHtml("<html><body><h1>Error</h1><p>Permission denied: " + full_html_path + "</p></body></html>");
        LOG_MODULE("BackroomArchives", "init_index_page", LOG_ERROR, "主页文件不可读: " << full_html_path.toStdString());
    }
    else {
        LOG_MODULE("BackroomArchives", "init_index_page", LOG_INFO, "加载主页，路径: " << full_html_path.toStdString());
        ui.main_webview->setUrl(QUrl::fromLocalFile(full_html_path));
    }
}
