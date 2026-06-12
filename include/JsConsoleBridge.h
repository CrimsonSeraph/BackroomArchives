/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#pragma once

#include <QObject>
#include <QString>

class JsConsoleBridge : public QObject {
    Q_OBJECT

public:
    explicit JsConsoleBridge(QObject *parent = nullptr);

public slots:
    void log(const QString &level, const QString &message);
};
