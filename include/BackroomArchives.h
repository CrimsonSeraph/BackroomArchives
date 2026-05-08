/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#pragma once

class BackroomArchives {
public:
    static BackroomArchives& instance();

    BackroomArchives(const BackroomArchives&) = delete;
    BackroomArchives& operator=(const BackroomArchives&) = delete;

    void start_game();

private:
    BackroomArchives();
    ~BackroomArchives();

};
