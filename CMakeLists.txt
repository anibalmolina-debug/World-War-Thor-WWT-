cmake_minimum_required(VERSION 3.20)
project(wwt LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(wwt_core STATIC
  core/src/version.cpp
  core/src/cipher.cpp
  core/src/budget.cpp\n  core/src/rules_engine.cpp
)
target_include_directories(wwt_core PUBLIC core/include)

add_executable(wwt_cipher_tests core/tests/cipher_test.cpp)
target_link_libraries(wwt_cipher_tests PRIVATE wwt_core)

add_executable(wwt_budget_tests core/tests/budget_test.cpp)
target_link_libraries(wwt_budget_tests PRIVATE wwt_core)

if(EMSCRIPTEN)
  add_executable(wwt_ui
    ui/src/app.cpp\n    ui/src/glue.cpp
    core/src/version.cpp
    core/src/cipher.cpp
  )
  target_include_directories(wwt_ui PRIVATE core/include ui/include)
  target_link_options(wwt_ui PRIVATE
    -sMODULARIZE=1
    -sEXPORT_ES6=1
    -sENVIRONMENT=web
    -sALLOW_MEMORY_GROWTH=1
    -sEXPORTED_RUNTIME_METHODS=['ccall','cwrap','UTF8ToString','stringToUTF8','lengthBytesUTF8']
    -sEXPORTED_FUNCTIONS=['_malloc','_free','_wwt_ui_init','_wwt_ui_event','_wwt_core_version','_wwt_caesar']
  )
endif()
