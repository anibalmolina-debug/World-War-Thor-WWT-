#pragma once

#include "wwt/constants.hpp"
#include <string>
#include <vector>
#include <random>
#include <map>

namespace wwt {

struct Order {
  int builds[kUnitCount]{};
  int fortification = 0;
  std::string fortificationBorder;
  std::string researchBranch;
  int researchTo = 0;
  int stabilityInitiatives = 0;
  int factoryBuild = 0;
  int relocateFactories = 0;
  std::string developResource;
  int warBonds = 0;
  int politicalCampaignNt = 0;
  int otherNt = 0;
  int proxyFunding = 0;
  int volunteers = 0;
  int diplomacySpend = 0;
  int espionageActions = 0;
  bool hasBomberWing = false;
};

struct NationView {
  int ic = 0;
  int treasuryM = 0;
  int manpower = 0;
  int stability = 0;
  int militaryCapPct = 100;
  int factoryCount = 0;
  int researchAir = 0;
  int researchIntel = 0;
  int researchOther = 0;
  int resourceIndex[kResourceCount]{2, 2, 2, 2, 2};
  bool depositsMatch[kResourceCount]{};
};

struct Meter {
  int used = 0;
  int max = 0;
  int remaining() const { return max - used; }
};

struct Budget {
  Meter ic;
  Meter nt;
  Meter mp;
};

struct Validation {
  bool ok = false;
  Budget meters;
  int errorCount = 0;
  int warningCount = 0;
};

class ResearchTree {
public:
  static bool canResearch(const NationView& nation, const std::string& branch, int target);
  static int getResearchCost(const std::string& branch, int target);
};

class RulesEngine {
public:
  explicit RulesEngine(uint32_t seed) : rng(seed) {}

  Budget calculateBudget(const NationView& nation, const Order& order);
  Validation validateOrder(const NationView& nation, const Order& order, bool locked = false);

  int rollDice() { return std::uniform_int_distribution<int>(1, 6)(rng); }

  bool checkTreaty(const std::string& treatyType, int roll);
  bool checkBlockade(const std::string& target, int roll);

private:
  std::mt19937 rng;
};

int unitIndex(const char* code);
int resourceIndex(const char* name);
int developIc(const NationView& nation, int resourceIdx);

}
