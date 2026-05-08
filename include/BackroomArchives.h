/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#pragma once

#include <QWidget>
#include "../ui_BackroomArchives.h"

 // ============================================
 // BackroomArchives - 主窗口类
 // ============================================
class BackroomArchives : public QWidget {
    Q_OBJECT

public:
    // -------------------- 构造/析构 --------------------
    explicit BackroomArchives(QWidget* parent = nullptr);
    ~BackroomArchives();
    
private:
    Ui::BackroomArchives ui;

};
