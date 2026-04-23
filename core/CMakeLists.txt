cmake_minimum_required(VERSION 3.14)
project(HuffPack CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

# Find all source files except the WASM bridge (we only build WASM bridge with emcc)
file(GLOB SOURCES "src/*.cpp")
list(REMOVE_ITEM SOURCES "${CMAKE_CURRENT_SOURCE_DIR}/src/wasm_bridge.cpp")

add_executable(huffpack ${SOURCES})
