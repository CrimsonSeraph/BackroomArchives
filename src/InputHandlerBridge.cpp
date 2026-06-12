/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#include "InputHandlerBridge.h"
#include "DebugLog.h"

#include <QJsonDocument>
#include <QJsonObject>
#include <QVariantMap>

InputHandlerBridge::InputHandlerBridge(QObject *parent) : QObject(parent) {
    LOG_MODULE("InputHandlerBridge", "InputHandlerBridge", LOG_DEBUG, "构造完成");
}

void InputHandlerBridge::handle_key_event(const QString &key, bool is_press, const QString &modifiers_json) {
    LOG_MODULE("InputHandlerBridge", "handle_key_event", LOG_DEBUG,
               "key=" << key.toStdString() << ", is_press=" << is_press
                      << ", modifiers=" << modifiers_json.toStdString());

    QJsonDocument doc = QJsonDocument::fromJson(modifiers_json.toUtf8());
    QVariantMap modifiers = doc.object().toVariantMap();

    QString action = map_key_to_action(key, is_press, modifiers);
    if (!action.isEmpty()) {
        QVariantMap data;
        data["key"] = key;
        data["is_press"] = is_press;
        data["modifiers"] = modifiers;
        emit key_processed(action, data);
    }
}

QString InputHandlerBridge::map_key_to_action(const QString &key, bool is_press, const QVariantMap &modifiers) {
    // 暂时忽略释放
    if (!is_press)
        return QString();

    // 菜单/暂停键
    if (key == "Escape")
        return "pause";
    return QString();
}
