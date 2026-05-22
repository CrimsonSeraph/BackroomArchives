cmake_minimum_required(VERSION 3.16)
project(BackroomsArchives LANGUAGES CXX)

# 启用 /EHsc 异常处理（仅 MSVC）
if(MSVC)
    add_compile_options(/EHsc)
endif()

# 引入 Qt 相关设置
include(qt.cmake)

# 设置 C++ 标准
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Qt 相关设置（自动处理 uic/moc/rcc）
set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

# -------------------- 原始编译选项 --------------------
if(MSVC)
    add_compile_options("/utf-8")
endif()

# 选择要构建的档案版本（默认为 wikidot）
set(ARCHIVE_VERSION "wikidot" CACHE STRING "Which archive version to build (subdir under archives/)")
# 是否构建档案插件（若为 OFF 则只生成 core 包）
option(BUILD_ARCHIVES "Build level plugins from archives/" ON)

# -------------------- 第三方库 nlohmann/json --------------------
include(FetchContent)

set(NLOHMANN_JSON_INCLUDE_DIR "${CMAKE_CURRENT_BINARY_DIR}/include")
set(NLOHMANN_JSON_HEADER "${NLOHMANN_JSON_INCLUDE_DIR}/nlohmann/json.hpp")

if(NOT EXISTS "${NLOHMANN_JSON_HEADER}")
    message(STATUS "Downloading json.hpp from GitHub...")
    file(MAKE_DIRECTORY "${NLOHMANN_JSON_INCLUDE_DIR}/nlohmann")
    file(DOWNLOAD
        "https://github.com/nlohmann/json/releases/download/v3.12.0/json.hpp"
        "${NLOHMANN_JSON_HEADER}"
        STATUS DOWNLOAD_STATUS
        SHOW_PROGRESS
    )
    list(GET DOWNLOAD_STATUS 0 STATUS_CODE)
    if(STATUS_CODE EQUAL 0)
        message(STATUS "Downloaded json.hpp successfully")
    else()
        list(GET DOWNLOAD_STATUS 1 ERROR_MSG)
        message(FATAL_ERROR "Failed to download json.hpp: ${ERROR_MSG}")
    endif()
else()
    message(STATUS "json.hpp already exists, skipping download")
endif()

add_library(nlohmann_json INTERFACE)
target_include_directories(nlohmann_json INTERFACE "${NLOHMANN_JSON_INCLUDE_DIR}")

# -------------------- 查找 Qt --------------------
find_package(QT NAMES Qt6 Qt5 REQUIRED COMPONENTS Core)
find_package(Qt${QT_VERSION_MAJOR} REQUIRED COMPONENTS Core Gui Widgets WebEngineCore WebEngineWidgets)

if (QT_VERSION_MAJOR EQUAL 6)
    qt_standard_project_setup()
endif()

# -------------------- 插件 API 接口库 --------------------
add_library(BackroomsAPI INTERFACE)
target_include_directories(BackroomsAPI INTERFACE include/plugin_api)
target_link_libraries(BackroomsAPI INTERFACE nlohmann_json)

# -------------------- 本体可执行文件 --------------------
set(PROJECT_SOURCES
    main.cpp
    BackroomArchives.ui
    BackroomArchives.qrc

    src/AppConfig.cpp
    include/AppConfig.h
    include/AppConfig_impl.hpp
    include/AppConfig_utils.hpp

    src/BackroomArchives.cpp
    include/BackroomArchives.h

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

target_link_libraries(${PROJECT_NAME} PRIVATE
    nlohmann_json
    BackroomsAPI
    Qt::Core
    Qt::Gui
    Qt::Widgets
    Qt::WebEngineCore
    Qt::WebEngineWidgets
)

target_include_directories(${PROJECT_NAME} PRIVATE include)

# Windows 图形界面应用 + macOS 不生成 bundle
if(WIN32)
    set_target_properties(${PROJECT_NAME} PROPERTIES WIN32_EXECUTABLE TRUE)
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

# -------------------- 复制配置文件与文本（便于直接运行）--------------------
add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
        "${CMAKE_CURRENT_SOURCE_DIR}/config"
        "$<TARGET_FILE_DIR:${PROJECT_NAME}>/config"
    COMMENT "Copying configuration files to output directory"
)
add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
        "${CMAKE_CURRENT_SOURCE_DIR}/pages"
        "$<TARGET_FILE_DIR:${PROJECT_NAME}>/pages"
    COMMENT "Copying page files to output directory"
)

# -------------------- 安装规则 --------------------
install(TARGETS ${PROJECT_NAME}
    RUNTIME DESTINATION . COMPONENT core
    LIBRARY DESTINATION . COMPONENT core
)
install(DIRECTORY config/ DESTINATION config COMPONENT core)
install(DIRECTORY pages/ DESTINATION pages COMPONENT core)

# -------------------- CPack 组件打包配置 --------------------
include(InstallRequiredSystemLibraries)

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
