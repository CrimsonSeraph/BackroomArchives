cmake_minimum_required(VERSION 3.16)
project(BackroomsArchives LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(MSVC)
    add_compile_options("/utf-8")
endif()

# 选择要构建的档案版本（默认为 wikidot）
set(ARCHIVE_VERSION "wikidot" CACHE STRING "Which archive version to build (subdir under archives/)")

# 是否构建档案插件（若为 OFF 则只生成 core 包）
option(BUILD_ARCHIVES "Build level plugins from archives/" ON)

# -------------------- 第三方库 --------------------
include(FetchContent)
set(NLOHMANN_JSON_INCLUDE_DIR "${CMAKE_CURRENT_BINARY_DIR}/include")
set(NLOHMANN_JSON_HEADER "${NLOHMANN_JSON_INCLUDE_DIR}/nlohmann/json.hpp")
if(NOT EXISTS "${NLOHMANN_JSON_HEADER}")
    file(DOWNLOAD
        "https://github.com/nlohmann/json/releases/download/v3.12.0/json.hpp"
        "${NLOHMANN_JSON_HEADER}"
        SHOW_PROGRESS
    )
endif()
add_library(nlohmann_json INTERFACE)
target_include_directories(nlohmann_json INTERFACE "${NLOHMANN_JSON_INCLUDE_DIR}")

# -------------------- 定义插件 API 接口库 --------------------
add_library(BackroomsAPI INTERFACE)
target_include_directories(BackroomsAPI INTERFACE include/plugin_api)
target_link_libraries(BackroomsAPI INTERFACE nlohmann_json)
# 可根据需要添加其他系统库（如 pthread）

# -------------------- 本体可执行文件 --------------------
set(PROJECT_SOURCES
    main.cpp

    src/AppConfig.cpp
    include/AppConfig.h
    include/AppConfig_impl.hpp
    include/AppConfig_utils.hpp

    src/ConfigManager.cpp
    include/ConfigManager.h
    include/ConfigManager_impl.hpp

    src/ConfigStructs.cpp
    include/ConfigStructs.h

    src/Console.cpp
    include/Console.h

    src/DebugLog.cpp
    include/DebugLog.h
    include/DebugLog_utils.hpp

    src/DefaultConfigs.cpp
    include/DefaultConfigs.h

    src/MultiConfigManager.cpp
    include/MultiConfigManager.h
    include/MultiConfigManager_impl.hpp
)
add_executable(${PROJECT_NAME} ${PROJECT_SOURCES})
target_link_libraries(${PROJECT_NAME} PRIVATE nlohmann_json BackroomsAPI)
target_include_directories(${PROJECT_NAME} PRIVATE include)

# Windows 控制台 & macOS 不生成 bundle
if(WIN32)
    set_target_properties(${PROJECT_NAME} PROPERTIES WIN32_EXECUTABLE FALSE)
elseif(APPLE)
    set_target_properties(${PROJECT_NAME} PROPERTIES MACOSX_BUNDLE FALSE)
endif()

# -------------------- 插件扫描与构建 --------------------
if(BUILD_ARCHIVES)
    set(ARCHIVES_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/archives/${ARCHIVE_VERSION}")
    if(EXISTS "${ARCHIVES_ROOT}")
	set(ARCHIVE_VERSION "${ARCHIVE_VERSION}" CACHE STRING "Archive version" FORCE)
	add_subdirectory(archives/${ARCHIVE_VERSION} ${CMAKE_CURRENT_BINARY_DIR}/archive_build)
    else()
        message(WARNING "Archives directory not found: ${ARCHIVES_ROOT}")
    endif()
endif()

# -------------------- 安装规则（组件化）--------------------
install(TARGETS ${PROJECT_NAME}
    RUNTIME DESTINATION . COMPONENT core
    LIBRARY DESTINATION . COMPONENT core
)
install(DIRECTORY config/ DESTINATION config COMPONENT core)
install(DIRECTORY texts/ DESTINATION texts COMPONENT core)

# -------------------- CPack 组件打包配置 --------------------
set(CPACK_COMPONENTS_ALL core archives)

# 包名根据档案版本变化
set(CPACK_PACKAGE_NAME "BackroomsArchives-${ARCHIVE_VERSION}")
set(CPACK_PACKAGE_VENDOR "CrimsonSeraph")
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "Modular Backrooms text game (${ARCHIVE_VERSION} archive)")
set(CPACK_PACKAGE_VERSION_MAJOR "0")
set(CPACK_PACKAGE_VERSION_MINOR "1")
set(CPACK_PACKAGE_VERSION_PATCH "0")
set(CPACK_PACKAGE_VERSION "${CPACK_PACKAGE_VERSION_MAJOR}.${CPACK_PACKAGE_VERSION_MINOR}.${CPACK_PACKAGE_VERSION_PATCH}")

set(CPACK_COMPONENT_CORE_DISPLAY_NAME "Core")
set(CPACK_COMPONENT_ARCHIVES_DISPLAY_NAME "${ARCHIVE_VERSION} Archives")

set(CPACK_ARCHIVE_COMPONENT_INSTALL ON)
if(WIN32)
    set(CPACK_GENERATOR "ZIP;NSIS")
elseif(APPLE)
    set(CPACK_GENERATOR "ZIP;TGZ")
else()
    set(CPACK_GENERATOR "ZIP;DEB;RPM")
endif()

include(CPack)
