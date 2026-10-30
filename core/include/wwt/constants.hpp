#pragma once

namespace wwt {

inline constexpr const char* kCoreVersion = "0.2.0";

inline constexpr int kUnitCount = 9;
inline constexpr const char* kUnitCode[kUnitCount] = {
    "ID", "AD", "FW", "BW", "SF", "NF", "MD", "ABD", "MTN"};
inline constexpr int kUnitIc[kUnitCount] = {1, 3, 2, 3, 2, 4, 2, 2, 2};
inline constexpr int kUnitMp[kUnitCount] = {1, 2, 1, 1, 1, 2, 1, 1, 1};
inline constexpr bool kUnitHeavy[kUnitCount] = {false, true, false, true, false, true, false, false, false};

inline constexpr int kAbdIndex = 7;
inline constexpr int kBwIndex = 3;
inline constexpr int kAirborneAirRd = 4;

inline constexpr int kStabilityIc = 3;
inline constexpr int kStabilityMaxPerSeason = 1;
inline constexpr int kStabilityMax = 10;
inline constexpr int kWarBondsNt = 40;
inline constexpr int kWarBondsMax = 2;
inline constexpr int kRelocateIc = 1;
inline constexpr int kFactoryIc = 3;
inline constexpr int kFortIc = 2;
inline constexpr int kEspionageIc = 3;
inline constexpr int kEspionageMax = 4;
inline constexpr int kEspionageUnlock[5] = {2, 4, 6, 8, 10};
inline constexpr int kCampaignStep = 10;
inline constexpr int kCampaignMax = 60;
inline constexpr int kProxyMin = 100;
inline constexpr int kProxyMax = 300;
inline constexpr int kVolunteersNt = 300;
inline constexpr int kDiplomacyNt = 100;
inline constexpr int kResearchIc = 2;
inline constexpr int kResearchMax = 10;
inline constexpr int kDevelopCheap = 2;
inline constexpr int kDevelopExpensive = 4;
inline constexpr int kCheapUpToIndex = 2;

inline constexpr int kResourceCount = 5;
inline constexpr const char* kResourceName[kResourceCount] = {
    "oil", "food", "iron", "rubber", "tungsten"};

}
