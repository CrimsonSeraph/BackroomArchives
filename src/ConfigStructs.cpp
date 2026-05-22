/*
 * Copyright (c) 2026 CrimsonSeraph(ltyy.leoyu@gmail.com)
 * SPDX-License-Identifier: GPL-3.0-only
 */

#include "ConfigStructs.h"

#include "DebugLog.h"

#include <nlohmann/json.hpp>
#include <string>

// ============================================
// MainConfig 方法实现
// ============================================

void MainConfig::to_json(nlohmann::json& j, const MainConfig& config) {
    j = nlohmann::json{
        {"app.name", config.app_name_},
        {"app.version", config.app_version_},
        {"app.debug", config.debug_mode_},
        {"app.log.console_level", config.console_level_},
        {"app.log.only_type_info", config.is_only_type_info_},
        {"app.web_pages.path", config.web_page_path_}
    };
}

void MainConfig::from_json(const nlohmann::json& j, MainConfig& config) {
    j.at("app.name").get_to(config.app_name_);
    j.at("app.version").get_to(config.app_version_);
    j.at("app.debug").get_to(config.debug_mode_);
    j.at("app.log.console_level").get_to(config.console_level_);
    j.at("app.log.only_type_info").get_to(config.is_only_type_info_);
    j.at("app.web_pages.path").get_to(config.web_page_path_);
}

bool MainConfig::validate() const {
    if (app_name_.empty()) {
        return false;
    }
    if (app_version_.empty()) {
        return false;
    }
    if(web_page_path_.empty()) {
        return false;
    }
    return true;
}

// ============================================
// UserConfig 方法实现
// ============================================

void UserConfig::to_json(nlohmann::json& j, const UserConfig& config) {
    j = nlohmann::json{
    };
}

void UserConfig::from_json(const nlohmann::json& j, UserConfig& config) {
}

bool UserConfig::validate() const {
    return true;
}
