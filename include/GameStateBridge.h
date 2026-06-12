/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#pragma once

#include <QObject>
#include <QString>
#include <QVariantMap>

class GameStateBridge : public QObject {
    Q_OBJECT
    Q_PROPERTY(bool is_running READ is_running NOTIFY running_changed)
    Q_PROPERTY(bool is_started READ is_started NOTIFY started_changed)

public:
    explicit GameStateBridge(QObject *parent = nullptr);

    bool is_started() const;
    bool is_running() const;

public slots:
    void start_game();
    void pause_game();
    void resume_game();
    void exit_game();

signals:
    void running_changed(bool is_running);
    void started_changed(bool is_started);
    void game_event(const QString &event, const QVariantMap &data);

private:
    bool m_is_started = false;
    bool m_is_running = false;
};
