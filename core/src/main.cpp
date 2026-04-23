#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <filesystem>
#include "Huffman.h"
#include "Archiver.h"

namespace fs = std::filesystem;

void print_help() {
    std::cout << "HuffPack - Ambitious File Compressor\n";
    std::cout << "Usage:\n";
    std::cout << "  huffpack pack <output.huff> <input_file_or_dir>\n";
    std::cout << "  huffpack unpack <input.huff> <output_dir>\n";
}

std::vector<uint8_t> read_file(const std::string& path) {
    std::ifstream file(path, std::ios::binary | std::ios::ate);
    if (!file) throw std::runtime_error("Could not open file: " + path);
    
    std::streamsize size = file.tellg();
    file.seekg(0, std::ios::beg);
    
    std::vector<uint8_t> buffer(size);
    if (file.read(reinterpret_cast<char*>(buffer.data()), size)) {
        return buffer;
    }
    throw std::runtime_error("Error reading file: " + path);
}

void write_file(const std::string& path, const std::vector<uint8_t>& data) {
    std::ofstream file(path, std::ios::binary);
    if (!file) throw std::runtime_error("Could not create file: " + path);
    file.write(reinterpret_cast<const char*>(data.data()), data.size());
}

void collect_files(const fs::path& base_path, const fs::path& current_path, std::vector<FileEntry>& entries) {
    if (fs::is_regular_file(current_path)) {
        std::string rel_path = fs::relative(current_path, base_path).string();
        entries.push_back({rel_path, read_file(current_path.string())});
    } else if (fs::is_directory(current_path)) {
        for (const auto& entry : fs::directory_iterator(current_path)) {
            collect_files(base_path, entry.path(), entries);
        }
    }
}

int main(int argc, char* argv[]) {
    if (argc < 4) {
        print_help();
        return 1;
    }

    std::string command = argv[1];

    try {
        if (command == "pack") {
            std::string output_path = argv[2];
            std::string input_path = argv[3];

            std::cout << "Packing " << input_path << "...\n";
            std::vector<FileEntry> files;
            
            if (fs::is_directory(input_path)) {
                collect_files(input_path, input_path, files);
            } else {
                files.push_back({fs::path(input_path).filename().string(), read_file(input_path)});
            }
            
            std::cout << "Collected " << files.size() << " files.\n";
            std::vector<uint8_t> packed = Archiver::pack(files);
            
            std::cout << "Compressing...\n";
            std::vector<uint8_t> compressed = Huffman::compress(packed);
            
            write_file(output_path, compressed);
            std::cout << "Successfully created " << output_path << " (" << compressed.size() << " bytes).\n";
            
        } else if (command == "unpack") {
            std::string input_path = argv[2];
            std::string output_dir = argv[3];
            
            std::cout << "Reading " << input_path << "...\n";
            std::vector<uint8_t> compressed = read_file(input_path);
            
            std::cout << "Decompressing...\n";
            std::vector<uint8_t> packed = Huffman::decompress(compressed);
            
            std::cout << "Unpacking...\n";
            std::vector<FileEntry> files = Archiver::unpack(packed);
            
            fs::create_directories(output_dir);
            for (const auto& file : files) {
                fs::path out_path = fs::path(output_dir) / file.path;
                fs::create_directories(out_path.parent_path());
                write_file(out_path.string(), file.data);
                std::cout << "  Extracted: " << file.path << "\n";
            }
            
            std::cout << "Successfully unpacked to " << output_dir << ".\n";
            
        } else {
            print_help();
            return 1;
        }
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << "\n";
        return 1;
    }

    return 0;
}
