/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#include "AppConfig.h"
#include "BackroomArchives.h"
#include "Console.h"
#include "DebugLog.h"

#include <iostream>

int main() {
    BackroomArchives& game = BackroomArchives::instance();
    game.start_game();
    std::cout << "Hello, Backrooms!" << std::endl;
    return 0;
}
