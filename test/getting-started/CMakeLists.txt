cmake_minimum_required(VERSION 3.10)

project(restoring-a-snapshot-in-c)

add_executable(restoring-a-snapshot-in-c
              "${PROJECT_SOURCE_DIR}/5.restoring-a-snapshot-in-c.c"
              "${PROJECT_SOURCE_DIR}/microvium/microvium.c"
              )

target_include_directories(restoring-a-snapshot-in-c PUBLIC
                          "${PROJECT_SOURCE_DIR}/microvium"
                          "${PROJECT_SOURCE_DIR}"
                          )

if(UNIX AND NOT APPLE)
  target_link_libraries(restoring-a-snapshot-in-c PRIVATE m)
endif()
