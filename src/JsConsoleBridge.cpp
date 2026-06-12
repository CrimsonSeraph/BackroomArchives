/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#include "JsConsoleBridge.h"
#include "DebugLog.h"

JsConsoleBridge::JsConsoleBridge(QObject *parent) : QObject(parent) {
    LOG_MODULE("JsConsoleBridge", "JsConsoleBridge", LOG_DEBUG, "构造完成");
}

void JsConsoleBridge::log(const QString &level, const QString &message) {
    LogLevel log_level = LOG_DEBUG;
    QString level_lower = level.toLower();

    if (level_lower == "debug")
        log_level = LOG_DEBUG;
    else if (level_lower == "info")
        log_level = LOG_INFO;
    else if (level_lower == "warn")
        log_level = LOG_WARN;
    else if (level_lower == "error")
        log_level = LOG_ERROR;
    else
        log_level = LOG_DEBUG; // 默认 debug

    LOG_MODULE("|JS|JsConsoleBridge", "log", log_level, message.toStdString());
}
