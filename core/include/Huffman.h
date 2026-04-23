#pragma once
#include <vector>
#include <cstdint>
#include <map>
#include <unordered_map>
#include <string>
#include <memory>

class Huffman {
public:
    struct CanonicalCode {
        uint32_t code;
        int length;
    };

    struct Node {
        uint8_t symbol;
        uint64_t freq;
        std::shared_ptr<Node> left;
        std::shared_ptr<Node> right;
        
        Node(uint8_t s, uint64_t f) : symbol(s), freq(f), left(nullptr), right(nullptr) {}
        Node(std::shared_ptr<Node> l, std::shared_ptr<Node> r) 
            : symbol(0), freq(l->freq + r->freq), left(l), right(r) {}
    };

    static std::vector<uint8_t> compress(const std::vector<uint8_t>& data);
    static std::vector<uint8_t> decompress(const std::vector<uint8_t>& compressed_data);

private:
    static std::unordered_map<uint8_t, int> getBitLengths(const std::vector<uint8_t>& data);
    static std::unordered_map<uint8_t, CanonicalCode> generateCanonicalCodes(const std::unordered_map<uint8_t, int>& bit_lengths);
    static void buildCodeLengthsSub(const std::shared_ptr<Node>& node, int depth, std::unordered_map<uint8_t, int>& bit_lengths);
};
