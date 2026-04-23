#include <emscripten/bind.h>
#include "Archiver.h"
#include "Huffman.h"
#include <vector>
#include <string>

using namespace emscripten;

// Helper to pass JS arrays to C++ vectors
std::vector<uint8_t> compress_file(const std::string& filename, const std::string& data_str) {
    std::vector<uint8_t> data(data_str.begin(), data_str.end());
    FileEntry entry{filename, data};
    std::vector<FileEntry> files = {entry};
    
    std::vector<uint8_t> packed = Archiver::pack(files);
    return Huffman::compress(packed);
}

// Embind allows binding to JS
EMSCRIPTEN_BINDINGS(huffpack_module) {
    register_vector<uint8_t>("VectorUInt8");
    
    // Core Huffman
    class_<Huffman>("Huffman")
        .class_function("compress", &Huffman::compress)
        .class_function("decompress", &Huffman::decompress);
        
    // Higher level wrappers could be added here
}
