/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#pragma once

#include <QObject>

class InputHandlerBridge : public QObject
{
    Q_OBJECT
public:
    explicit InputHandlerBridge(QObject* parent = nullptr);

public slots:
    void handle_key_event(const QString& key, bool is_press, const QString& modifiers_json);

signals:
    void key_processed(const QString& action, const QVariantMap& data);

private:
    QString map_key_to_action(const QString& key, bool is_press, const QVariantMap& modifiers);

};
