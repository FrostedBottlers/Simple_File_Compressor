#include "Huffman.h"
#include "BitStream.h"
#include <queue>
#include <algorithm>

std::vector<uint8_t> Huffman::compress(const std::vector<uint8_t>& data) {
    if (data.empty()) return {};

    auto bit_lengths = getBitLengths(data);
    auto codes = generateCanonicalCodes(bit_lengths);

    BitWriter writer;

    // Header structure:
    // 1. Original file size (8 bytes)
    // 2. Number of symbols with lengths > 0 (2 bytes)
    // 3. Loop: symbol (1 byte) + bit_length (1 byte)
    
    uint64_t ds = data.size();
    for (int i = 0; i < 8; ++i) {
        writer.writeByte((ds >> (i * 8)) & 0xFF);
    }

    uint16_t symbol_count = 0;
    for (const auto& pair : bit_lengths) {
        if (pair.second > 0) symbol_count++;
    }
    
    writer.writeByte((symbol_count >> 8) & 0xFF);
    writer.writeByte(symbol_count & 0xFF);

    for (const auto& pair : bit_lengths) {
        if (pair.second > 0) {
            writer.writeByte(pair.first);
            writer.writeByte(static_cast<uint8_t>(pair.second));
        }
    }

    for (uint8_t b : data) {
        const auto& ccode = codes[b];
        writer.writeBits(ccode.code, ccode.length);
    }

    writer.flush();
    return writer.getBuffer();
}


void Huffman::buildCodeLengthsSub(const std::shared_ptr<Node>& node, int depth, std::unordered_map<uint8_t, int>& bit_lengths) {
    if (!node) return;
    if (!node->left && !node->right) {
        bit_lengths[node->symbol] = std::max(1, depth); // length must be at least 1
        return;
    }
    buildCodeLengthsSub(node->left, depth + 1, bit_lengths);
    buildCodeLengthsSub(node->right, depth + 1, bit_lengths);
}

std::unordered_map<uint8_t, int> Huffman::getBitLengths(const std::vector<uint8_t>& data) {
    std::unordered_map<uint8_t, uint64_t> freqs;
    for (uint8_t b : data) freqs[b]++;

    auto cmp = [](const std::shared_ptr<Node>& a, const std::shared_ptr<Node>& b) {
        return a->freq > b->freq;
    };
    std::priority_queue<std::shared_ptr<Node>, std::vector<std::shared_ptr<Node>>, decltype(cmp)> pq(cmp);

    for (const auto& pair : freqs) {
        pq.push(std::make_shared<Node>(pair.first, pair.second));
    }

    if (pq.size() == 1) {
        // Edge case: single symbol
        std::unordered_map<uint8_t, int> bit_lengths;
        bit_lengths[pq.top()->symbol] = 1;
        return bit_lengths;
    }

    while (pq.size() > 1) {
        auto left = pq.top(); pq.pop();
        auto right = pq.top(); pq.pop();
        pq.push(std::make_shared<Node>(left, right));
    }

    std::unordered_map<uint8_t, int> bit_lengths;
    buildCodeLengthsSub(pq.top(), 0, bit_lengths);
    return bit_lengths;
}

std::unordered_map<uint8_t, Huffman::CanonicalCode> Huffman::generateCanonicalCodes(const std::unordered_map<uint8_t, int>& bit_lengths) {
    std::vector<std::pair<uint8_t, int>> sorted_lengths(bit_lengths.begin(), bit_lengths.end());
    
    std::sort(sorted_lengths.begin(), sorted_lengths.end(), [](const auto& a, const auto& b) {
        if (a.second != b.second) return a.second < b.second;
        return a.first < b.first;
    });

    std::unordered_map<uint8_t, CanonicalCode> codes;
    uint32_t current_code = 0;
    int prev_length = sorted_lengths.empty() ? 0 : sorted_lengths[0].second;

    for (const auto& pair : sorted_lengths) {
        uint8_t symbol = pair.first;
        int length = pair.second;

        current_code <<= (length - prev_length);
        codes[symbol] = {current_code, length};
        
        current_code++;
        prev_length = length;
    }

    return codes;
}

std::vector<uint8_t> Huffman::decompress(const std::vector<uint8_t>& compressed_data) {
    if (compressed_data.empty()) return {};
    
    BitReader reader(compressed_data);
    
    uint64_t original_size = 0;
    for (int i = 0; i < 8; ++i) {
        uint8_t b;
        if (!reader.readByte(b)) return {};
        original_size |= (static_cast<uint64_t>(b) << (i * 8));
    }
    
    uint8_t count_high, count_low;
    if (!reader.readByte(count_high) || !reader.readByte(count_low)) return {};
    uint16_t symbol_count = (static_cast<uint16_t>(count_high) << 8) | count_low;
    
    std::unordered_map<uint8_t, int> bit_lengths;
    for (int i = 0; i < symbol_count; ++i) {
        uint8_t symbol, length;
        if (!reader.readByte(symbol) || !reader.readByte(length)) return {};
        bit_lengths[symbol] = length;
    }
    
    auto codes = generateCanonicalCodes(bit_lengths);
    
    // Reverse map: string of bits -> symbol
    // Since bits are read one by one, a binary tree is easier, 
    // or we can use a hash map of string->symbol or just integers if max length <= 32
    // Canonical Huffman max length depends on file size and frequencies, 
    // but typically fits in 32. 
    std::unordered_map<uint32_t, std::unordered_map<int, uint8_t>> decode_map; // map[length][code] = symbol
    for (const auto& pair : codes) {
        decode_map[pair.second.length][pair.second.code] = pair.first;
    }
    
    std::vector<uint8_t> decompressed;
    decompressed.reserve(original_size);
    
    uint32_t current_code = 0;
    int current_length = 0;
    
    while (decompressed.size() < original_size) {
        bool bit;
        if (!reader.readBit(bit)) break;
        
        current_code = (current_code << 1) | bit;
        current_length++;
        
        auto length_it = decode_map.find(current_length);
        if (length_it != decode_map.end()) {
            auto code_it = length_it->second.find(current_code);
            if (code_it != length_it->second.end()) {
                decompressed.push_back(code_it->second);
                current_code = 0;
                current_length = 0;
            }
        }
    }
    
    return decompressed;
}
