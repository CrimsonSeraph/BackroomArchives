cmake_minimum_required(VERSION 3.16)
project(BackroomsWikidotPlugins LANGUAGES CXX)

if(NOT ARCHIVE_VERSION)
    set(ARCHIVE_VERSION "wikidot" CACHE STRING "Archive version")
endif()

# 1. 编译档案核心插件
set(CORE_PLUGIN_NAME "${ARCHIVE_VERSION}_core")
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/core.cpp")
    add_library(${CORE_PLUGIN_NAME} MODULE core.cpp)
    target_link_libraries(${CORE_PLUGIN_NAME} PRIVATE BackroomsAPI nlohmann_json)
    target_include_directories(${CORE_PLUGIN_NAME} PRIVATE ${BACKROOMS_ARCHIVE_API_INCLUDE})
    set_target_properties(${CORE_PLUGIN_NAME} PROPERTIES PREFIX "" OUTPUT_NAME "${CORE_PLUGIN_NAME}")
    install(TARGETS ${CORE_PLUGIN_NAME}
        LIBRARY DESTINATION archives/${ARCHIVE_VERSION}
        RUNTIME DESTINATION archives/${ARCHIVE_VERSION}
        COMPONENT archives
    )
endif()

# 2. 安装公共资源（明确列出，不依赖自动排除）
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/version.json")
    install(FILES version.json DESTINATION archives/${ARCHIVE_VERSION} COMPONENT archives)
endif()
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/README_archive.md")
    install(FILES README_archive.md DESTINATION archives/${ARCHIVE_VERSION} COMPONENT archives)
endif()
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/texts")
    install(DIRECTORY texts/ DESTINATION archives/${ARCHIVE_VERSION}/texts COMPONENT archives)
endif()
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/config")
    install(DIRECTORY config/ DESTINATION archives/${ARCHIVE_VERSION}/config COMPONENT archives)
endif()

# 3. 处理每个层级（只处理目录，不复制公共根目录文件）
file(GLOB LEVEL_DIRS LIST_DIRECTORIES true "${CMAKE_CURRENT_SOURCE_DIR}/*")
foreach(LEVEL_DIR ${LEVEL_DIRS})
    if(IS_DIRECTORY ${LEVEL_DIR})
        get_filename_component(LEVEL_NAME ${LEVEL_DIR} NAME)
        # 跳过公共目录
        if(LEVEL_NAME STREQUAL "texts" OR LEVEL_NAME STREQUAL "config" OR LEVEL_NAME MATCHES "^_")
            continue()
        endif()
        
        set(PLUGIN_SOURCE "${LEVEL_DIR}/${LEVEL_NAME}.cpp")
        if(EXISTS ${PLUGIN_SOURCE})
            message(STATUS "Building plugin for level: ${LEVEL_NAME}")
            add_library(${LEVEL_NAME} MODULE ${PLUGIN_SOURCE})
            target_link_libraries(${LEVEL_NAME} PRIVATE BackroomsAPI nlohmann_json)
            target_include_directories(${LEVEL_NAME} PRIVATE ${BACKROOMS_ARCHIVE_API_INCLUDE})
            set_target_properties(${LEVEL_NAME} PROPERTIES PREFIX "" OUTPUT_NAME "${LEVEL_NAME}")
            install(TARGETS ${LEVEL_NAME}
                LIBRARY DESTINATION archives/${ARCHIVE_VERSION}/${LEVEL_NAME}
                RUNTIME DESTINATION archives/${ARCHIVE_VERSION}/${LEVEL_NAME}
                COMPONENT archives
            )
        else()
            # 没有源码，只复制资源（静默）
            message(STATUS "Level ${LEVEL_NAME} has no plugin source, copying resources only")
        endif()
        # 无论是否有源码，都复制该目录下的私有资源（排除源码和 CMake 文件）
        install(DIRECTORY ${LEVEL_DIR}/
            DESTINATION archives/${ARCHIVE_VERSION}/${LEVEL_NAME}
            COMPONENT archives
            PATTERN "*.cpp" EXCLUDE
            PATTERN "*.h" EXCLUDE
            PATTERN "CMakeLists.txt" EXCLUDE
        )
    endif()
endforeach()