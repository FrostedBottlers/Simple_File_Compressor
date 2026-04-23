#include "Archiver.h"
#include <stdexcept>
#include <cstring>

std::vector<uint8_t> Archiver::pack(const std::vector<FileEntry>& files) {
    std::vector<uint8_t> packed;
    
    // Write number of files (4 bytes)
    uint32_t num_files = files.size();
    packed.push_back((num_files >> 24) & 0xFF);
    packed.push_back((num_files >> 16) & 0xFF);
    packed.push_back((num_files >> 8) & 0xFF);
    packed.push_back(num_files & 0xFF);
    
    for (const auto& file : files) {
        // Write path length (2 bytes)
        uint16_t path_len = file.path.length();
        packed.push_back((path_len >> 8) & 0xFF);
        packed.push_back(path_len & 0xFF);
        
        // Write path
        for (char c : file.path) {
            packed.push_back(static_cast<uint8_t>(c));
        }
        
        // Write file size (8 bytes)
        uint64_t file_size = file.data.size();
        for (int i = 7; i >= 0; --i) {
            packed.push_back((file_size >> (i * 8)) & 0xFF);
        }
        
        // Write file data
        packed.insert(packed.end(), file.data.begin(), file.data.end());
    }
    
    return packed;
}

std::vector<FileEntry> Archiver::unpack(const std::vector<uint8_t>& packed_data) {
    std::vector<FileEntry> files;
    if (packed_data.size() < 4) return files;
    
    size_t offset = 0;
    
    uint32_t num_files = (static_cast<uint32_t>(packed_data[offset]) << 24) |
                         (static_cast<uint32_t>(packed_data[offset+1]) << 16) |
                         (static_cast<uint32_t>(packed_data[offset+2]) << 8) |
                         static_cast<uint32_t>(packed_data[offset+3]);
    offset += 4;
    
    for (uint32_t i = 0; i < num_files; ++i) {
        if (offset + 2 > packed_data.size()) break;
        
        uint16_t path_len = (static_cast<uint16_t>(packed_data[offset]) << 8) |
                            static_cast<uint16_t>(packed_data[offset+1]);
        offset += 2;
        
        if (offset + path_len > packed_data.size()) break;
        std::string path(packed_data.begin() + offset, packed_data.begin() + offset + path_len);
        offset += path_len;
        
        if (offset + 8 > packed_data.size()) break;
        uint64_t file_size = 0;
        for (int j = 7; j >= 0; --j) {
            file_size |= (static_cast<uint64_t>(packed_data[offset]) << (j * 8));
            offset++;
        }
        
        if (offset + file_size > packed_data.size()) break;
        std::vector<uint8_t> data(packed_data.begin() + offset, packed_data.begin() + offset + file_size);
        offset += file_size;
        
        files.push_back({path, data});
    }
    
    return files;
}
