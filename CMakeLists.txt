cmake_minimum_required(VERSION 3.16)
project(BackroomArchives LANGUAGES CXX)

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

# -------------------- 查找 Qt --------------------
find_package(QT NAMES Qt6 Qt5 REQUIRED COMPONENTS Core)
find_package(Qt${QT_VERSION_MAJOR} REQUIRED COMPONENTS Core Gui Widgets WebChannel WebEngineCore WebEngineWidgets REQUIRED)

if (QT_VERSION_MAJOR EQUAL 6)
    qt_standard_project_setup()
endif()

# -------------------- 网页资源扩展 --------------------

# 设置下载目标目录（相对于当前构建目录）
set(DYNAMIC_TEXT_ENGINE_DIR "${CMAKE_CURRENT_BINARY_DIR}/pages/extensions")

# 定义两个文件的本地路径
set(DYNAMIC_TEXT_ENGINE_JS  "${DYNAMIC_TEXT_ENGINE_DIR}/DynamicTextEngine.js")

# 创建目录（如果不存在）
file(MAKE_DIRECTORY "${DYNAMIC_TEXT_ENGINE_DIR}")

# 下载 JS 文件（若不存在）
if(NOT EXISTS "${DYNAMIC_TEXT_ENGINE_JS}")
    message(STATUS "Downloading DynamicTextEngine.js from GitHub...")
    file(DOWNLOAD
        "https://raw.githubusercontent.com/CrimsonSeraph/WebUtils/main/DynamicTextEngine/DynamicTextEngine.js"
        "${DYNAMIC_TEXT_ENGINE_JS}"
        STATUS DOWNLOAD_STATUS_JS
        SHOW_PROGRESS
    )
    list(GET DOWNLOAD_STATUS_JS 0 STATUS_CODE_JS)
    if(STATUS_CODE_JS EQUAL 0)
        message(STATUS "Downloaded DynamicTextEngine.js successfully")
    else()
        list(GET DOWNLOAD_STATUS_JS 1 ERROR_MSG_JS)
        message(FATAL_ERROR "Failed to download DynamicTextEngine.js: ${ERROR_MSG_JS}")
    endif()
else()
    message(STATUS "DynamicTextEngine.js already exists, skipping download")
endif()

# -------------------- 查找 qwebchannel.js --------------------
set(QWEBCHANNEL_JS_NAME "qwebchannel.js")
set(QWEBCHANNEL_JS_SOURCE "")
set(DEBUG_PREFIX "[QWebChannel]")

function(qwebchannel_log MSG)
    message(STATUS "${DEBUG_PREFIX} ${MSG}")
endfunction()

# 确保 WebChannel 组件已找到
if(NOT TARGET Qt${QT_VERSION_MAJOR}::WebChannel)
    message(FATAL_ERROR "Qt${QT_VERSION_MAJOR}::WebChannel target not found. Check find_package.")
endif()

# 获取编译器特定的 Qt 前缀
get_target_property(QT_QMAKE_EXECUTABLE Qt${QT_VERSION_MAJOR}::qmake LOCATION)
if(QT_QMAKE_EXECUTABLE AND EXISTS "${QT_QMAKE_EXECUTABLE}")
    get_filename_component(QT_BIN_DIR "${QT_QMAKE_EXECUTABLE}" DIRECTORY)
    get_filename_component(QT_INSTALL_PREFIX "${QT_BIN_DIR}" DIRECTORY)
    qwebchannel_log("Compiler-specific prefix: ${QT_INSTALL_PREFIX}")
else()
    get_target_property(QT_WEBCHANNEL_INCLUDES Qt${QT_VERSION_MAJOR}::WebChannel INTERFACE_INCLUDE_DIRECTORIES)
    if(QT_WEBCHANNEL_INCLUDES)
        list(GET QT_WEBCHANNEL_INCLUDES 0 FIRST_INC)
        get_filename_component(QT_INSTALL_PREFIX "${FIRST_INC}" DIRECTORY)
        get_filename_component(QT_INSTALL_PREFIX "${QT_INSTALL_PREFIX}" DIRECTORY)
        qwebchannel_log("Prefix from includes: ${QT_INSTALL_PREFIX}")
    else()
        message(WARNING "Cannot determine Qt install prefix.")
        set(QT_INSTALL_PREFIX "")
    endif()
endif()

# 获取 Qt 顶级根目录
get_filename_component(QT_TOP_DIR "${QT_INSTALL_PREFIX}" DIRECTORY)
get_filename_component(QT_TOP_DIR "${QT_TOP_DIR}" DIRECTORY)
qwebchannel_log("Qt top-level directory: ${QT_TOP_DIR}")

# 候选路径列表
set(QT_VERSION_FULL "${Qt${QT_VERSION_MAJOR}_VERSION}")
set(CANDIDATE_PATHS
    "${QT_INSTALL_PREFIX}/qml/QtWebChannel/${QWEBCHANNEL_JS_NAME}"
    "${QT_TOP_DIR}/Examples/Qt-${QT_VERSION_FULL}/webchannel/shared/${QWEBCHANNEL_JS_NAME}"
    "${QT_INSTALL_PREFIX}/Examples/Qt-${QT_VERSION_FULL}/webchannel/shared/${QWEBCHANNEL_JS_NAME}"
)

