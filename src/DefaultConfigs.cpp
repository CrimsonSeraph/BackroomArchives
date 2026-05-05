/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#include "DefaultConfigs.h"

#include "DebugLog.h"

#include <nlohmann/json.hpp>
#include <string>

 // ============================================
 // 默认配置工厂实现
 // ============================================

nlohmann::json DefaultConfigs::get_default_config(const std::string& config_name) {
    if (config_name == "main") {
        return {
            {"__priority", 0},
            {"app", {
                {"name", "BackroomsArchives"},
                {"version", "0.6.0"},
                {"debug", false},
                {"log", {
                    {"console_level", 0},
                    {"only_type_info", false},
                }}
            }},
            {"version", "1.0"},
            {"BackroomsArchives", "BackroomsArchives"}
        };
    }
    else if (config_name == "user") {
        return {
            {"__priority", 1},
            {"app", {
            }},
            {"version", "1.0"},
            {"BackroomsArchives", "BackroomsArchives"}
        };
    }
    else {
        // 通用默认配置
        return {
            {"__priority", 0},
            {"app", {}},
            {"version", "1.0"},
            {"BackroomsArchives", "BackroomsArchives"}
        };
    }
}
