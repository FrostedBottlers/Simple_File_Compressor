#pragma once
#include <vector>
#include <string>
#include <cstdint>

struct FileEntry {
    std::string path;
    std::vector<uint8_t> data;
};

class Archiver {
public:
    // Packs multiple FileEntries into a single byte stream
    static std::vector<uint8_t> pack(const std::vector<FileEntry>& files);
    
    // Unpacks a byte stream into multiple FileEntries
    static std::vector<FileEntry> unpack(const std::vector<uint8_t>& packed_data);
};