qwebchannel_log("Checking explicit candidate paths:")
foreach(CANDIDATE ${CANDIDATE_PATHS})
    if(EXISTS "${CANDIDATE}")
        set(QWEBCHANNEL_JS_SOURCE "${CANDIDATE}")
        qwebchannel_log("  Found at: ${CANDIDATE}")
        break()
    else()
        qwebchannel_log("  Not found: ${CANDIDATE}")
    endif()
endforeach()

# 若未找到，进行有界递归搜索
if(NOT QWEBCHANNEL_JS_SOURCE)
    set(SEARCH_ROOTS
        "${QT_INSTALL_PREFIX}/qml"
        "${QT_TOP_DIR}/Examples"
        "${QT_INSTALL_PREFIX}/Examples"
    )
    qwebchannel_log("Starting recursive search in:")
    foreach(ROOT ${SEARCH_ROOTS})
        if(EXISTS "${ROOT}")
            qwebchannel_log("Recursing into: ${ROOT}")
            file(GLOB_RECURSE FOUND_FILES "${ROOT}/${QWEBCHANNEL_JS_NAME}")
            if(FOUND_FILES)
                list(GET FOUND_FILES 0 QWEBCHANNEL_JS_SOURCE)
                qwebchannel_log("  Found: ${QWEBCHANNEL_JS_SOURCE}")
                if(FOUND_FILES)
                    qwebchannel_log("  (also found: ${FOUND_FILES})")
                endif()
                break()
            else()
                qwebchannel_log("  No matches in ${ROOT}")
            endif()
        else()
            qwebchannel_log("  Directory does not exist: ${ROOT}")
        endif()
    endforeach()
endif()

# 最后尝试 find_file
if(NOT QWEBCHANNEL_JS_SOURCE)
    qwebchannel_log("Attempting find_file...")
    find_file(QWEBCHANNEL_JS_SOURCE
        NAMES ${QWEBCHANNEL_JS_NAME}
        PATHS ${QT_TOP_DIR} ${QT_INSTALL_PREFIX}
        PATH_SUFFIXES
            Examples/Qt-*/webchannel/shared
            qml/QtWebChannel
        NO_DEFAULT_PATH
    )
    if(QWEBCHANNEL_JS_SOURCE)
        qwebchannel_log("  find_file found: ${QWEBCHANNEL_JS_SOURCE}")
    else()
        qwebchannel_log("  find_file failed.")
    endif()
endif()

# 用户自定义
set(QWEBCHANNEL_JS_CUSTOM "" CACHE FILEPATH "Path to qwebchannel.js (manual override)")
if(QWEBCHANNEL_JS_CUSTOM AND EXISTS "${QWEBCHANNEL_JS_CUSTOM}")
    # 同样添加 POST_BUILD 命令，覆盖上面的
    add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E make_directory "$<TARGET_FILE_DIR:${PROJECT_NAME}>/pages/extensions/"
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
            "${QWEBCHANNEL_JS_CUSTOM}"
            "$<TARGET_FILE_DIR:${PROJECT_NAME}>/pages/extensions/${QWEBCHANNEL_JS_NAME}"
        COMMENT "Copying qwebchannel.js from user override to output directory"
        VERBATIM
    )
    qwebchannel_log("  Using user override, will copy at build time.")
endif()

# 创建一个接口库，方便其他目标引用这些文件所在的目录
add_library(dynamic_text_engine INTERFACE)
target_include_directories(dynamic_text_engine INTERFACE "${DYNAMIC_TEXT_ENGINE_DIR}")

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

    src/GameStateBridge.cpp
    include/GameStateBridge.h

    src/InputHandlerBridge.cpp
    include/InputHandlerBridge.h

    src/JsConsoleBridge.cpp
    include/JsConsoleBridge.h

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
    Qt::WebChannel
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

# 复制 qwebchannel.js
if(QWEBCHANNEL_JS_SOURCE)
    set(QWEBCHANNEL_JS_DEST_SRC "${CMAKE_CURRENT_SOURCE_DIR}/pages/extensions/${QWEBCHANNEL_JS_NAME}")
    if(NOT EXISTS "${QWEBCHANNEL_JS_DEST_SRC}")
        file(COPY "${QWEBCHANNEL_JS_SOURCE}" DESTINATION "${CMAKE_CURRENT_SOURCE_DIR}/pages/extensions/")
        qwebchannel_log("Copied to source pages/extensions/ (will be included in output via copy_directory)")
    else()
        qwebchannel_log("qwebchannel.js already exists in source pages/extensions/, skipping copy")
    endif()
else()
    qwebchannel_log("Failed to locate ${QWEBCHANNEL_JS_NAME}, please manually place it in pages/extensions/")
endif()

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
set(CPACK_PACKAGE_NAME "BackroomArchives-${ARCHIVE_VERSION}")
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
