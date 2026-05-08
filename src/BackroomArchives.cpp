/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#include "BackroomArchives.h"
#include "DebugLog.h"

BackroomArchives::BackroomArchives(QWidget* parent)
    : QWidget(parent) {
    LOG_MODULE("BackroomArchives", "BackroomArchives", LOG_DEBUG, "开始初始化窗口");
    ui.setupUi(this);
}

BackroomArchives::~BackroomArchives() {
}
